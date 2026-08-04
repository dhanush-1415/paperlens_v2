import { NextResponse, type NextRequest } from 'next/server';

import { isDevelopment } from '@/config/runtime';
import { buildContentSecurityPolicy, CSP_STRATEGY } from '@/core/security';
import { COOKIE_NAMES, HTTP_HEADERS, QUERY_PARAMS, sanitizeRedirectTo } from '@/shared/constants';
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  isAuthOnlyPath,
  isProtectedPath,
  ROUTES,
} from '@/shared/constants/routes';
import { correlationId } from '@/shared/utils/id';

/**
 * The proxy — formerly middleware, renamed in Next 16.
 *
 * # This file is not authorization.
 *
 * That sentence is the most important thing in this module, so it is first. Next's own
 * documentation calls the proxy a last resort and states plainly that **Server Functions
 * are not separate routes in this chain** — they are POSTs to the route that declares them,
 * so a matcher which excludes a path also skips every Server Action on it. A proxy check is
 * therefore trivially bypassable by anything that can issue an HTTP request.
 *
 * Authorization lives in `core/auth/dal.ts`, runs per request, and is repeated inside every
 * Server Action. What happens here is an **optimistic redirect**: a cheap cookie-presence
 * test that saves an unauthenticated visitor a round trip to a page that would have bounced
 * them anyway. If this file were deleted, the application would still be secure — it would
 * just be slower and uglier for signed-out users. That is the correct amount of load for a
 * proxy to bear.
 *
 * ### The isolation rule
 *
 * The docs are explicit that the proxy "is meant to be invoked separately of your render
 * code… you should not attempt relying on shared modules or globals." So this file resolves
 * nothing from the DI container, imports no server bootstrap, and touches no
 * `AsyncLocalStorage`. Everything it imports is a pure constant or a pure function. That
 * restraint is why it is safe on any runtime and cheap on every request.
 *
 * ### What it actually does
 *
 * 1. Mints a correlation ID and puts it on the *request* so the render, the logger and the
 *    error reporter all agree on one identifier for this request, and on the *response* so
 *    a user can quote it from devtools.
 * 2. Publishes the resolved pathname as a header, because a layout cannot read the URL.
 * 3. Redirects signed-out visitors away from protected paths, and signed-in ones away from
 *    the sign-in page.
 * 4. Sets the Content-Security-Policy.
 */

/**
 * Headers that must reach the rendering server.
 *
 * `NextResponse.next({ request: { headers } })` rewrites what the *upstream* sees;
 * `NextResponse.next({ headers })` sets what the *client* sees. They are different objects
 * and confusing them is the usual reason a header "disappears" between the proxy and a
 * route handler. Keep both small — headers travel on every request and a large one earns a
 * 431.
 */
function withRequestHeaders(request: NextRequest, extra: Record<string, string>): NextResponse {
  const headers = new Headers(request.headers);
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);

  return NextResponse.next({ request: { headers } });
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  /**
   * Reuse an inbound correlation ID rather than minting a second one.
   *
   * A request that arrived through a gateway, a load balancer or our own HTTP client already
   * carries an ID. Generating a new one here would break the trace at exactly the boundary
   * a trace exists to cross.
   */
  const correlation = request.headers.get(HTTP_HEADERS.correlationId) ?? correlationId();

  const requestHeaders: Record<string, string> = {
    [HTTP_HEADERS.correlationId]: correlation,
    // Layouts cannot access the raw request or the URL — they are cached client-side and
    // would go stale. This is the supported way to give them the current path.
    [HTTP_HEADERS.pathname]: pathname,
  };

  /**
   * The optimistic session check.
   *
   * *Presence*, not validity. Verifying a session here would mean a signature check or a
   * network call on every request including static assets, and it would still have to be
   * repeated in the DAL — the proxy's answer is stale the moment it is given. So this asks
   * the only question it can answer cheaply and honestly: does the user look signed in?
   *
   * The failure modes are both benign. A stale cookie lets someone through to a page whose
   * `requireSession()` immediately shows them `unauthorized.tsx`. A missing cookie on a
   * genuinely signed-in user costs one redirect.
   */
  const hasSessionHint = request.cookies.has(COOKIE_NAMES.sessionHint);

  if (!hasSessionHint && isProtectedPath(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = ROUTES.login;
    target.search = '';
    /**
     * `sanitizeRedirectTo` rejects anything that is not a same-origin absolute path —
     * including protocol-relative `//evil.example`, which looks like a path and is not.
     * Without it, `?redirectTo=` is an open redirect, which is the oldest phishing primitive
     * there is: the victim signs in on the real domain and is handed to the attacker's.
     */
    target.searchParams.set(
      QUERY_PARAMS.redirectTo,
      sanitizeRedirectTo(`${pathname}${search}`, ROUTES.home),
    );

    return applyResponseHeaders(NextResponse.redirect(target), correlation);
  }

  /**
   * The reverse: a signed-in user landing on the sign-in page. Sending them to the app is
   * what every product they have used already does, and doing it here rather than in the
   * page saves a render of a form they will never submit.
   */
  if (hasSessionHint && isAuthOnlyPath(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = DEFAULT_AUTHENTICATED_ROUTE;
    target.search = '';

    return applyResponseHeaders(NextResponse.redirect(target), correlation);
  }

  return applyResponseHeaders(withRequestHeaders(request, requestHeaders), correlation);
}

/**
 * Response headers, applied on every path out of this function including the redirects.
 *
 * The static security headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy` and the
 * rest) come from `next.config.ts`, which applies them at the platform level where they
 * cannot be forgotten. Only the CSP is set here, because under the `'strict-nonce'` strategy
 * it must vary per response and a config-level header cannot.
 */
function applyResponseHeaders(response: NextResponse, correlation: string): NextResponse {
  response.headers.set(HTTP_HEADERS.correlationId, correlation);

  /**
   * CSP, and the trade-off it forces (requirement 15).
   *
   * A nonce must be unique per response, which means any component that reads it becomes
   * dynamic — and the root layout reads it, so `'strict-nonce'` opts the *entire application*
   * out of the static shell that `cacheComponents` exists to produce. `'compatible'` keeps
   * the shell and accepts a weaker `script-src`.
   *
   * This is a genuine choice between two goods, recorded in `docs/adr/0009-csp-strategy.md`
   * rather than settled by whichever was easier. Flipping the constant is the whole change;
   * the layout comment explains what else must move with it.
   */
  response.headers.set(
    'Content-Security-Policy',
    buildContentSecurityPolicy({ isDev: isDevelopment }),
  );

  if (CSP_STRATEGY === 'strict-nonce' && isDevelopment) {
    // A loud reminder rather than a silent half-configuration: the strategy is set but the
    // layout is not reading a nonce, so scripts would be blocked.
    response.headers.set('x-csp-note', 'strict-nonce requires the root layout to read the nonce');
  }

  return response;
}

export const config = {
  /**
   * Everything except the paths where a proxy can only cost time.
   *
   * `_next/static` and `_next/image` are served by the framework and immutable;
   * `favicon.ico`, `robots.txt` and `sitemap.xml` are static files. Running this function
   * for each of them would add work to every asset on every page load and change nothing
   * about the response.
   *
   * Two things worth knowing about this matcher:
   *
   * · It must be a **static constant**. Next parses it at build time to generate the route
   *   manifest — a computed value throws.
   * · `_next/data` requests invoke the proxy **regardless of whether the pattern excludes
   *   them**. Next documents this as intentional, to prevent exactly the class of bug where
   *   a data route quietly escapes a check its page was subject to. Do not rely on a
   *   negative match to skip them.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
