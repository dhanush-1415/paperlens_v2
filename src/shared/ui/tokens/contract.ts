/**
 * The token contract (requirement 23).
 *
 * `src/app/tokens.css` owns the *values*. This file owns the *names*, so that:
 *
 *   · `TenantConfig.tokenOverrides` can be typed — a tenant may restyle the system, not
 *     invent new slots in it, and that rule is now a compile error rather than a comment.
 *   · A theming surface can enumerate every token without parsing CSS at runtime.
 *   · `tokens.test.ts` can assert that every name below exists in the stylesheet and that
 *     every custom property in the stylesheet appears below. Neither list can grow a
 *     member the other does not have.
 *
 * No values here. A hex code in this file would be the second source of truth this whole
 * arrangement exists to prevent.
 */

/**
 * Colour and surface tokens, grouped the way the design system talks about them.
 *
 * The grouping is load-bearing for the theme editor and for review: a reviewer can see at
 * a glance that a change touches "risk" and not "brand", which are governed by very
 * different rules — brand is a preference, risk is a safety signal.
 */
export const THEME_TOKENS = {
  surface: ['canvas', 'surface-1', 'surface-2', 'surface-raised', 'surface-overlay'],
  border: ['border-subtle', 'border-strong'],
  text: ['text-primary', 'text-secondary', 'text-tertiary', 'text-inverse', 'text-on-brand'],
  brand: [
    'brand-primary',
    'brand-primary-hover',
    'brand-secondary',
    'brand-tertiary',
    'brand-gradient',
  ],
  risk: [
    'risk-critical',
    'risk-critical-fg',
    'risk-critical-bg',
    'risk-critical-border',
    'risk-caution',
    'risk-caution-fg',
    'risk-caution-bg',
    'risk-caution-border',
    'risk-safe',
    'risk-safe-fg',
    'risk-safe-bg',
    'risk-safe-border',
    'risk-info',
    'risk-info-fg',
    'risk-info-bg',
    'risk-info-border',
  ],
  depth: ['elevation-card', 'elevation-inset-highlight', 'overlay-scrim'],
  focus: ['focus-ring', 'focus-ring-width', 'focus-ring-offset'],
  motion: ['duration-micro', 'duration-standard', 'duration-entrance', 'stagger-step', 'ease-standard'],
  layout: ['measure'],
  layer: [
    'z-base',
    'z-raised',
    'z-sticky',
    'z-drawer',
    'z-overlay',
    'z-modal',
    'z-popover',
    'z-tooltip',
    'z-toast',
  ],
} as const satisfies Readonly<Record<string, readonly string[]>>;

export type ThemeTokenGroup = keyof typeof THEME_TOKENS;

/** Every token name in the system, as a union. `'canvas' | 'surface-1' | …` */
export type ThemeTokenName = (typeof THEME_TOKENS)[ThemeTokenGroup][number];

/** Flat list, for iteration and for the drift test. */
export const THEME_TOKEN_NAMES: readonly ThemeTokenName[] = Object.values(THEME_TOKENS).flat();

/**
 * Tokens a tenant is allowed to override.
 *
 * Brand, surface, border and text only. Deliberately excluded:
 *
 *   · `risk` — the risk palette encodes how dangerous something in the user's document is.
 *     A tenant who softens "critical" to fit their brand guidelines is degrading a safety
 *     signal, and this product cannot ship that as a configuration option.
 *   · `motion`, `layer`, `focus` — behaviour and accessibility, not branding. A tenant with
 *     a slower `--duration-standard` is a tenant with a bug report we cannot reproduce.
 *   · `depth`, `layout` — structural. Changing them re-lays-out every screen, which is a
 *     design change, not a re-skin.
 */
export const TENANT_OVERRIDABLE_GROUPS = ['brand', 'surface', 'border', 'text'] as const;

export type TenantOverridableGroup = (typeof TENANT_OVERRIDABLE_GROUPS)[number];

export type TenantOverridableToken = (typeof THEME_TOKENS)[TenantOverridableGroup][number];

export const TENANT_OVERRIDABLE_TOKENS: readonly TenantOverridableToken[] =
  TENANT_OVERRIDABLE_GROUPS.flatMap((group) => [...THEME_TOKENS[group]]);

/**
 * `'surface-1'` → `'--surface-1'`.
 *
 * The only place the `--` prefix is written. Everything that needs a custom property name —
 * inline styles, the tenant overlay, tests — goes through this, so a change to the naming
 * convention is one edit.
 */
export function cssVarName(token: ThemeTokenName): string {
  return `--${token}`;
}

/** `'canvas'` → `'var(--canvas)'`, for inline styles and canvas/SVG fills. */
export function cssVar(token: ThemeTokenName): string {
  return `var(${cssVarName(token)})`;
}

export function isThemeTokenName(value: string): value is ThemeTokenName {
  return (THEME_TOKEN_NAMES as readonly string[]).includes(value);
}
