/**
 * Design tokens — public API (requirement 23).
 *
 * Values live in `src/app/tokens.css`. This module exposes the names, the type-level
 * contract over them, and the numeric values that only exist for JavaScript (motion,
 * layers, breakpoints).
 *
 * ```ts
 * style={{ zIndex: layer('modal') }}
 * setTimeout(close, DURATION.standard)
 * window.matchMedia(mediaQuery('lg'))
 * ```
 *
 * If you are reaching for `cssVar()` in a component, stop: the answer is almost always a
 * Tailwind utility (`bg-surface-1`, `text-risk-critical-fg`). `cssVar()` is for the places
 * utilities cannot reach — SVG `fill`, canvas, and inline `style` on a computed value.
 */

export {
 THEME_TOKENS,
 THEME_TOKEN_NAMES,
 TENANT_OVERRIDABLE_GROUPS,
 TENANT_OVERRIDABLE_TOKENS,
 cssVar,
 cssVarName,
 isThemeTokenName,
 type TenantOverridableGroup,
 type TenantOverridableToken,
 type ThemeTokenGroup,
 type ThemeTokenName,
} from './contract';

export {
 DURATION,
 EASE_STANDARD,
 STAGGER_STEP,
 prefersReducedMotion,
 staggerDelay,
 type DurationName,
} from './motion';

export { LAYERS, layer, type LayerName } from './layers';

export { BREAKPOINTS, mediaQuery, type Breakpoint } from './breakpoints';
