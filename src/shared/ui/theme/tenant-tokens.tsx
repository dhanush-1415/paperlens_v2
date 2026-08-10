/**
 * White-label token overlay (requirement 29).
 *
 * Emits a tenant's `tokenOverrides` as a `<style>` block that redeclares a handful of custom
 * properties on `:root`. Every Tailwind utility, `cva` variant and inline style in the
 * product already resolves through those properties, so a tenant re-skins the entire
 * application without one component knowing tenants exist.
 *
 * ### Why a `<style>` tag and not inline styles on `<html>`
 *
 * Overrides are per colour scheme — a brand's blue on a dark canvas is rarely the same blue
 * it uses on white. An inline `style` attribute has no way to express "only when
 * `[data-theme='light']`", so it could only ever carry one scheme's values. The generated
 * rules mirror `tokens.css`'s own structure exactly: the dark values are unconditional and
 * the light values are scoped to the override selector.
 *
 * ### Specificity
 *
 * `:root[data-tenant]` (0,2,0) outranks `tokens.css`'s `:root` (0,1,0) and ties with its
 * `:root[data-theme='light']`, where source order decides — which is why this element must
 * render *after* the stylesheet import in the root layout. Given that, a tenant's light
 * override wins over the base light value, and the base wins wherever the tenant is silent.
 *
 * ### Injection
 *
 * Values come from `config/tenant.ts`, a static in-repo map — not from a database, not from
 * a request header. They are still passed through a strict allowlist before reaching the
 * stylesheet: only names in `TENANT_OVERRIDABLE_TOKENS` survive, and each value must match a
 * conservative CSS-value pattern. This is a static-map product today and a tenant-admin
 * screen eventually, and a `<style>` tag built from user-supplied text is a CSS injection.
 */

import { resolveTenant, type TenantConfig } from '@/config/tenant';
import { cssVarName, TENANT_OVERRIDABLE_TOKENS, type TenantOverridableToken } from '../tokens';

/**
 * Permitted CSS values.
 *
 * Hex colours, `rgb()`/`hsl()`/`oklch()`/`color-mix()` functions, `linear-gradient()`, and
 * bare keywords. Deliberately excludes anything containing `;`, `}`, `@`, `<` or `url(` —
 * the four ways a value escapes its declaration and becomes a rule, an at-rule, a tag, or a
 * network request. A rejected value falls back to the base token rather than failing the
 * render: a tenant with one malformed colour should look slightly off-brand, not blank.
 */
const SAFE_CSS_VALUE = /^[a-z0-9\s,.()%#/*+-]+$/i;

function isSafeValue(value: string): boolean {
 if (value.length > 200) return false;
 if (/url\s*\(/i.test(value)) return false;
 return SAFE_CSS_VALUE.test(value);
}

function declarations(overrides: Readonly<Record<string, string>> | undefined): string {
 if (!overrides) return '';

 return Object.entries(overrides)
 .filter((entry): entry is [TenantOverridableToken, string] =>
 (TENANT_OVERRIDABLE_TOKENS as readonly string[]).includes(entry[0]),
 )
 .filter(([, value]) => isSafeValue(value))
 .map(([token, value]) => `${cssVarName(token)}:${value}`)
 .join(';');
}

export interface TenantTokensProps {
 /** Resolved tenant. Pass `resolveTenant(serverEnv.TENANT_ID)` from the root layout. */
 tenant?: TenantConfig;
}

export function TenantTokens({ tenant = resolveTenant(undefined) }: TenantTokensProps) {
 const dark = declarations(tenant.tokenOverrides.dark);
 const light = declarations(tenant.tokenOverrides.light);

 // The default tenant overrides nothing. Rendering an empty `<style>` on every page of
 // every single-tenant deployment is bytes for no reason.
 if (dark === '' && light === '') return null;

 const css = [
 dark === '' ? '' : `:root[data-tenant]{${dark}}`,
 light === '' ? '' : `:root[data-tenant][data-theme="light"]{${light}}`,
 ]
 .filter(Boolean)
 .join('');

 return (
 <style
 // Every name is allowlisted against the token contract and every value against
 // `SAFE_CSS_VALUE` above; nothing here originates outside `config/tenant.ts`.
 dangerouslySetInnerHTML={{ __html: css }}
 />
 );
}
