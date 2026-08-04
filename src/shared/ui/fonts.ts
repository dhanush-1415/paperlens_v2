/**
 * Typefaces (requirement 23).
 *
 * Loaded once, in the root layout, and never anywhere else. `next/font` hashes and
 * self-hosts each family at build time, so a second call site would emit a second copy of
 * the same font files and a second preload tag competing for the same bandwidth.
 *
 * Three families, each with a job:
 *
 *   display  Instrument Serif — hero and editorial headlines at 40px and up, marketing
 *            surfaces only. Never in the app shell.
 *   sans     Geist — all UI: body, buttons, navigation, forms, tables.
 *   mono     Geist Mono — *anything quoted from the user's document*, plus deadlines and
 *            figures. This is semantic, not stylistic: mono is how the interface says
 *            "this is evidence, we did not write it".
 *
 * Exposed as CSS variables rather than class names because the mapping from variable to
 * utility happens once in `globals.css` (`--font-sans: var(--font-geist-sans)`), which is
 * what lets a component say `font-mono` and never know which typeface is behind it.
 */

import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

/**
 * `display: 'swap'` on all three.
 *
 * The alternative, `optional`, drops the webfont entirely on a slow connection — which for
 * a product whose credibility is partly typographic is a worse outcome than a brief flash
 * of the fallback. `next/font` computes size-adjust metrics for the fallback automatically,
 * so the swap does not shift layout.
 */

export const fontSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  // Variable font: one file covers 100–900, so no `weight` array and no extra requests
  // when a component reaches for `font-semibold`.
});

export const fontMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Instrument Serif ships a single weight (400) and an italic — it is not a variable font,
 * so `weight` is required. The italic is loaded because the design language uses it on a
 * single emphasized word in display headlines; without it the browser would synthesize a
 * slant, which on a high-contrast serif looks visibly wrong.
 */
export const fontDisplay = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

/**
 * The class applied to `<html>`. Declares all three variables on the root so any subtree —
 * including portals rendered outside `<body>`'s React tree — resolves them.
 */
export const fontVariables = `${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable}`;
