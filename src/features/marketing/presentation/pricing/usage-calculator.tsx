'use client';

/**
 * The usage calculator — the one genuinely interactive thing on this page.
 *
 * ### Why this is a client island and the rest of the page is not
 *
 * Because it answers a question the server cannot: *what will this cost **me***. The tiers, the
 * feature lists and the FAQ are the same for every visitor and are HTML by the time they
 * arrive. This is a slider, a number, and one pure function between them — about forty lines of
 * JavaScript on a page that would otherwise ship none.
 *
 * ### Why a native `<input type="range">`
 *
 * It is keyboard-operable (arrows, Home/End, PageUp/PageDown), announced correctly by every
 * screen reader, draggable with a thumb the platform already sizes for touch, and it works
 * before hydration finishes. Every custom slider in every component library is a re-creation of
 * those four properties, usually missing one. The only thing worth styling here is `accent-color`.
 *
 * ### Why the answer is a breakdown, not a total
 *
 * A single number invites the reader to wonder how it was reached, and a pricing page that
 * cannot be checked is a pricing page that gets checked by support. Showing the base, the
 * overage volume, the rate and the sum means the arithmetic is visible — which is the same
 * argument this product makes about contracts, applied to our own invoice.
 *
 * ### On the absence of a "contact sales" gate
 *
 * The number is shown, at every volume, without an email address. Hiding a price behind a form
 * is a decision to qualify leads at the cost of the buyer's afternoon, and it is not compatible
 * with a product whose entire premise is that you are entitled to know what something costs
 * before you commit to it.
 */

import { useId, useState } from 'react';

import { formatUsd, monthlyCostCents, type PricingTier } from '../../domain';
import { Card, Heading, Stack, Text } from '@/shared/ui';

/**
 * The slider's ceiling.
 *
 * Beyond this the honest answer stops being a number and starts being a conversation — the
 * rate is negotiable at that volume, and quoting a computed figure for 200,000 documents a
 * month would be a price we have not agreed to honour.
 */
const MAX_SCANS = 20_000;

/**
 * Step size.
 *
 * 250 rather than 1: nobody estimates their monthly volume to the document, and a coarse step
 * means the arrow keys traverse the whole range in a reasonable number of presses rather than
 * eighty of them.
 */
const STEP = 250;

export interface UsageCalculatorProps {
  /** The tier the calculator prices from — `PricingPlan.calculatorBaseTierId`, resolved. */
  tier: PricingTier;
  /** `PricingPlan.overageCentsPerThousand`. Passed rather than imported: this is a Client
   * Component, and reaching into infrastructure from one is exactly what the layering forbids. */
  overageCentsPerThousand: number;
  /** The card's own heading. Overridable so the same island can sit inside the app's upgrade
   * screen, where the question is "what will next month cost" rather than "what if I need more". */
  heading?: string;
}

export function UsageCalculator({
  tier,
  overageCentsPerThousand,
  heading = 'More than that?',
}: UsageCalculatorProps) {
  const sliderId = useId();
  const outputId = useId();

  /**
   * Starts at the tier's own allowance, so the first thing the reader sees is the tier price
   * they were just quoted — the calculator opens agreeing with the card above it, and moving
   * the slider is what introduces a new number.
   */
  const included = tier.scansPerMonth ?? MAX_SCANS;
  const [scans, setScans] = useState(included);

  const overage = Math.max(0, scans - included);
  const totalCents = monthlyCostCents(tier, scans, overageCentsPerThousand);

  /**
   * `en-US` explicitly, not the visitor's locale.
   *
   * The default locale differs between the server render and the browser, which is a
   * hydration mismatch on a number that is on screen at first paint. Pinning it also keeps the
   * thousands separator consistent with the prices beside it, which are formatted from cents
   * by `formatUsd` and are dollars-and-cents in US convention regardless of where they are read.
   */
  const format = (value: number) => value.toLocaleString('en-US');

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-brand-primary/30 bg-surface-1/40 p-8 shadow-2xl backdrop-blur-xl md:p-12">
      <div className="pointer-events-none absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-brand-primary/10 blur-[80px]" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex max-w-2xl flex-col gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">{heading}</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {tier.name} includes {format(included)} documents a month. Past that you are billed{' '}
            {formatUsd(overageCentsPerThousand)} per additional 1,000 — no tier jump, no
            renegotiation, no overage penalty rate.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={sliderId} className="text-sm font-semibold text-text-primary">
              Estimated documents per month
            </label>
            <span className="tabular text-lg font-bold text-brand-primary">{format(scans)}</span>
          </div>

          <div className="relative py-4">
            <input
              id={sliderId}
              type="range"
              min={included}
              max={MAX_SCANS}
              step={STEP}
              value={scans}
              onChange={(event) => setScans(Number(event.target.value))}
              aria-describedby={outputId}
              aria-valuetext={`${format(scans)} documents per month`}
              className="h-3 w-full cursor-pointer appearance-none rounded-full border border-border-strong bg-surface-2 accent-brand-primary shadow-inner outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>

          <div className="flex justify-between text-xs text-text-tertiary">
            <span>{format(included)}</span>
            <span>{format(MAX_SCANS)}+</span>
          </div>
        </div>

        <output
          id={outputId}
          htmlFor={sliderId}
          aria-live="polite"
          className="mt-2 flex flex-col gap-3 border-t border-border-strong/50 pt-6"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-text-secondary">
              {tier.name} base
              {overage > 0 ? (
                <span className="text-brand-primary"> + {format(overage)} extra</span>
              ) : (
                ''
              )}
            </span>
            <span className="tabular flex items-baseline gap-1.5 text-3xl leading-none font-extrabold tracking-tight text-text-primary">
              {formatUsd(totalCents)}
              <span className="text-sm font-normal text-text-tertiary">/ month</span>
            </span>
          </div>
          <p className="text-xs text-text-tertiary">
            {overage > 0
              ? `${formatUsd(tier.monthlyCents)} base + ${format(overage)} documents at ${formatUsd(overageCentsPerThousand)} per 1,000.`
              : 'Within the included allowance — no overage on this volume.'}
          </p>
        </output>
      </div>
    </div>
  );
}
