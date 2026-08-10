/**
 * Theme contract (requirement 1).
 *
 * Two types, and the distinction between them is the whole design:
 *
 * ThemePreference what the user *chose* — including `'system'`, which is a choice.
 * ResolvedTheme what is actually on screen right now — only ever light or dark.
 *
 * Collapsing these into one type is the bug that produces a toggle which appears to do
 * nothing on the second click: with `'system'` erased at write time, the app cannot tell
 * "follow the OS" from "the OS currently says dark", and the next OS change is ignored.
 */

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export type ResolvedTheme = 'light' | 'dark';

/**
 * The default, and it is `'system'` rather than `'dark'`.
 *
 * The product's hero look is dark, but a first-time visitor whose OS is in light mode did
 * not ask for a dark screen — respecting the platform preference is the correct default and
 * `tokens.css` still treats dark as its unconditional base, so the hero look is what ships
 * whenever the OS has no opinion.
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
 return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

export interface ThemeState {
 /** What the user chose. Persisted. */
 readonly preference: ThemePreference;
 /** What is rendered. Derived from `preference` and, when it is `'system'`, the OS. */
 readonly resolved: ResolvedTheme;
 /**
 * Whether the provider has taken over from the inline bootstrap script.
 *
 * False during the server render and the first client render, because the server cannot
 * know the user's OS preference — only the inline script can, and it runs in the browser
 * after the HTML is streamed. A component that renders one icon for light and another for
 * dark must not branch on `resolved` until this is true, or the two renders disagree and
 * React reports a hydration mismatch.
 */
 readonly isHydrated: boolean;
}

export interface ThemeController extends ThemeState {
 setPreference: (preference: ThemePreference) => void;
 /**
 * Cycles light → dark → system.
 *
 * A three-state cycle rather than a two-state flip because `'system'` has to stay
 * reachable: a user who once tapped the toggle would otherwise be locked out of ever
 * following their OS again.
 */
 toggle: () => void;
}
