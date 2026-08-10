import 'server-only';

import { HTTP_HEADERS } from '@/shared/constants/http';

/**
 * Origin verification for Route Handlers (requirement 15).
 *
 * Server Actions do not need this — Next verifies `Origin` against `Host` for every action
 * POST and rejects mismatches itself. Route Handlers get no such treatment: a `POST
 * /api/anything` from `evil.com` reaches the handler with the user's cookies attached unless
 * something checks.
 *
 * `SameSite=Lax` on the session cookie already blocks the classic form-POST CSRF, so this is
 * defence in depth rather than the only line. It matters for the cases Lax does not cover:
 * a `GET` handler with a side effect, and browsers where the Lax default is not applied.
 */

export interface OriginCheckInput {
 headers: Headers;
 /** From `env.server.HTTP_ALLOWED_ORIGINS`, plus the app's own origin. */
 allowedOrigins: readonly string[];
}

/**
 * True when the request came from an origin we trust.
 *
 * `Origin` is preferred over `Referer`: it is sent on every cross-origin request including
 * ones where `Referer` is suppressed by a referrer policy, and it cannot be forged by page
 * script. A missing `Origin` on a state-changing request is treated as **untrusted** — the
 * permissive reading is how this check gets bypassed.
 */
export function isTrustedOrigin({ headers, allowedOrigins }: OriginCheckInput): boolean {
 const origin = headers.get(HTTP_HEADERS.origin);
 if (!origin) return false;

 return allowedOrigins.some((allowed) => allowed === origin);
}

/**
 * Same-origin check for requests that only need to reject an obvious cross-site call.
 *
 * Compares against the `Host` the request actually arrived on rather than a configured URL,
 * so it keeps working across preview deployments where the hostname is generated per branch.
 */
export function isSameOriginRequest(headers: Headers): boolean {
 const origin = headers.get(HTTP_HEADERS.origin);
 const host = headers.get(HTTP_HEADERS.host);
 if (!origin || !host) return false;

 try {
 return new URL(origin).host === host;
 } catch {
 // A malformed Origin is not a trusted one.
 return false;
 }
}
