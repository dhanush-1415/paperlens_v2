import { beforeEach, describe, expect, it } from 'vitest';

import type { SessionStore } from '@/core/auth';

/**
 * The `SessionStore` contract.
 *
 * Three methods, and the whole of the contract is that they compose: what `write` put there,
 * `read` returns, and `clear` removes. It is small enough to look trivial — which is exactly
 * why it is written down. A cookie-backed store that silently drops a write (wrong `path`, a
 * `secure` flag on plaintext localhost) satisfies the *type* perfectly and presents to the
 * user as "signing in does nothing". The types cannot catch that; this can.
 */

export interface SessionStoreContractDeps {
 /** Fresh, empty, per test. */
 createStore(): SessionStore;
}

export function describeSessionStoreContract(
 name: string,
 { createStore }: SessionStoreContractDeps,
): void {
 describe(`SessionStore contract: ${name}`, () => {
 let store: SessionStore;

 beforeEach(() => {
 store = createStore();
 });

 it('names itself', () => {
 expect(store.name).toBeTypeOf('string');
 expect(store.name.length).toBeGreaterThan(0);
 });

 it('reads null before anything is written', async () => {
 expect(await store.read()).toBeNull();
 });

 it('reads back what was written', async () => {
 await store.write('token-abc', 3600);
 expect(await store.read()).toBe('token-abc');
 });

 it('replaces rather than accumulates — one session per store', async () => {
 await store.write('first', 3600);
 await store.write('second', 3600);

 expect(await store.read()).toBe('second');
 });

 it('reads null after clear', async () => {
 await store.write('token-abc', 3600);
 await store.clear();

 expect(await store.read()).toBeNull();
 });

 it('tolerates clearing when there is nothing to clear', async () => {
 await expect(store.clear()).resolves.toBeUndefined();
 expect(await store.read()).toBeNull();
 });

 it('stores the token verbatim — it is opaque to this layer', async () => {
 // Base64url and JWT-shaped values both contain characters some encoders mangle. This
 // layer must not interpret, re-encode or trim any of it.
 const token = 'eyJhbGciOiJIUzI1NiJ9.e30.-signature_with-punctuation~';
 await store.write(token, 3600);

 expect(await store.read()).toBe(token);
 });
 });
}
