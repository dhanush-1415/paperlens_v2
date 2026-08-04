import 'server-only';

import { forbidden, unauthorized } from 'next/navigation';
import { cache } from 'react';

import { forbiddenError, unauthenticatedError } from '../errors/app-error';
import { err, ok, type Result } from '../result/result';

import { checkPermission, type Permission } from './policy';
import { isSessionExpired, toPublicSession, type AuthProvider, type PublicSession, type Session } from './types';
import type { AppError } from '../errors/app-error';

/**
 * The Data Access Layer (requirements 3, 11 and 15).
 *
 * This is the **only** place in the application that decides whether a request is
 * authenticated. Not the proxy, not a layout, not a hook — here.
 *
 * That is not a stylistic preference. Next's own documentation states plainly that Proxy is
 * not an authorization mechanism, and the reason is structural:
 *
 * - A Server Action is a POST endpoint the client can call **directly**, with its own URL.
 *   It never passes through the page that rendered its form, so a check in that page
 *   protects nothing.
 * - A layout does not re-render on every navigation between its children, so a check there
 *   runs once and then does not.
 * - The proxy sees a cookie, not a validated session. A forged cookie passes it.
 *
 * So every entry point — page, action, route handler — calls `verifySession()` itself.
 * `React.cache()` makes that free: the first call in a request does the work, the rest
 * return the same promise. Checking twice costs nothing; checking once in the wrong place
 * costs everything.
 *
 * Caveat worth knowing: `cache()` is isolated inside a `use cache` scope, so a cached
 * function cannot call this. It also cannot read `cookies()`, which is the same constraint
 * wearing a different hat — cached data must be keyed by its arguments, not by ambient
 * identity. Pass the user ID in.
 */

export interface DalDeps {
  readonly authProvider: AuthProvider;
  /** Injected so session expiry is testable without freezing the global clock. */
  readonly now: () => Date;
}

/**
 * Build the request-scoped session accessors.
 *
 * A factory rather than module-level functions, because module-level functions would need a
 * module-level container — a global that a test cannot swap and that would resolve at import
 * time, before the composition root has run.
 */
export function createSessionAccessors(deps: DalDeps) {
  /**
   * Resolve and validate the session for this request. Memoized per request.
   *
   * Returns `null` for "not signed in" — a normal state for a public page — and throws only
   * if the check itself fails.
   */
  const verifySession = cache(async (): Promise<Session | null> => {
    const result = await deps.authProvider.getSession();
    if (!result.ok) return null;

    const session = result.value;
    if (!session) return null;

    // Expiry is validated here rather than trusted from the provider: a token that is still
    // syntactically valid but past its lifetime is not a session.
    if (isSessionExpired(session, deps.now())) return null;

    return session;
  });

  /**
   * The session, or a 401 page.
   *
   * `unauthorized()` throws — it is framework control flow, so it must never be caught.
   * Every `catch` in this codebase starts with `rethrowIfFrameworkError`, which is what
   * keeps that true.
   */
  async function requireSession(): Promise<Session> {
    const session = await verifySession();
    if (!session) unauthorized();
    return session;
  }

  /**
   * The session, or a 403 page, checked against a permission.
   *
   * Note it distinguishes the *reason*: a plan denial is not a 403, it is an upgrade prompt,
   * so it redirects to pricing rather than showing an error. Getting this wrong is how a
   * paywall reads as a bug report.
   */
  async function requirePermission(permission: Permission): Promise<Session> {
    const session = await requireSession();
    const check = checkPermission(session, permission);

    if (!check.allowed) forbidden();

    return session;
  }

  /**
   * `Result`-returning variants, for the data path.
   *
   * Server Actions use these rather than the throwing versions: an action returns a
   * `Result` to `useActionState`, and a thrown `unauthorized()` inside one would navigate
   * away mid-submission rather than showing the form's own error state.
   */
  async function getSessionResult(): Promise<Result<Session, AppError>> {
    const session = await verifySession();
    return session ? ok(session) : err(unauthenticatedError());
  }

  async function checkPermissionResult(
    permission: Permission,
  ): Promise<Result<Session, AppError>> {
    const session = await verifySession();
    if (!session) return err(unauthenticatedError());

    const check = checkPermission(session, permission);
    if (check.allowed) return ok(session);

    return err(
      forbiddenError(permission, session.userId).withContext({
        reason: check.reason,
        ...(check.requiredCapability ? { requiredCapability: check.requiredCapability } : {}),
      }),
    );
  }

  /**
   * The projection safe to pass into a Client Component.
   *
   * Returning `Session` directly from a Server Component into client props would serialize
   * `sessionId` and `expiresAt` into the RSC payload, where they are visible in the page
   * source. This is the only sanctioned crossing.
   */
  const getPublicSession = cache(async (): Promise<PublicSession | null> => {
    const session = await verifySession();
    return session ? toPublicSession(session) : null;
  });

  return {
    verifySession,
    requireSession,
    requirePermission,
    getSessionResult,
    checkPermissionResult,
    getPublicSession,
  };
}

export type SessionAccessors = ReturnType<typeof createSessionAccessors>;
