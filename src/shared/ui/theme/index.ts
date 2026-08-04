/**
 * Theme — public API (requirement 1).
 *
 * Wiring, in order, in the root layout:
 *
 * ```tsx
 * <html suppressHydrationWarning className={fontVariables}>
 *   <head>
 *     <ThemeScript nonce={nonce} />   {/* before paint: sets data-theme *\/}
 *     <TenantTokens tenant={tenant} />{/* after globals.css: overrides tokens *\/}
 *   </head>
 *   <body>
 *     <ThemeProvider driver={localStorageDriver}>{children}</ThemeProvider>
 *   </body>
 * </html>
 * ```
 *
 * `ThemeScript` and `TenantTokens` are Server Components and cost nothing on the client.
 * `ThemeProvider` and `ThemeToggle` are the only client pieces.
 *
 * `./script` is not re-exported: it is an implementation detail of `ThemeScript`, and the
 * one legitimate consumer of its constants — `ThemeProvider` — imports it directly.
 */

export { ThemeProvider, useTheme, type ThemeProviderProps } from './theme-provider';

export { ThemeScript, type ThemeScriptProps } from './theme-script';

export { ThemeToggle, type ThemeToggleProps } from './theme-toggle';

export { TenantTokens, type TenantTokensProps } from './tenant-tokens';

export {
  DEFAULT_THEME_PREFERENCE,
  THEME_PREFERENCES,
  isThemePreference,
  type ResolvedTheme,
  type ThemeController,
  type ThemePreference,
  type ThemeState,
} from './types';
