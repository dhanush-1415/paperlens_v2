/**
 * White-labeling (requirement 29).
 *
 * A tenant is a *branding and policy overlay*, not a fork. It may override design tokens,
 * copy, legal links and which feature flags default on — and nothing else. The moment a
 * tenant needs different behaviour, that belongs behind a feature flag or a policy value,
 * not a branch on tenant ID scattered through components.
 *
 * Overrides are expressed as CSS custom properties because that is the one mechanism that
 * reaches every layer at once: Tailwind utilities, component variants and inline styles all
 * resolve the same variable. `ThemeProvider` writes them onto `<html>` and the entire UI
 * re-skins with no component aware that tenants exist.
 *
 * Pure and client-safe by construction: no env access, no I/O. The active tenant ID is
 * resolved on the server (`serverEnv.TENANT_ID`, or a host header for multi-tenant
 * deployments) and handed down.
 */

import type { TenantOverridableToken } from '@/shared/ui/tokens';

export interface TenantConfig {
 readonly id: string;
 readonly name: string;
 readonly productName: string;
 readonly tagline: string;
 readonly logo: { readonly light: string; readonly dark: string };
 readonly legal: {
 readonly companyName: string;
 readonly termsUrl: string;
 readonly privacyUrl: string;
 readonly supportEmail: string;
 };
 /**
 * CSS custom properties applied to `<html>`, per colour scheme.
 *
 * Keys are constrained to `TenantOverridableToken` — a tenant may restyle the system, not
 * invent new slots in it, and may not touch the risk palette, motion, layers or focus.
 * That list and its rationale live in `shared/ui/tokens/contract.ts`; the overlay is
 * rendered by `shared/ui/theme/tenant-tokens.tsx`.
 *
 * The import is type-only, so this file stays free of any runtime dependency on the UI
 * layer and remains safe to read from the server, the client and the proxy alike.
 */
 readonly tokenOverrides: {
 readonly light?: Partial<Readonly<Record<TenantOverridableToken, string>>>;
 readonly dark?: Partial<Readonly<Record<TenantOverridableToken, string>>>;
 };
 /** Flag defaults for this tenant. Runtime flag providers still win. */
 readonly flagOverrides: Readonly<Record<string, boolean>>;
}

export const DEFAULT_TENANT_ID = 'default';

const defaultTenant: TenantConfig = {
 id: DEFAULT_TENANT_ID,
 name: 'PaperLens',
 productName: 'PaperLens',
 tagline: 'Understand any document before you sign it.',
 logo: { light: '/brand/logo-light.svg', dark: '/brand/logo-dark.svg' },
 legal: {
 companyName: 'PaperLens',
 termsUrl: '/terms',
 privacyUrl: '/privacy',
 supportEmail: 'support@paperlens.app',
 },
 tokenOverrides: {},
 flagOverrides: {},
};

/**
 * The registry.
 *
 * Deliberately a static object rather than a database lookup: tenant branding changes on
 * the order of once a quarter, and a static map means zero latency, zero failure mode, and
 * a diff to review when a brand changes. If this ever needs to be dynamic, it becomes a
 * `TenantProvider` port with this map as the fallback adapter — the consumers below do not
 * change.
 */
const TENANTS: Readonly<Record<string, TenantConfig>> = {
 [DEFAULT_TENANT_ID]: defaultTenant,
};

export function resolveTenant(tenantId: string | undefined): TenantConfig {
 if (!tenantId) return defaultTenant;
 return TENANTS[tenantId] ?? defaultTenant;
}

export function isKnownTenant(tenantId: string): boolean {
 return tenantId in TENANTS;
}
