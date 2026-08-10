/**
 * Motion values that JavaScript needs.
 *
 * CSS transitions read `--duration-standard` straight from the stylesheet and never touch
 * this file. These numbers exist for the cases CSS cannot express: a staggered reveal that
 * computes a per-child delay, a `setTimeout` that must outlast an exit animation, a
 * `requestAnimationFrame` loop that eases a value by hand.
 *
 * They are milliseconds as numbers, not `'240ms'` strings, because every consumer either
 * multiplies them or passes them to a timer. `tokens.test.ts` parses `src/app/tokens.css`
 * and asserts these match, so the mirror cannot drift silently.
 */

export const DURATION = {
 /** Hover, toggle, colour change. Fast enough to feel like a direct response. */
 micro: 150,
 /** Cards, popovers, drawers — anything that moves or changes size. */
 standard: 240,
 /** Entrance and scroll reveal. Long enough to be noticed, short enough to not be waited on. */
 entrance: 480,
} as const;

export type DurationName = keyof typeof DURATION;

/** Delay added per child in a staggered reveal. 60ms × 8 children is under half a second. */
export const STAGGER_STEP = 60;

/**
 * The one easing curve in the product.
 *
 * Decelerating with no overshoot: motion should feel like precision machinery, never like a
 * toy. There is deliberately no `easeIn`/`easeOut`/`bounce` set — a second curve is a second
 * personality, and the moment two exist, screens start disagreeing about which one they are.
 */
export const EASE_STANDARD = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Whether the user has asked for reduced motion.
 *
 * Read this before starting any JS-driven animation. CSS transitions are already handled
 * globally by the `prefers-reduced-motion` block in `globals.css`, but a `requestAnimationFrame`
 * loop is invisible to CSS and has to check for itself.
 *
 * Returns `false` on the server: SSR has no motion to reduce, and guessing `true` would ship
 * a static first paint to every user and then animate it on hydration, which is worse for
 * everyone than the reverse.
 */
export function prefersReducedMotion(): boolean {
 if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
 return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Delay for the nth child of a staggered group, honouring the reduced-motion preference.
 *
 * Capped at eight steps: past roughly half a second the effect stops reading as a sequence
 * and starts reading as the page being slow. A twenty-item list staggered linearly makes the
 * last item arrive 1.2 seconds after the first, which is a bug that looks like a design.
 */
export function staggerDelay(index: number, step: number = STAGGER_STEP): number {
 if (prefersReducedMotion()) return 0;
 return Math.min(index, 8) * step;
}
