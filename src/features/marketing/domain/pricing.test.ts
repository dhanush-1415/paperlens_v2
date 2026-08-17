import { describe, expect, it } from 'vitest';

import { formatUsd, monthlyCostCents, monthsSavedAnnually, type PricingTier } from './pricing';

/**
 * The money arithmetic, tested as arithmetic.
 *
 * These three functions are the reason the pricing table is data rather than JSX: they are the
 * only place in the product where a number shown to a buyer is *computed* rather than quoted,
 * and a wrong answer here is a wrong price on a public page. They are also pure — no clock, no
 * container, no render — so the cases that would be miserable to reach through the UI (a
 * volume of forty thousand, a negative from a hand-edited URL) are one line each.
 *
 * The recurring theme is that every assertion below is an *exact integer*. That is the whole
 * point of counting in cents: a test that had to write `toBeCloseTo` would be evidence that a
 * float had got in.
 */

function tier(overrides: Partial<PricingTier> = {}): PricingTier {
  return {
    id: 'pro',
    name: 'Pro',
    tagline: 'For people with a stack of documents.',
    monthlyCents: 2900,
    annualMonthlyCents: 2400,
    scansPerMonth: 200,
    features: [],
    cta: 'Start',
    highlighted: true,
    ...overrides,
  };
}

describe('formatUsd', () => {
  it('drops a zero remainder rather than printing $29.00', () => {
    expect(formatUsd(2900)).toBe('$29');
    expect(formatUsd(0)).toBe('$0');
  });

  it('keeps a non-zero remainder at two digits', () => {
    expect(formatUsd(2950)).toBe('$29.50');
    // The case a naive `${whole}.${remainder}` gets wrong: five cents is `.05`, not `.5`.
    expect(formatUsd(2905)).toBe('$29.05');
  });
});

describe('monthsSavedAnnually', () => {
  it('is zero for a free tier, rather than dividing by zero', () => {
    expect(monthsSavedAnnually(tier({ monthlyCents: 0, annualMonthlyCents: 0 }))).toBe(0);
  });

  it('converts the discount into whole months', () => {
    // (2900 − 2400) × 12 = 6000 cents saved, which is 2.06 months of the 2900 rate.
    expect(monthsSavedAnnually(tier())).toBe(2);
  });

  it('floors rather than rounds, so the page never overstates the saving', () => {
    // 2.9 months' worth. Rounding would advertise three months free for a discount that is
    // not worth three months — the exact species of small overclaim this product exists to
    // catch in other people's contracts.
    const nearlyThree = tier({ monthlyCents: 1000, annualMonthlyCents: 758 });
    expect(monthsSavedAnnually(nearlyThree)).toBe(2);
  });
});

describe('monthlyCostCents', () => {
  const RATE = 2500;

  it('charges the tier price at or below the allowance', () => {
    expect(monthlyCostCents(tier(), 0, RATE)).toBe(2900);
    expect(monthlyCostCents(tier(), 200, RATE)).toBe(2900);
  });

  it('bills the excess at the per-thousand rate', () => {
    // 1,200 scans on a 200 allowance is 1,000 over, which is exactly one unit of the rate.
    expect(monthlyCostCents(tier(), 1200, RATE)).toBe(2900 + 2500);
  });

  it('stays an exact integer at volumes where a per-scan float would drift', () => {
    // 40,000 × 0.025 is the canonical drift case — it lands on 1000.0000000000001 in floating
    // point. Multiplying integers and dividing once at the end cannot produce that.
    const unlimitedVolume = monthlyCostCents(tier({ scansPerMonth: 0 }), 40_000, RATE);
    expect(unlimitedVolume).toBe(2900 + 100_000);
    expect(Number.isInteger(unlimitedVolume)).toBe(true);
  });

  it('uses the annual monthly-equivalent when billed annually', () => {
    expect(monthlyCostCents(tier(), 100, RATE, 'annual')).toBe(2400);
    // Overage is priced the same either way — only the base changes.
    expect(monthlyCostCents(tier(), 1200, RATE, 'annual')).toBe(2400 + 2500);
  });

  it('ignores volume entirely when the allowance is unmetered', () => {
    expect(monthlyCostCents(tier({ scansPerMonth: null }), 1_000_000, RATE)).toBe(2900);
  });

  it('does not let a negative volume credit the bill', () => {
    // The slider cannot produce this. A URL parameter or a future API caller can, and
    // `base + negative` would quote a discount nobody is entitled to.
    expect(monthlyCostCents(tier(), -5000, RATE)).toBe(2900);
  });
});
