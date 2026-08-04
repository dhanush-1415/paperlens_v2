/**
 * StatTile — one number, its label, and how it moved.
 *
 * ### Why the delta's meaning is a required input
 *
 * The obvious implementation colours "up" green and "down" red. That is wrong here, and
 * dangerously so: in PaperLens the headline numbers are *risk* counts, and a rise in critical
 * clauses is the worst thing on the dashboard. A component that decides polarity from the
 * arrow direction would paint that green.
 *
 * So `delta.intent` is explicit and has no default. The caller — which is the only thing that
 * knows whether more is better — states it. A `goodDirection: 'up' | 'down'` prop was the
 * alternative and is subtly worse: it still asks the caller to reason about direction *and*
 * polarity together, and it has no way to express "moved, and it does not matter".
 *
 * ### `tabular-nums`
 *
 * Proportional digits have different widths, so a value that changes from 1,110 to 1,999
 * changes width and every tile in the row reflows. Tabular figures fix the advance width; on
 * a dashboard that revalidates, this is the difference between a number updating and the
 * page twitching.
 */

import type { ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { Card } from '../components/card';
import { Text } from '../components/text';
import { TONE_TEXT, type Tone } from '../tone';

/** Which way the number moved. Purely directional — it carries no judgement. */
export type DeltaDirection = 'up' | 'down' | 'flat';

/** Whether that movement is good news, bad news, or neither. Stated by the caller. */
export type DeltaIntent = 'positive' | 'negative' | 'neutral';

export interface StatDelta {
  direction: DeltaDirection;
  intent: DeltaIntent;
  /** Pre-formatted — "+12%", "3 fewer". Formatting is a locale concern, not a tile concern. */
  label: string;
}

const DELTA_TONE = {
  positive: 'safe',
  negative: 'critical',
  neutral: 'neutral',
} as const satisfies Record<DeltaIntent, Tone>;

const DELTA_GLYPH = {
  up: '↑',
  down: '↓',
  flat: '→',
} as const satisfies Record<DeltaDirection, string>;

export interface StatTileProps {
  label: ReactNode;
  /** Pre-formatted. `Intl.NumberFormat` belongs at the call site, next to the locale. */
  value: ReactNode;
  delta?: StatDelta;
  /** A tone for the value itself. Use sparingly — a wall of coloured numbers reads as noise. */
  tone?: Tone;
  /** Small leading icon, aligned with the label. */
  icon?: ReactNode;
  /** One short line under the value: the denominator, the period, the caveat. */
  description?: ReactNode;
  className?: string;
}

export function StatTile({
  label,
  value,
  delta,
  tone,
  icon,
  description,
  className,
}: StatTileProps) {
  return (
    <Card padding="md" className={className}>
      {/*
        A `<dl>` per tile rather than a bare stack of `<div>`s. The label/value relationship is
        exactly what a description list encodes, so a screen reader reads "Critical clauses,
        14" as a pair instead of two unrelated fragments. One pair per list is valid HTML.
      */}
      <dl>
        <dt className="flex items-center gap-2">
          {icon ? (
            <span aria-hidden className="text-text-tertiary">
              {icon}
            </span>
          ) : null}
          <Text as="span" size="xs" tone="tertiary" className="font-medium">
            {label}
          </Text>
        </dt>

        <dd className="mt-3">
          <span
            className={cn(
              'block text-3xl leading-none font-semibold tracking-tight tabular-nums',
              tone ? TONE_TEXT[tone] : 'text-text-primary',
            )}
          >
            {value}
          </span>

          {delta ? (
            <span
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-2xs font-medium',
                TONE_TEXT[DELTA_TONE[delta.intent]],
              )}
            >
              {/*
                The glyph is decorative — the label already says "+12%", and an arrow read
                aloud as "up arrow" in the middle of a number is noise. Direction survives
                greyscale through the glyph, which is what stops this being colour-only.
              */}
              <span aria-hidden>{DELTA_GLYPH[delta.direction]}</span>
              {delta.label}
            </span>
          ) : null}

          {description ? (
            <Text as="p" size="xs" tone="tertiary" className="mt-2">
              {description}
            </Text>
          ) : null}
        </dd>
      </dl>
    </Card>
  );
}
