/**
 * The design system — one import path (requirements 22, 23).
 *
 * ```ts
 * import { Button, Card, PageHeader, RiskBadge, toast } from '@/shared/ui';
 * ```
 *
 * ### Why a barrel at all
 *
 * The usual objection is bundle size, and it does not apply here. Next's bundler tree-shakes
 * per-export, so importing `Button` from this file emits `Button`; the barrel is a naming
 * convenience, not a dependency. What it buys is a single answer to "where does a component
 * come from", which is what stops the same `Card` being imported by four different relative
 * paths and then quietly forked.
 *
 * The client/server boundary is unaffected. `'use client'` is a property of the module that
 * declares it, not of the file that re-exports it: a Server Component importing `Card` and
 * `Dialog` from here gets `Card` rendered on the server and `Dialog` as a client reference,
 * exactly as if each had been imported directly.
 *
 * ### What is deliberately not here
 *
 * · **`./fonts`** — it calls `next/font` at module scope, which registers a font for the
 * build. It has exactly one legitimate consumer, the root layout, and re-exporting it here
 * would pull that registration into every module that wants a `Button`.
 * · **`./tokens`** — imported as `@/shared/ui/tokens` when genuinely needed. Components use
 * Tailwind utilities; a component importing `cssVar()` is nearly always a component that
 * should have used a class.
 * · **`./primitives`** — `@/shared/ui/primitives`, and only when building a new component.
 * Kept out of the front door so that reaching for `Slot` is a deliberate act.
 */

export { cn, type ClassValue } from './cn';

export * from './components';

export * from './patterns';

export { Toaster, toast, useToastStore } from './toast';
export type { Toast, ToastAction, ToastInput, ToasterProps } from './toast';

export {
 ThemeProvider,
 ThemeScript,
 ThemeToggle,
 TenantTokens,
 useTheme,
 DEFAULT_THEME_PREFERENCE,
 THEME_PREFERENCES,
 isThemePreference,
} from './theme';
export type {
 ResolvedTheme,
 ThemeController,
 ThemePreference,
 ThemeProviderProps,
 ThemeScriptProps,
 ThemeState,
 ThemeToggleProps,
 TenantTokensProps,
} from './theme';

/**
 * Tone is exported from the root because it is the shared vocabulary: a feature choosing
 * which tone to pass to a `Badge`, an `Alert` and a `toast` needs the type, and the three
 * must agree.
 */
export {
 TONES,
 RISK_TONES,
 TONE_ICON,
 TONE_SOFT,
 TONE_SOLID,
 TONE_TEXT,
 isRiskTone,
 type RiskTone,
 type Tone,
} from './tone';

export * from './icons';
export * from './patterns/scroll-reveal';
