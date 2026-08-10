import type { AppError } from '../errors/app-error';
import type { Result } from '../result/result';
import type { PlanTier } from '@/shared/constants/limits';

/**
 * Authentication contracts (requirement 3).
 *
 * Deliberately provider-agnostic. Nothing here mentions a vendor, a cookie format, a JWT
 * claim or an OAuth flow — those are adapter concerns. When a real provider is wired in, it
 * implements `AuthProvider` and *no consumer changes*, which is the only test of whether an
 * abstraction is real.
 *
 * The types are also deliberately narrow. A session carries the identity and the
 * entitlements needed to make an authorization decision, and nothing else: no email, no
 * name, no profile. Those are profile data, fetched by the feature that displays them,
 * subject to their own access checks. Fattening the session is how PII ends up in a cookie
 * and in every log line that prints one.
 */

export type UserRole = 'user' | 'support' | 'admin';

/** The authenticated subject. Safe to hold in memory on the server for a request. */
export interface Session {
 readonly userId: string;
 readonly role: UserRole;
 readonly plan: PlanTier;
 /** ISO 8601. Compared against a clock the caller supplies, never `Date.now()` inside. */
 readonly expiresAt: string;
 readonly tenantId?: string;
 /** True once the user has confirmed their email. Gates some capabilities. */
 readonly emailVerified: boolean;
 /** Opaque handle for revocation. Never a credential. */
 readonly sessionId: string;
}

/** What a Client Component is allowed to know. A strict subset — see `toPublicSession`. */
export interface PublicSession {
 readonly userId: string;
 readonly role: UserRole;
 readonly plan: PlanTier;
 readonly emailVerified: boolean;
}

export interface Credentials {
 readonly email: string;
 readonly password: string;
}

export interface SignUpInput extends Credentials {
 readonly displayName?: string;
 readonly acceptedTerms: boolean;
}

/**
 * The authentication port.
 *
 * Every method returns `Result` rather than throwing: "wrong password" is an expected
 * outcome of signing in, not an exceptional one, and modelling it as an exception is how it
 * ends up in a crash reporter.
 */
export interface AuthProvider {
 readonly name: string;

 /**
 * Resolve the current session from whatever the transport carries.
 *
 * Returns `ok(null)` for "no session", which is different from `err(...)` for "the check
 * itself failed". Conflating the two makes an outage look like a mass sign-out.
 */
 getSession(): Promise<Result<Session | null, AppError>>;

 signIn(credentials: Credentials): Promise<Result<Session, AppError>>;
 signUp(input: SignUpInput): Promise<Result<Session, AppError>>;
 signOut(): Promise<Result<void, AppError>>;

 /** Extend a session that is close to expiry. */
 refresh(): Promise<Result<Session, AppError>>;

 requestPasswordReset(email: string): Promise<Result<void, AppError>>;
 confirmPasswordReset(token: string, password: string): Promise<Result<void, AppError>>;
 verifyEmail(token: string): Promise<Result<void, AppError>>;
}

/**
 * Where session material lives between requests.
 *
 * Split from `AuthProvider` because the two vary independently: the same credential
 * verification can be backed by an httpOnly cookie, a header, or an in-memory map in a test.
 */
export interface SessionStore {
 readonly name: string;
 read(): Promise<string | null>;
 write(token: string, maxAgeSeconds: number): Promise<void>;
 clear(): Promise<void>;
}

/** Narrow a `Session` to what may cross to the client. The only sanctioned way to do so. */
export function toPublicSession(session: Session): PublicSession {
 return {
 userId: session.userId,
 role: session.role,
 plan: session.plan,
 emailVerified: session.emailVerified,
 };
}

export function isSessionExpired(session: Session, now: Date): boolean {
 return new Date(session.expiresAt).getTime() <= now.getTime();
}
