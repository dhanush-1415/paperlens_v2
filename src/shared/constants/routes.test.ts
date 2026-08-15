import { describe, expect, it } from 'vitest';

import {
 DEFAULT_AUTHENTICATED_ROUTE,
 DEFAULT_UNAUTHENTICATED_ROUTE,
 ROUTE_ACCESS,
 ROUTES,
 isAuthOnlyPath,
 isProtectedPath,
} from './routes';

/**
 * The route registry.
 *
 * Two failure modes are worth a test here, and neither is caught by `typedRoutes`.
 *
 * The first is encoding. `typedRoutes` checks that `/document/[id]` exists; it does not check
 * what happens when `id` contains a slash. A share token or a folder name that came from user
 * data and went into a template literal produces a URL pointing at a different route
 * entirely — and for `share` that is a token boundary, not a cosmetic problem.
 *
 * The second is the prefix matcher `proxy.ts` uses. `isProtectedPath('/scan-results')` must be
 * false: a naive `startsWith` says true, and the result is a public page that redirects
 * signed-out visitors to login for no reason. The inverse — a protected prefix that fails to
 * match its own children — is the one that actually leaks, so both directions are asserted.
 */

describe('parameterised routes', () => {
 it('encodes every dynamic segment', () => {
 // The value came from a document title, a folder name, or a token. Any of the three can
 // contain a slash, and a slash here is a different route.
 expect(ROUTES.document('a/b')).toBe('/document/a%2Fb');
 expect(ROUTES.vaultFolder('Rental 2024/Q1')).toBe('/vault/folder/Rental%202024%2FQ1');
 expect(ROUTES.share('tok/en?x=1')).toBe('/share/tok%2Fen%3Fx%3D1');
 expect(ROUTES.blogPost('a b')).toBe('/blog/a%20b');
 expect(ROUTES.guide('rental/agreements')).toBe('/for/rental%2Fagreements');
 });

 it('cannot be walked out of with a traversal segment', () => {
 // `/document/../settings` would otherwise resolve to `/settings`.
 expect(ROUTES.document('../settings')).toBe('/document/..%2Fsettings');
 });

 it('produces the plain path for an ordinary id', () => {
 expect(ROUTES.document('doc_01H8')).toBe('/document/doc_01H8');
 });

 it('starts every route at the origin root', () => {
 // A relative href resolves against the *current* path, so the same link means a different
 // thing depending on where it is rendered.
 const values = Object.values(ROUTES).map((route) =>
 typeof route === 'function' ? route('x') : route,
 );

 for (const value of values) expect(value.startsWith('/'), value).toBe(true);
 });

 it('gives every route a distinct path', () => {
 const values = Object.values(ROUTES).map((route) =>
 typeof route === 'function' ? route('x') : route,
 );

 expect(new Set(values).size).toBe(values.length);
 });
});

describe('isProtectedPath', () => {
 it('matches a protected route and its children', () => {
 expect(isProtectedPath('/vault')).toBe(true);
 expect(isProtectedPath('/vault/folder/f1')).toBe(true);
 expect(isProtectedPath(ROUTES.document('doc_1'))).toBe(true);
 });

 it('does not match a public path that merely shares a prefix', () => {
 // `startsWith('/scan')` says true. `/scan-results` is a different route, and treating it
 // as protected sends signed-out visitors to login from a page meant to be public.
 expect(isProtectedPath('/scanner')).toBe(false);
 expect(isProtectedPath('/settings-guide')).toBe(false);
 });

 it('leaves the marketing surface alone', () => {
 for (const path of ['/', '/pricing', '/blog/some-post', '/share/tok']) {
 expect(isProtectedPath(path), path).toBe(false);
 }
 });
});

describe('isAuthOnlyPath', () => {
 it('matches the sign-in surface', () => {
 expect(isAuthOnlyPath('/login')).toBe(true);
 expect(isAuthOnlyPath('/signup')).toBe(true);
 expect(isAuthOnlyPath('/forgot-password')).toBe(true);
 });

 it('does not match a path that only starts the same way', () => {
 expect(isAuthOnlyPath('/logout')).toBe(false);
 expect(isAuthOnlyPath('/registered-agents')).toBe(false);
 });

 it('never claims a protected path', () => {
 // A path in both lists would make the proxy redirect in a loop: signed out → login,
 // signed in → app, and back again on the next request.
 for (const path of ROUTE_ACCESS.protected) {
 expect(isAuthOnlyPath(path), path).toBe(false);
 }
 for (const path of ROUTE_ACCESS.authOnly) {
 expect(isProtectedPath(path), path).toBe(false);
 }
 });
});

describe('landing routes', () => {
 it('sends a signed-in user somewhere that requires a session', () => {
 // Landing on a public page after sign-in leaves the user to find the product themselves.
 expect(isProtectedPath(DEFAULT_AUTHENTICATED_ROUTE)).toBe(true);
 });

 it('sends a signed-out user somewhere that does not', () => {
 // Otherwise sign-out redirects to a protected route, which redirects back to login — a
 // loop that looks like a broken sign-out button.
 expect(isProtectedPath(DEFAULT_UNAUTHENTICATED_ROUTE)).toBe(false);
 expect(isAuthOnlyPath(DEFAULT_UNAUTHENTICATED_ROUTE)).toBe(false);
 });
});
