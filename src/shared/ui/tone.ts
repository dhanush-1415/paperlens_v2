/**
 * Tone — the one place a semantic level becomes a colour and an icon.
 *
 * `Badge`, `Alert`, `StatTile`, `RiskBadge` and the toast system all need to say the same
 * six things, and they must say them identically: a "critical" chip and a "critical" callout
 * on the same screen that disagree by one shade look like two different severities. Each of
 * those components declaring its own class strings is how that happens. They read from here.
 *
 * ### `risk` tones are not decoration
 *
 * `critical`, `caution` and `safe` describe something in the *user's document*. They are the
 * product's safety vocabulary, and the design system reserves them: a delete button is
 * `critical` because deleting is genuinely dangerous, and nothing else may borrow the red
 * because it looked good. `neutral` and `brand` exist so that there is always a correct
 * non-risk option to reach for instead.
 *
 * ### Colour is never the only signal
 *
 * Every tone carries an icon with a distinct silhouette (WCAG 2.2 §1.4.1). A component that
 * renders `TONE_SOFT` without also rendering `TONE_ICON` and a text label is showing risk in
 * colour alone, which is unreadable to roughly one in twelve men.
 */

import type { ComponentType } from 'react';

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  type IconProps,
} from './icons';

export const TONES = ['neutral', 'brand', 'critical', 'caution', 'safe', 'info'] as const;

export type Tone = (typeof TONES)[number];

/** The three tones drawn from the reserved risk palette. */
export const RISK_TONES = ['critical', 'caution', 'safe'] as const;

export type RiskTone = (typeof RISK_TONES)[number];

export function isRiskTone(tone: Tone): tone is RiskTone {
  return (RISK_TONES as readonly Tone[]).includes(tone);
}

/**
 * Soft treatment — tinted fill, matching border, readable foreground.
 *
 * For chips, callouts and alert surfaces: anything that sits *on* a page and must not
 * outshout the content around it. The risk tones use their dedicated `-bg`/`-border`/`-fg`
 * slots, which are tuned per theme; `neutral` and `brand` mix from a single colour because
 * they have no safety requirement to meet.
 */
export const TONE_SOFT = {
  neutral: 'border-border-subtle bg-surface-2 text-text-secondary',
  brand: 'border-brand-primary/25 bg-brand-primary/10 text-brand-primary',
  critical: 'border-risk-critical-border bg-risk-critical-bg text-risk-critical-fg',
  caution: 'border-risk-caution-border bg-risk-caution-bg text-risk-caution-fg',
  safe: 'border-risk-safe-border bg-risk-safe-bg text-risk-safe-fg',
  info: 'border-risk-info-border bg-risk-info-bg text-risk-info-fg',
} as const satisfies Record<Tone, string>;

/**
 * Solid treatment — the tone as a mark: a status dot, a progress fill, a countdown ring.
 *
 * Uses the `base` slot rather than `fg`, because these are shapes on a surface rather than
 * text on a canvas, and the two need different contrast to land in the same place.
 */
export const TONE_SOLID = {
  neutral: 'bg-text-tertiary',
  brand: 'bg-brand-primary',
  critical: 'bg-risk-critical',
  caution: 'bg-risk-caution',
  safe: 'bg-risk-safe',
  info: 'bg-risk-info',
} as const satisfies Record<Tone, string>;

/** The same tones as a foreground colour, for standalone icons and inline text. */
export const TONE_TEXT = {
  neutral: 'text-text-secondary',
  brand: 'text-brand-primary',
  critical: 'text-risk-critical-fg',
  caution: 'text-risk-caution-fg',
  safe: 'text-risk-safe-fg',
  info: 'text-risk-info-fg',
} as const satisfies Record<Tone, string>;

/**
 * The icon for each tone.
 *
 * Silhouettes are deliberately different from one another at 16px — a triangle for critical,
 * a filled-dot circle for caution, a tick for safe — so the level survives greyscale, a
 * monochrome printout, and a user who cannot distinguish red from green.
 */
export const TONE_ICON = {
  neutral: InfoIcon,
  brand: InfoIcon,
  critical: AlertTriangleIcon,
  caution: AlertCircleIcon,
  safe: CheckCircleIcon,
  info: InfoIcon,
} as const satisfies Record<Tone, ComponentType<IconProps>>;
