/**
 * Breakpoints, in pixels, for JavaScript.
 *
 * CSS never reads this file — `md:` and `lg:` come from Tailwind. These numbers exist for
 * the handful of decisions that cannot be made in CSS: whether to mount a drawer instead of
 * a sidebar, whether to render a table or a card list, whether the command palette opens
 * full-screen. Those are *component tree* decisions, and CSS can only hide what has already
 * been rendered.
 *
 * `sm`…`2xl` are Tailwind v4's defaults, restated here rather than redefined. Overriding
 * them to match a design mock would silently change what `md:` means in every file in the
 * codebase for no benefit — the mock's 390/768/1024/1440 boundaries are covered by the
 * existing scale, and 1920 is added as `3xl` because Tailwind has no equivalent.
 */

export const BREAKPOINTS = {
 sm: 640,
 md: 768,
 lg: 1024,
 xl: 1280,
 '2xl': 1536,
 '3xl': 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * `mediaQuery('lg')` → `'(min-width: 1024px)'`.
 *
 * Mobile-first, matching Tailwind: every query is a floor, never a range. A `max-width`
 * helper is deliberately absent — mixing floors and ceilings is what produces the 1px gap
 * at exactly 1024 where neither branch applies.
 */
export function mediaQuery(breakpoint: Breakpoint): string {
 return `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
}
