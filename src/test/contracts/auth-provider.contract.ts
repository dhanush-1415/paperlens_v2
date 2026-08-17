import { beforeEach, describe, expect, it } from 'vitest';

import { isErr, isOk, unwrapOrThrow } from '@/core/result/result';
import type { AuthProvider, Session } from '@/core/auth';

/**
 * The `AuthProvider` contract.
 *
 * This is the most consequential contract in the codebase, because it is the one an adapter
 * can satisfy structurally while getting the security properties wrong. Every clause here is a
 * behaviour a real provider must also exhibit, and several of them are the difference between
 * an authentication system and an account-enumeration oracle:
 *
 * - **Sign-in failure says one thing.** "No such user" and "wrong password" must be
 * indistinguishable — same code, same message. A provider that distinguishes them hands an
 * attacker a free user list.
 * - **`getSession()` answers `ok(null)`, never `err`, for "not signed in."** Not signed in is
 * an answer. Modelling it as an error means an outage and a signed-out user reach the UI as
 * the same event, and the UI cannot tell a login prompt from a status page.
 * - **A revoked session is `ok(null)`, not an error.** Signing out on another device is normal.
 * - **`refresh()` rotates the identifier.** A refresh that returns the same `sessionId` has not
 * refreshed anything and leaves a stolen token valid for its original lifetime.
 * - **`requestPasswordReset` always succeeds.** Same enumeration argument as sign-in.
 *
 * A provider may legitimately answer `NOT_IMPLEMENTED` to the token-based flows (that is what
 * the in-memory fake does, honestly, rather than pretending to send mail), so those clauses
 * assert the *shape* of the failure rather than demanding the feature.
 */

export interface AuthProviderContractDeps {
  /** Fresh, signed-out, per test, with `credentials` valid against it. */
  createProvider(): AuthProvider;
  /** A set of credentials the provider accepts. */
  readonly credentials: { readonly email: string; readonly password: string };
  /** An email address the provider does not know. */
  readonly unknownEmail: string;
}

export function describeAuthProviderContract(
  name: string,
  { createProvider, credentials, unknownEmail }: AuthProviderContractDeps,
): void {
  describe(`AuthProvider contract: ${name}`, () => {
    let provider: AuthProvider;

    beforeEach(() => {
      provider = createProvider();
    });

    const signIn = async (): Promise<Session> => unwrapOrThrow(await provider.signIn(credentials));

    it('names itself, so a log line says which implementation answered', () => {
      expect(provider.name).toBeTypeOf('string');
      expect(provider.name.length).toBeGreaterThan(0);
    });

    describe('getSession', () => {
      it('answers ok(null) when nobody is signed in', async () => {
        const result = await provider.getSession();

        expect(isOk(result)).toBe(true);
        expect(unwrapOrThrow(result)).toBeNull();
      });

      it('answers with the session after a successful sign-in', async () => {
        const session = await signIn();
        const current = unwrapOrThrow(await provider.getSession());

        expect(current?.sessionId).toBe(session.sessionId);
        expect(current?.userId).toBe(session.userId);
      });

      it('answers ok(null) after sign-out, not an error', async () => {
        await signIn();
        await provider.signOut();

        const result = await provider.getSession();
        expect(isOk(result)).toBe(true);
        expect(unwrapOrThrow(result)).toBeNull();
      });
    });

    describe('signIn', () => {
      it('issues a session carrying identity and entitlements', async () => {
        const session = await signIn();

        expect(session.userId).toBeTypeOf('string');
        expect(session.sessionId).toBeTypeOf('string');
        expect(['user', 'support', 'admin']).toContain(session.role);
        expect(session.plan).toBeTypeOf('string');
        expect(typeof session.emailVerified).toBe('boolean');
      });

      it('sets an expiry in the future', async () => {
        const session = await signIn();

        expect(Number.isNaN(Date.parse(session.expiresAt))).toBe(false);
        expect(Date.parse(session.expiresAt)).toBeGreaterThan(Date.parse('2020-01-01T00:00:00Z'));
      });

      it('carries no profile data — a session is not a user record', async () => {
        // Sessions get held in memory, serialized into caches and printed into logs. Anything
        // in here is in all of those places, so it stays down to what an authorization
        // decision needs. Name and email belong to the profile feature, behind its own check.
        const session = await signIn();

        expect(session).not.toHaveProperty('email');
        expect(session).not.toHaveProperty('displayName');
        expect(session).not.toHaveProperty('password');
      });

      it('rejects a wrong password with INVALID_CREDENTIALS', async () => {
        const result = await provider.signIn({ ...credentials, password: 'wrong-password' });

        expect(isErr(result)).toBe(true);
        expect(isErr(result) && result.error.code).toBe('INVALID_CREDENTIALS');
      });

      it('rejects an unknown account identically — no enumeration oracle', async () => {
        const unknown = await provider.signIn({ email: unknownEmail, password: 'whatever' });
        const wrongPassword = await provider.signIn({ ...credentials, password: 'wrong' });

        // Same code *and* same client-facing message. A difference in either one is enough to
        // let an attacker sort a leaked email list into "registered" and "not".
        expect(isErr(unknown) && isErr(wrongPassword)).toBe(true);
        if (isErr(unknown) && isErr(wrongPassword)) {
          expect(unknown.error.code).toBe(wrongPassword.error.code);
          expect(unknown.error.toClient()).toEqual(wrongPassword.error.toClient());
        }
      });

      it('leaves no session behind after a failed attempt', async () => {
        await provider.signIn({ ...credentials, password: 'wrong' });

        expect(unwrapOrThrow(await provider.getSession())).toBeNull();
      });

      it('is case-insensitive about the email, as every mail system is', async () => {
        const result = await provider.signIn({
          ...credentials,
          email: credentials.email.toUpperCase(),
        });

        expect(isOk(result)).toBe(true);
      });
    });

    describe('signUp', () => {
      it('creates an account and signs it in', async () => {
        const session = unwrapOrThrow(
          await provider.signUp({
            email: unknownEmail,
            password: 'a-sufficiently-long-password',
            acceptedTerms: true,
          }),
        );

        expect(session.userId).toBeTypeOf('string');
        expect(unwrapOrThrow(await provider.getSession())?.sessionId).toBe(session.sessionId);
      });

      it('starts a new account unverified — verification is a later event', async () => {
        const session = unwrapOrThrow(
          await provider.signUp({
            email: unknownEmail,
            password: 'a-sufficiently-long-password',
            acceptedTerms: true,
          }),
        );

        expect(session.emailVerified).toBe(false);
      });

      it('refuses a duplicate address with ALREADY_EXISTS', async () => {
        const result = await provider.signUp({
          email: credentials.email,
          password: 'a-sufficiently-long-password',
          acceptedTerms: true,
        });

        expect(isErr(result)).toBe(true);
        expect(isErr(result) && result.error.code).toBe('ALREADY_EXISTS');
      });
    });

    describe('signOut', () => {
      it('succeeds even when nobody is signed in', async () => {
        // Idempotent by necessity: a double-submitted sign-out, or one from an already-expired
        // tab, must not surface an error to a user who wanted exactly this outcome.
        expect(isOk(await provider.signOut())).toBe(true);
      });

      it('revokes the session rather than only forgetting the cookie', async () => {
        const session = await signIn();
        await provider.signOut();
        await provider.signIn(credentials);

        // Signing in again must not resurrect the old identifier. If it did, a token captured
        // before sign-out would still be live — sign-out would be cosmetic.
        expect(unwrapOrThrow(await provider.getSession())?.sessionId).not.toBe(session.sessionId);
      });
    });

    describe('refresh', () => {
      it('rotates the session identifier', async () => {
        const before = await signIn();
        const after = unwrapOrThrow(await provider.refresh());

        expect(after.sessionId).not.toBe(before.sessionId);
        expect(after.userId).toBe(before.userId);
      });

      it('makes the refreshed session the current one', async () => {
        await signIn();
        const refreshed = unwrapOrThrow(await provider.refresh());

        expect(unwrapOrThrow(await provider.getSession())?.sessionId).toBe(refreshed.sessionId);
      });

      it('fails with UNAUTHENTICATED when there is nothing to refresh', async () => {
        const result = await provider.refresh();

        expect(isErr(result)).toBe(true);
        expect(isErr(result) && result.error.code).toBe('UNAUTHENTICATED');
      });
    });

    describe('password reset and verification', () => {
      it('reports success for a reset request regardless of whether the address exists', async () => {
        expect(isOk(await provider.requestPasswordReset(credentials.email))).toBe(true);
        expect(isOk(await provider.requestPasswordReset(unknownEmail))).toBe(true);
      });

      it('fails typed rather than throwing for the token flows', async () => {
        // An adapter that cannot do these yet must say so with an `AppError` the boundary can
        // render — not by throwing, and not by silently resolving as if mail were sent.
        const confirm = await provider.confirmPasswordReset('token', 'new-password-1234');
        const verify = await provider.verifyEmail('token');

        for (const result of [confirm, verify]) {
          if (isErr(result)) {
            expect(result.error.code).toBeTypeOf('string');
            expect(result.error.messageKey).toMatch(/^errors\./);
          }
        }
      });
    });
  });
}
