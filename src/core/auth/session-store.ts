import 'server-only';

import { cookies } from 'next/headers';

import { COOKIE_NAMES } from '@/shared/constants/storage-keys';
import { isProduction } from '@/config/runtime';

import type { SessionStore } from './types';

/**
 * Cookie-backed session store.
 *
 * The flags are the whole point of this file, so they are stated rather than assumed:
 *
 * - `httpOnly` — JavaScript cannot read it. An XSS that gets script execution still cannot
 * exfiltrate the session. This single flag is worth more than most of the rest of a
 * security programme.
 * - `secure` in production — never sent over plaintext HTTP. Off in development because
 * `localhost` is not HTTPS and a `secure` cookie there simply never arrives, which
 * presents as "login does nothing".
 * - `sameSite: 'lax'` — not sent on cross-site POSTs, which blocks the standard CSRF shape,
 * while still surviving a top-level navigation back from an OAuth redirect. `strict`
 * breaks that flow; `none` disables the protection entirely.
 * - `path: '/'` — one session for the app, so signing out clears it everywhere.
 *
 * `cookies()` is async in Next 16. Every method here awaits it; the synchronous form was
 * removed, not deprecated.
 */
export function createCookieSessionStore(
 cookieName: string = COOKIE_NAMES.sessionHint,
): SessionStore {
 return {
 name: 'cookie',

 async read(): Promise<string | null> {
 const store = await cookies();
 return store.get(cookieName)?.value ?? null;
 },

 async write(token: string, maxAgeSeconds: number): Promise<void> {
 const store = await cookies();
 store.set(cookieName, token, {
 httpOnly: true,
 secure: isProduction,
 sameSite: 'lax',
 path: '/',
 maxAge: maxAgeSeconds,
 });
 },

 async clear(): Promise<void> {
 const store = await cookies();
 store.delete(cookieName);
 },
 };
}

/**
 * In-memory store, for tests and for server-side code with no request context.
 *
 * Note it is *not* safe as a production store on a server: a module-level variable is shared
 * across every concurrent request in the process, so one user's session would leak to
 * another. That failure mode is why this is named plainly and kept beside the real one.
 */
export function createMemorySessionStore(initial: string | null = null): SessionStore {
 let token: string | null = initial;

 return {
 name: 'memory',
 read: () => Promise.resolve(token),
 write: (value) => {
 token = value;
 return Promise.resolve();
 },
 clear: () => {
 token = null;
 return Promise.resolve();
 },
 };
}
