import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PricingTier } from '../../domain';

import { UsageCalculator } from './usage-calculator';

/**
 * The one interactive thing on the pricing page, and the only place a buyer sees a number we
 * computed rather than quoted.
 *
 * Two things are worth a test here and the rest is not. The first is that the arithmetic on
 * screen matches `monthlyCostCents` — a calculator that disagrees with the invoice is a support
 * ticket at best and a refund at worst. The second is that the answer is *announced*: the total
 * lives in a live region, so a screen-reader user dragging the slider hears the new figure
 * instead of having to leave the control and go looking for it.
 */

const TIER: PricingTier = {
  id: 'business',
  name: 'Business',
  tagline: 'For teams.',
  monthlyCents: 9900,
  annualMonthlyCents: 8200,
  scansPerMonth: 2000,
  features: [],
  cta: 'Talk to us',
  highlighted: false,
};

const RATE = 2500;

function renderCalculator() {
  render(<UsageCalculator tier={TIER} overageCentsPerThousand={RATE} />);
  return screen.getByRole('slider', { name: /documents per month/i });
}

describe('UsageCalculator', () => {
  it('opens agreeing with the tier card above it', () => {
    const slider = renderCalculator();

    // Starts at the tier's own allowance, so the first number the reader sees is the price they
    // were just quoted. Moving the slider is what introduces a new one.
    expect(slider).toHaveValue('2000');
    expect(screen.getByText('$99')).toBeInTheDocument();
    expect(screen.getByText(/within the included allowance/i)).toBeInTheDocument();
  });

  it('prices overage at the per-thousand rate', () => {
    const slider = renderCalculator();

    fireEvent.change(slider, { target: { value: '5000' } });

    // 3,000 over the 2,000 allowance at $25 per 1,000 → $99 + $75.
    expect(screen.getByText('$174')).toBeInTheDocument();
  });

  it('shows the arithmetic rather than only the total', () => {
    const slider = renderCalculator();

    fireEvent.change(slider, { target: { value: '5000' } });

    // A pricing page that cannot be checked is a pricing page that gets checked by support.
    expect(screen.getByText('$99 base + 3,000 documents at $25 per 1,000.')).toBeInTheDocument();
  });

  it('cannot be dragged below the included allowance', () => {
    const slider = renderCalculator();

    // The floor is the tier price. A slider that went lower would imply a discount for using
    // less, which is not the plan being sold.
    expect(slider).toHaveAttribute('min', '2000');
  });

  it('announces the value as documents, not as a percentage', () => {
    const slider = renderCalculator();

    fireEvent.change(slider, { target: { value: '7500' } });

    // Without `aria-valuetext` a range input is announced as "63%", which is a fact about where
    // the thumb sits and not about what the buyer is choosing.
    expect(slider).toHaveAttribute('aria-valuetext', '7,500 documents per month');
  });

  it('puts the total in a polite live region tied to the slider', () => {
    const slider = renderCalculator();
    const output = screen.getByText('$99').closest('output');

    expect(output).not.toBeNull();
    expect(output).toHaveAttribute('aria-live', 'polite');
    // `<output for>` is what associates the result with the control that produced it. Assertive
    // would interrupt the announcement of the value the user just changed.
    expect(output?.getAttribute('for')).toBe(slider.getAttribute('id'));
  });

  it('formats in en-US regardless of the reader’s locale', () => {
    const slider = renderCalculator();

    fireEvent.change(slider, { target: { value: '12500' } });

    // Pinned deliberately: the default locale differs between the server render and the
    // browser, which is a hydration mismatch on a number that is on screen at first paint.
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });
});
