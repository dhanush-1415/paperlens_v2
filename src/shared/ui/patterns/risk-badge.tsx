/**
 * RiskBadge — the product's single most important piece of UI.
 *
 * Everything else in this design system exists so that this component can be trusted. It is
 * the thing a user points at when they decide whether to sign a contract, and the entire
 * reserved risk palette in `tokens.css` exists to keep its three levels distinguishable from
 * one another and from everything else on the screen.
 *
 * ### Three signals, always, and no way to switch them off
 *
 * Colour, icon, and text. There is no `showIcon={false}` and no icon-only mode, because
 * either one would produce a badge that says "critical" in red alone — invisible to roughly
 * one in twelve men, to anyone printing the report in greyscale, and to anyone reading it on
 * a projector. WCAG 2.2 §1.4.1 requires the redundancy; the product requires it more.
 *
 * `label` can be overridden for wording or translation, but not removed. If a table is too
 * dense for a labelled badge, the fix is `RiskDot` below — which carries the label in
 * `aria-label` and a `title`, so the information is still reachable rather than merely absent.
 *
 * ### Only three levels, and they are `RiskTone`
 *
 * Not `Tone`. `neutral`, `brand` and `info` are interface colours; a clause is never
 * "brand-coloured risk". Typing the prop as `RiskTone` makes `<RiskBadge level="brand" />` a
 * compile error rather than a design review comment.
 *
 * ### The copy is a default, not a decision
 *
 * `RISK_LABEL` holds the fallback wording in English. Features that have gone through i18n
 * pass `label={t('risk.critical')}` — the point of the default is that a badge is never
 * unlabelled, not that this file owns the product's vocabulary.
 */

import type { ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { Badge } from '../components/badge';
import { TONE_ICON, TONE_SOLID, type RiskTone } from '../tone';

export const RISK_LABEL = {
 critical: 'Critical',
 caution: 'Caution',
 safe: 'Standard',
} as const satisfies Record<RiskTone, string>;

/**
 * Ordered most severe first.
 *
 * Exported because every list of risk in the product sorts the same way, and a feature
 * writing its own comparator is how one screen ends up sorting alphabetically — which puts
 * "Caution" above "Critical" and buries the thing that matters.
 */
export const RISK_ORDER = ['critical', 'caution', 'safe'] as const satisfies readonly RiskTone[];

export function compareRisk(a: RiskTone, b: RiskTone): number {
 return RISK_ORDER.indexOf(a) - RISK_ORDER.indexOf(b);
}

export interface RiskBadgeProps {
 level: RiskTone;
 /** Overrides the default wording. Cannot be empty — see the header. */
 label?: ReactNode;
 /**
 * Renders as a count: `3 Critical`. Omit for a single clause's own badge.
 *
 * The number leads because a scanning user reads left to right and the magnitude is what
 * they are scanning for.
 */
 count?: number;
 size?: 'sm' | 'md';
 className?: string;
}

export function RiskBadge({ level, label, count, size = 'sm', className }: RiskBadgeProps) {
 const Icon = TONE_ICON[level];
 const text = label ?? RISK_LABEL[level];

 return (
 <Badge tone={level} size={size} className={className}>
 <Icon aria-hidden className={size === 'md' ? 'size-4' : 'size-3.5'} />
 {count === undefined ? null : <span className="tabular-nums">{count}</span>}
 {text}
 </Badge>
 );
}

export interface RiskDotProps {
 level: RiskTone;
 /** The label the dot stands in for. Announced, and shown on hover. */
 label?: string;
 className?: string;
}

/**
 * The compact form, for a dense table cell or a list gutter.
 *
 * `role="img"` with an `aria-label` rather than a bare decorative span: the dot is the only
 * carrier of the level in this form, so it has to be announced. `title` gives pointer users
 * the same information on hover. This is the *only* sanctioned colour-only-looking treatment,
 * and it is sanctioned because the label is present in the accessibility tree — but prefer
 * `RiskBadge` anywhere there is room for it.
 */
export function RiskDot({ level, label, className }: RiskDotProps) {
 const text = label ?? RISK_LABEL[level];

 return (
 <span
 role="img"
 aria-label={text}
 title={text}
 className={cn('inline-block size-2.5 shrink-0 rounded-full', TONE_SOLID[level], className)}
 />
 );
}
