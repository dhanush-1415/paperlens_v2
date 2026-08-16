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
 * error reporter all agree on one identifier for this request, and on the *response* so
 * a user can quote it from devtools.
 * 2. Publishes the resolved pathname as a header, because a layout cannot read the URL.
 * 3. Redirects signed-out visitors away from protected paths, and signed-in ones away from
 * the sign-in page.
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

import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  console.log('[DEBUG-TRACE] proxy.ts: middleware executing for path', request.nextUrl.pathname);
  const { pathname, search } = request.nextUrl;

  const correlation = request.headers.get(HTTP_HEADERS.correlationId) ?? correlationId();

  const requestHeaders: Record<string, string> = {
    [HTTP_HEADERS.correlationId]: correlation,
    [HTTP_HEADERS.pathname]: pathname,
  };

  const isProtected = isProtectedPath(pathname);
  const isAuth = isAuthOnlyPath(pathname);

  // 1. Fast path: skip Supabase entirely for public routes
  if (!isProtected && !isAuth) {
    return applyResponseHeaders(withRequestHeaders(request, requestHeaders), correlation);
  }

  // 2. Cookie overflow guard
  const cookieHeader = request.headers.get('cookie') ?? '';
  if (cookieHeader.length > 7000) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    loginUrl.searchParams.set('error', 'session_reset');
    const recovery = applyResponseHeaders(NextResponse.redirect(loginUrl), correlation);
    request.cookies.getAll()
      .filter((c) => c.name.startsWith('sb-'))
      .forEach((c) => recovery.cookies.delete(c.name));
    return recovery;
  }

  // 3. Supabase cookie forwarding
  let supabaseResponse = withRequestHeaders(request, requestHeaders);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return applyResponseHeaders(supabaseResponse, correlation);
  }

  let supabase;
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = withRequestHeaders(request, requestHeaders);
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
  } catch (error) {
    console.error('[DEBUG-TRACE] proxy.ts: Supabase client initialization failed:', error);
    return applyResponseHeaders(supabaseResponse, correlation);
  }

  // 4. Auth check
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (authError) {
    console.error('[DEBUG-TRACE] proxy.ts: Supabase getUser failed:', authError);
  }

  // Protected routes
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    loginUrl.search = '';
    loginUrl.searchParams.set(
      QUERY_PARAMS.redirectTo,
      sanitizeRedirectTo(`${pathname}${search}`, ROUTES.home)
    );
    return applyResponseHeaders(NextResponse.redirect(loginUrl), correlation);
  }

  // Auth pages
  if (user && isAuth) {
    const target = request.nextUrl.clone();
    target.pathname = DEFAULT_AUTHENTICATED_ROUTE;
    target.search = '';
    return applyResponseHeaders(NextResponse.redirect(target), correlation);
  }

  return applyResponseHeaders(supabaseResponse, correlation);
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
 * manifest — a computed value throws.
 * · `_next/data` requests invoke the proxy **regardless of whether the pattern excludes
 * them**. Next documents this as intentional, to prevent exactly the class of bug where
 * a data route quietly escapes a check its page was subject to. Do not rely on a
 * negative match to skip them.
 */
 matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
