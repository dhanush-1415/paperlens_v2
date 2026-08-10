/**
 * Limits and plan entitlements (requirement 19).
 *
 * Modelled on the reference implementation in `clearcut-app/lib/plan-limits.ts`, which
 * already established the tiers and their quotas. Two changes were made deliberately:
 *
 * 1. Entitlements are *named capabilities*, not booleans scattered across call sites. Code
 * asks `can(plan, 'vault')`, so adding a tier is a row in this table rather than an
 * `if (plan === 'pro_monthly' || plan === 'pro_yearly')` hunt across the codebase.
 * 2. Quotas and capabilities are one structure. Splitting them is how a plan ends up with a
 * scan limit but no matching entitlement entry.
 *
 * This table is advisory on the client (it drives what the UI offers) and authoritative on
 * the server (`core/auth/policy.ts` enforces it). The client copy is a convenience; it is
 * never the check.
 */

export const PLAN_TIERS = ['free', 'pro_monthly', 'pro_yearly'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/** Capabilities a plan may grant. Extend here, then fill in every tier — the type forces it. */
export const CAPABILITIES = [
 'vault',
 'reanalysis',
 'allLanguages',
 'export',
 'share',
 'priority_support',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export interface PlanDefinition {
 readonly tier: PlanTier;
 readonly displayName: string;
 /** Monthly quotas. `Infinity` means unmetered; never use a sentinel like -1. */
 readonly quotas: {
 readonly scansPerMonth: number;
 readonly chatMessagesPerMonth: number;
 readonly vaultDocuments: number;
 readonly activeShareLinks: number;
 };
 readonly capabilities: Readonly<Record<Capability, boolean>>;
}

export const PLANS = {
 free: {
 tier: 'free',
 displayName: 'Free',
 quotas: {
 scansPerMonth: 10,
 chatMessagesPerMonth: 20,
 vaultDocuments: 0,
 activeShareLinks: 1,
 },
 capabilities: {
 vault: false,
 reanalysis: false,
 allLanguages: false,
 export: false,
 share: true,
 priority_support: false,
 },
 },
 pro_monthly: {
 tier: 'pro_monthly',
 displayName: 'Pro Monthly',
 quotas: {
 scansPerMonth: 60,
 chatMessagesPerMonth: 200,
 vaultDocuments: 500,
 activeShareLinks: 25,
 },
 capabilities: {
 vault: true,
 reanalysis: true,
 allLanguages: true,
 export: true,
 share: true,
 priority_support: false,
 },
 },
 pro_yearly: {
 tier: 'pro_yearly',
 displayName: 'Pro Yearly',
 quotas: {
 scansPerMonth: 75,
 chatMessagesPerMonth: 300,
 vaultDocuments: 2_000,
 activeShareLinks: 50,
 },
 capabilities: {
 vault: true,
 reanalysis: true,
 allLanguages: true,
 export: true,
 share: true,
 priority_support: true,
 },
 },
} as const satisfies Record<PlanTier, PlanDefinition>;

export const DEFAULT_PLAN: PlanTier = 'free';

export function planOf(tier: PlanTier | undefined): PlanDefinition {
 return PLANS[tier ?? DEFAULT_PLAN];
}

/** Does this plan grant this capability? The only way to ask. */
export function can(tier: PlanTier | undefined, capability: Capability): boolean {
 return planOf(tier).capabilities[capability];
}

export function quotaOf(
 tier: PlanTier | undefined,
 quota: keyof PlanDefinition['quotas'],
): number {
 return planOf(tier).quotas[quota];
}

/** Days a lapsed subscriber keeps vault access before stored documents are purged. */
export const VAULT_GRACE_PERIOD_DAYS = 60;

/**
 * Input limits.
 *
 * Enforced twice on purpose: client-side for immediate feedback, server-side because the
 * client is not a security boundary. Both read these numbers, so they cannot drift apart.
 */
export const INPUT_LIMITS = {
 /** Bytes. Above this the upload is rejected before it is read into memory. */
 maxUploadBytes: 20 * 1024 * 1024,
 maxDocumentChars: 200_000,
 minDocumentChars: 40,
 maxDocumentsPerBatch: 10,
 maxFileNameLength: 255,
 maxFolderNameLength: 80,
 maxNoteLength: 2_000,
 maxChatMessageLength: 4_000,
 maxTagsPerDocument: 12,
 maxSearchQueryLength: 200,
} as const;

/** Page sizes. Centralized so the API, the UI and the cache all agree on a page. */
export const PAGINATION = {
 defaultPageSize: 20,
 maxPageSize: 100,
 vaultPageSize: 24,
 blogPageSize: 12,
} as const;

/**
 * Rate limits, as `{ limit, windowSeconds }`.
 *
 * Enforced by the `RateLimiter` port in `core/security`. Declared here rather than in the
 * limiter so that "what are our limits?" is answerable without reading an implementation.
 */
export const RATE_LIMITS = {
 'auth.login': { limit: 10, windowSeconds: 300 },
 'auth.register': { limit: 5, windowSeconds: 3_600 },
 'auth.passwordReset': { limit: 3, windowSeconds: 3_600 },
 'document.analyze': { limit: 30, windowSeconds: 3_600 },
 'document.chat': { limit: 60, windowSeconds: 3_600 },
 'share.create': { limit: 20, windowSeconds: 3_600 },
 'support.contact': { limit: 5, windowSeconds: 3_600 },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMITS;
