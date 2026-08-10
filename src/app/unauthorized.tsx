import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants';
import { Button, Container, ShieldIcon, StatusBlock } from '@/shared/ui';

/**
 * 401 — signed out, or a session that has expired (requirement 3).
 *
 * Rendered when `unauthorized()` is thrown, which happens in exactly one place:
 * `requireSession()` in `core/auth/dal.ts`. Nothing else in the codebase throws it, because
 * nothing else is allowed to decide whether a request is authenticated.
 *
 * ### Why this exists alongside the proxy redirect
 *
 * `proxy.ts` already bounces an unauthenticated visitor to the sign-in page, so a user
 * browsing normally will rarely see this. It exists for everything that does not go through
 * the proxy's matcher or its cookie heuristic:
 *
 * · **Server Actions.** Next documents these as POSTs to the route they are declared in,
 * not as routes of their own — a matcher that excludes a path also skips the action. They
 * are directly reachable and must re-verify.
 * · **A cookie that exists but no longer validates.** The proxy checks for *presence*, which
 * is all it can afford to do; only the DAL checks expiry and signature.
 * · **Route Handlers and RSC payload requests** that a crafted client can call directly.
 *
 * The proxy is a redirect optimisation. This page is what happens when the real check runs.
 *
 * Per the framework contract, this file receives **no props** — there is no error object and
 * no request to inspect.
 */
export const metadata: Metadata = {
 title: 'Sign in required',
 robots: { index: false, follow: false },
};

export default function Unauthorized() {
 return (
 <Container as="main" className="flex flex-1 flex-col justify-center py-24">
 {/*
 * `neutral`, not a risk tone. `critical`/`caution`/`safe` are reserved by the design
 * system for risk found in the *user's document* — borrowing the red for an expired
 * session would make "this contract has a critical clause" and "please sign in" look
 * like the same severity. The icon carries the meaning instead.
 */}
 <StatusBlock
 tone="neutral"
 icon={<ShieldIcon className="size-5" />}
 title="Please sign in to continue"
 description="Your session has ended, or this page needs an account. Signing in again takes a moment and brings you straight back."
 actions={
 <Button asChild>
 {/*
 * Home rather than the sign-in route: authentication pages do not exist yet, and
 * `typedRoutes` makes linking to a route that has no page a compile error — which
 * is precisely the guarantee we want. This link becomes `ROUTES.login` with a
 * `redirectTo` parameter the moment that page lands.
 */}
 <Link href={ROUTES.home}>Go to sign in</Link>
 </Button>
 }
 />
 </Container>
 );
}
