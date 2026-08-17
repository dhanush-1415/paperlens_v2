import { AppError, unauthenticatedError } from '../errors/app-error';
import { err, ok, type Result } from '../result/result';
import { LIFETIME_SECONDS } from '@/shared/constants/time';
import { uuid } from '@/shared/utils/id';

import type {
  AuthProvider,
  Credentials,
  Session,
  SessionStore,
  SignUpInput,
  UserRole,
} from './types';
import type { PlanTier } from '@/shared/constants/limits';

/**
 * In-memory authentication provider.
 *
 * **This is a fake, and it is named like one.** It exists so the entire stack above it —
 * DAL, policy, actions, UI, tests — can be built and exercised before a real identity
 * provider is chosen, and so the swap, when it happens, is provably a one-line change in the
 * composition root.
 *
 * It is not a security boundary and must never serve real users. Two things make that hard
 * to miss: passwords are compared as plaintext (deliberately — a fake that *looks* like real
 * crypto is more dangerous than one that obviously isn't), and the composition root logs a
 * `fatal` on first resolve in a production build, naming this file. It does not yet *refuse*
 * to bind — there is nothing to fall back to, and a guard that has to be commented out to
 * ship is a guard that teaches people to comment out guards. See the note beside the
 * `AUTH_PROVIDER` registration in `src/server/bootstrap.ts`.
 *
 * What it *does* faithfully reproduce is the port's contract: expiry, revocation,
 * `ok(null)` for no session, typed errors for bad credentials. The shared contract suite in
 * `src/test/contracts` runs against this and against every future adapter, which is what
 * makes "swappable" a verified claim rather than an aspiration.
 */

export interface FakeUser {
  readonly id: string;
  readonly email: string;
  /** Plaintext. See the note above — this is intentional and load-bearing. */
  readonly password: string;
  readonly role: UserRole;
  readonly plan: PlanTier;
  readonly emailVerified: boolean;
  readonly displayName?: string;
}

export interface InMemoryAuthOptions {
  users?: readonly FakeUser[];
  store: SessionStore;
  now: () => Date;
  sessionLifetimeSeconds?: number;
}

export const DEMO_USERS: readonly FakeUser[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'demo@paperlens.test',
    password: 'demo-password-1234',
    role: 'user',
    plan: 'free',
    emailVerified: true,
    displayName: 'Demo User',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'pro@paperlens.test',
    password: 'demo-password-1234',
    role: 'user',
    plan: 'pro_monthly',
    emailVerified: true,
    displayName: 'Pro User',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'admin@paperlens.test',
    password: 'demo-password-1234',
    role: 'admin',
    plan: 'pro_yearly',
    emailVerified: true,
    displayName: 'Admin',
  },
];

export function createInMemoryAuthProvider(options: InMemoryAuthOptions): AuthProvider {
  const {
    users = DEMO_USERS,
    store,
    now,
    sessionLifetimeSeconds = LIFETIME_SECONDS.session,
  } = options;

  const accounts = new Map(users.map((user) => [user.email.toLowerCase(), { ...user }]));
  /** sessionId → Session. Revocation is deleting from here, as it would be with a real store. */
  const sessions = new Map<string, Session>();

  function issue(user: FakeUser): Session {
    const session: Session = {
      userId: user.id,
      role: user.role,
      plan: user.plan,
      emailVerified: user.emailVerified,
      sessionId: uuid(),
      expiresAt: new Date(now().getTime() + sessionLifetimeSeconds * 1_000).toISOString(),
    };
    sessions.set(session.sessionId, session);
    return session;
  }

  return {
    name: 'in-memory',

    async getSession(): Promise<Result<Session | null, AppError>> {
      const sessionId = await store.read();
      if (!sessionId) return ok(null);

      const session = sessions.get(sessionId);
      // A cookie pointing at a revoked session is "no session", not an error — the user
      // signed out on another device, which is a normal thing to have happened.
      if (!session) return ok(null);

      return ok(session);
    },

    async signIn(credentials: Credentials): Promise<Result<Session, AppError>> {
      const account = accounts.get(credentials.email.trim().toLowerCase());

      // One message for both "no such user" and "wrong password". Distinguishing them turns
      // the sign-in form into an account-enumeration oracle.
      if (!account || account.password !== credentials.password) {
        return err(new AppError('INVALID_CREDENTIALS'));
      }

      const session = issue(account);
      await store.write(session.sessionId, sessionLifetimeSeconds);
      return ok(session);
    },

    async signUp(input: SignUpInput): Promise<Result<Session, AppError>> {
      const email = input.email.trim().toLowerCase();
      if (accounts.has(email)) {
        return err(new AppError('ALREADY_EXISTS', { message: 'Email already registered' }));
      }

      const user: FakeUser = {
        id: uuid(),
        email,
        password: input.password,
        role: 'user',
        plan: 'free',
        emailVerified: false,
        ...(input.displayName ? { displayName: input.displayName } : {}),
      };
      accounts.set(email, user);

      const session = issue(user);
      await store.write(session.sessionId, sessionLifetimeSeconds);
      return ok(session);
    },

    async signOut(): Promise<Result<void, AppError>> {
      const sessionId = await store.read();
      if (sessionId) sessions.delete(sessionId);
      await store.clear();
      return ok(undefined);
    },

    async refresh(): Promise<Result<Session, AppError>> {
      const sessionId = await store.read();
      const existing = sessionId ? sessions.get(sessionId) : undefined;
      if (!existing) return err(unauthenticatedError('No session to refresh'));

      const account = [...accounts.values()].find((user) => user.id === existing.userId);
      if (!account) return err(unauthenticatedError('Account no longer exists'));

      sessions.delete(existing.sessionId);
      const session = issue(account);
      await store.write(session.sessionId, sessionLifetimeSeconds);
      return ok(session);
    },

    async requestPasswordReset(): Promise<Result<void, AppError>> {
      // Always succeeds, for the same enumeration reason as `signIn`: a reset form that
      // reveals whether an address is registered is a user-list leak.
      return ok(undefined);
    },

    async confirmPasswordReset(): Promise<Result<void, AppError>> {
      return err(
        new AppError('NOT_IMPLEMENTED', { message: 'Password reset needs a real provider' }),
      );
    },

    async verifyEmail(): Promise<Result<void, AppError>> {
      return err(
        new AppError('NOT_IMPLEMENTED', { message: 'Email verification needs a real provider' }),
      );
    },

    async verifyOtp(email: string, token: string): Promise<Result<Session, AppError>> {
      if (token !== '123456') return err(unauthenticatedError('auth.invalidCredentials'));
      const account = accounts.get(email.toLowerCase());
      if (!account) return err(unauthenticatedError('auth.invalidCredentials'));

      const session = issue(account);
      await store.write(session.sessionId, sessionLifetimeSeconds);
      return ok(session);
    },

    async resendOtp(): Promise<Result<void, AppError>> {
      return ok(undefined);
    },
  };
}
