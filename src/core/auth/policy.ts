import type { Session, UserRole } from './types';
import { can, type Capability, type PlanTier } from '@/shared/constants/limits';

/**
 * Authorization policy (requirement 15).
 *
 * Two orthogonal axes, kept orthogonal on purpose:
 *
 * - **Role** answers "is this person allowed to do this kind of thing at all?" (a support
 * agent may read any document; a user may read their own).
 * - **Plan** answers "has this person paid for this?" (the vault is a Pro capability).
 *
 * Conflating them produces the bug where an admin cannot use a feature because their test
 * account is on the free plan, or — much worse — where upgrading a plan grants an
 * administrative power. They are separate tables and separate questions.
 *
 * Ownership is the third axis and is *not* expressible here: whether a document belongs to
 * a user is a data question, answered in the repository by scoping the query. A permission
 * check can never substitute for that, which is why the DAL does both.
 */

export const PERMISSIONS = [
 'document.read',
 'document.create',
 'document.delete',
 'document.reanalyze',
 'document.export',
 'document.chat',
 'vault.read',
 'vault.write',
 'share.create',
 'share.revoke',
 'account.read',
 'account.update',
 'account.delete',
 'billing.manage',
 'admin.impersonate',
 'admin.readAny',
 'support.readAny',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role → permissions.
 *
 * Additive and explicit rather than hierarchical. `admin` listing every permission it has is
 * longer than `admin extends support extends user`, and that is the point: a reviewer can
 * see exactly what a role can do without walking an inheritance chain, and adding a
 * permission to `user` cannot silently grant it to `admin` by accident.
 */
const ROLE_PERMISSIONS: Readonly<Record<UserRole, readonly Permission[]>> = {
 user: [
 'document.read',
 'document.create',
 'document.delete',
 'document.reanalyze',
 'document.export',
 'document.chat',
 'vault.read',
 'vault.write',
 'share.create',
 'share.revoke',
 'account.read',
 'account.update',
 'account.delete',
 'billing.manage',
 ],
 support: [
 'document.read',
 'account.read',
 'support.readAny',
 ],
 admin: [
 'document.read',
 'document.create',
 'document.delete',
 'document.reanalyze',
 'document.export',
 'document.chat',
 'vault.read',
 'vault.write',
 'share.create',
 'share.revoke',
 'account.read',
 'account.update',
 'account.delete',
 'billing.manage',
 'admin.impersonate',
 'admin.readAny',
 'support.readAny',
 ],
};

/**
 * Permissions that additionally require a plan capability.
 *
 * A permission absent from this map is role-gated only. Listing them here rather than
 * checking the plan inline at call sites means the answer to "what does Pro unlock?" is one
 * table, not a search.
 */
const PERMISSION_CAPABILITY: Partial<Readonly<Record<Permission, Capability>>> = {
 'vault.read': 'vault',
 'vault.write': 'vault',
 'document.reanalyze': 'reanalysis',
 'document.export': 'export',
 'share.create': 'share',
};

/** Permissions that require a verified email address. */
const REQUIRES_VERIFIED_EMAIL: ReadonlySet<Permission> = new Set([
 'document.create',
 'share.create',
 'billing.manage',
]);

export interface PermissionCheck {
 readonly allowed: boolean;
 /** Why it was denied. Drives whether the UI shows an upsell or an error. */
 readonly reason?: 'role' | 'plan' | 'email_unverified';
 /** The capability that would unlock it. Present only when `reason === 'plan'`. */
 readonly requiredCapability?: Capability;
}

/**
 * The single authorization predicate.
 *
 * Returns *why* rather than a bare boolean, because the product needs the distinction: a
 * plan denial is an upgrade prompt (a conversion opportunity), a role denial is a 403, and
 * an unverified email is a "check your inbox" banner. Collapsing all three into `false`
 * means the UI has to guess, and it guesses wrong.
 */
export function checkPermission(
 session: Pick<Session, 'role' | 'plan' | 'emailVerified'>,
 permission: Permission,
): PermissionCheck {
 if (!ROLE_PERMISSIONS[session.role].includes(permission)) {
 return { allowed: false, reason: 'role' };
 }

 if (REQUIRES_VERIFIED_EMAIL.has(permission) && !session.emailVerified) {
 return { allowed: false, reason: 'email_unverified' };
 }

 const capability = PERMISSION_CAPABILITY[permission];
 if (capability && !can(session.plan, capability)) {
 return { allowed: false, reason: 'plan', requiredCapability: capability };
 }

 return { allowed: true };
}

/** Boolean form, for the common case. */
export function hasPermission(
 session: Pick<Session, 'role' | 'plan' | 'emailVerified'>,
 permission: Permission,
): boolean {
 return checkPermission(session, permission).allowed;
}

/** Every permission a session holds. For rendering navigation without N separate checks. */
export function permissionsOf(
 session: Pick<Session, 'role' | 'plan' | 'emailVerified'>,
): Permission[] {
 return PERMISSIONS.filter((permission) => hasPermission(session, permission));
}

/**
 * Would a different plan grant this permission?
 *
 * Powers the upsell: "Reanalysis is available on Pro." Answered from the same table that
 * enforces the rule, so the marketing copy cannot drift from the behaviour.
 */
export function planWouldAllow(
 session: Pick<Session, 'role' | 'emailVerified'>,
 permission: Permission,
 plan: PlanTier,
): boolean {
 return hasPermission({ ...session, plan }, permission);
}
