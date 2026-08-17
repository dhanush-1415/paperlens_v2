import { describe, expect, it, vi } from 'vitest';

import { describeAuthProviderContract } from '@/test/contracts/auth-provider.contract';
import { describeSessionStoreContract } from '@/test/contracts/session-store.contract';

/**
 * `next/headers` reads from the request store Next installs around a render. There is no
 * request here, so it is replaced with a plain map — which lets the *cookie* adapter be held
 * to the same `SessionStore` contract as the memory one, rather than being the one adapter
 * nothing verifies.
 */
const jar = vi.hoisted(() => new Map<string, { value: string }>());

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => jar.get(name),
    set: (name: string, value: string) => {
      jar.set(name, { value });
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  }),
}));

const { createCookieSessionStore, createMemorySessionStore } = await import('./session-store');
const { createInMemoryAuthProvider, DEMO_USERS } = await import('./in-memory-provider');
const { checkPermission, hasPermission, permissionsOf, planWouldAllow } = await import('./policy');
const { isSessionExpired, toPublicSession } = await import('./types');

import type { Session } from './types';

describeSessionStoreContract('memory', { createStore: () => createMemorySessionStore() });

describeSessionStoreContract('cookie', {
  createStore: () => {
    jar.clear();
    return createCookieSessionStore('pl_test_session');
  },
});

const FIXED_NOW = new Date('2026-05-01T10:00:00.000Z');
const [demoUser] = DEMO_USERS;

describeAuthProviderContract('in-memory', {
  createProvider: () =>
    createInMemoryAuthProvider({
      store: createMemorySessionStore(),
      now: () => FIXED_NOW,
    }),
  credentials: { email: demoUser!.email, password: demoUser!.password },
  unknownEmail: 'nobody@paperlens.test',
});

describe('session expiry', () => {
  const session = (expiresAt: string): Session => ({
    userId: 'user-1',
    role: 'user',
    plan: 'free',
    emailVerified: true,
    sessionId: 'sess-1',
    expiresAt,
  });

  it('is expired at the instant of expiry, not after it', () => {
    // `<=`, deliberately. A session valid *at* its expiry is valid for one more request than
    // it was sold as, and boundary conditions on auth are exactly where that matters.
    expect(isSessionExpired(session(FIXED_NOW.toISOString()), FIXED_NOW)).toBe(true);
  });

  it('is not expired before it', () => {
    expect(isSessionExpired(session('2026-05-01T10:00:01.000Z'), FIXED_NOW)).toBe(false);
  });

  it('compares against the clock it is given, never the wall clock', () => {
    const stale = session('2026-01-01T00:00:00.000Z');

    expect(isSessionExpired(stale, new Date('2025-01-01T00:00:00.000Z'))).toBe(false);
    expect(isSessionExpired(stale, FIXED_NOW)).toBe(true);
  });
});

describe('toPublicSession — the client boundary', () => {
  it('drops the session identifier and the expiry', () => {
    // `sessionId` is a revocation handle: harmless to the client, useful to anything that
    // scrapes a serialized RSC payload. `expiresAt` invites client-side expiry logic that the
    // server would then have to trust. Neither crosses.
    const publicSession = toPublicSession({
      userId: 'user-1',
      role: 'admin',
      plan: 'pro_yearly',
      emailVerified: true,
      sessionId: 'sess-secret',
      expiresAt: '2026-06-01T00:00:00.000Z',
      tenantId: 'tenant-1',
    });

    expect(publicSession).toEqual({
      userId: 'user-1',
      role: 'admin',
      plan: 'pro_yearly',
      emailVerified: true,
    });
    expect(JSON.stringify(publicSession)).not.toContain('sess-secret');
  });

  it('is an allowlist, so a new field on Session does not leak by default', () => {
    const publicSession = toPublicSession({
      userId: 'user-1',
      role: 'user',
      plan: 'free',
      emailVerified: false,
      sessionId: 'sess-1',
      expiresAt: '2026-06-01T00:00:00.000Z',
      // A field a future provider might add. It must not appear downstream.
      ...({ internalBillingRef: 'cus_123' } as object),
    } as Session);

    expect(Object.keys(publicSession).sort()).toEqual(['emailVerified', 'plan', 'role', 'userId']);
  });
});

describe('policy — role and plan are orthogonal axes', () => {
  const user = { role: 'user', plan: 'free', emailVerified: true } as const;
  const proUser = { role: 'user', plan: 'pro_monthly', emailVerified: true } as const;
  const admin = { role: 'admin', plan: 'free', emailVerified: true } as const;
  const support = { role: 'support', plan: 'free', emailVerified: true } as const;

  it('denies by role with reason "role"', () => {
    expect(checkPermission(user, 'admin.impersonate')).toEqual({ allowed: false, reason: 'role' });
  });

  it('denies by plan with the capability that would unlock it', () => {
    // The reason drives the UI: this one is an upsell, not a 403. Returning a bare `false`
    // would make the two indistinguishable and the upgrade prompt impossible to render.
    expect(checkPermission(user, 'vault.read')).toEqual({
      allowed: false,
      reason: 'plan',
      requiredCapability: 'vault',
    });
  });

  it('denies by unverified email with its own reason', () => {
    expect(checkPermission({ ...user, emailVerified: false }, 'document.create')).toEqual({
      allowed: false,
      reason: 'email_unverified',
    });
  });

  it('checks role before plan — a role denial is never dressed up as an upsell', () => {
    // Support has no vault permission at all. Reporting "upgrade to Pro" to a support agent
    // would be both wrong and a hint about the permission table.
    expect(checkPermission(support, 'vault.read').reason).toBe('role');
  });

  it('grants a plan-gated permission once the plan covers it', () => {
    expect(hasPermission(proUser, 'vault.read')).toBe(true);
    expect(hasPermission(proUser, 'document.export')).toBe(true);
  });

  it('does not let an administrative role buy its way past a plan gate, or vice versa', () => {
    // An admin on the free plan still has no vault: the plan table is about entitlement, not
    // authority. And a paying user still cannot impersonate: money does not grant power.
    expect(hasPermission(admin, 'vault.read')).toBe(false);
    expect(hasPermission(proUser, 'admin.impersonate')).toBe(false);
  });

  it('lets support read any document without granting it write access anywhere', () => {
    expect(hasPermission(support, 'support.readAny')).toBe(true);
    expect(hasPermission(support, 'document.delete')).toBe(false);
    expect(hasPermission(support, 'account.update')).toBe(false);
  });

  it('answers the whole permission set in one call, for navigation', () => {
    const permissions = permissionsOf(support);

    expect(permissions).toContain('document.read');
    expect(permissions).not.toContain('billing.manage');
    // Every entry it returns must independently pass the predicate that enforces it.
    for (const permission of permissions) expect(hasPermission(support, permission)).toBe(true);
  });

  it('answers the upsell question from the same table that enforces the rule', () => {
    // If these two could disagree, the pricing page would advertise something the policy
    // denies. They cannot, because one calls the other.
    expect(planWouldAllow(user, 'vault.read', 'pro_monthly')).toBe(true);
    expect(planWouldAllow(user, 'vault.read', 'free')).toBe(false);
    expect(planWouldAllow(user, 'admin.readAny', 'pro_yearly')).toBe(false);
  });

  it('never grants a permission to a role that does not list it, whatever the plan', () => {
    const plans = ['free', 'pro_monthly', 'pro_yearly'] as const;

    for (const plan of plans) {
      expect(hasPermission({ role: 'user', plan, emailVerified: true }, 'admin.readAny')).toBe(
        false,
      );
    }
  });
});
