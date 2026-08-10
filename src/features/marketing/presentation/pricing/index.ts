/**
 * The pricing page's sections.
 *
 * Three exports and one boundary worth naming: `PricingTierGrid` and `PricingFaq` are Server
 * Components that ship no JavaScript, `UsageCalculator` is the page's only island. Keeping them
 * in one folder makes that split visible — the `'use client'` directive is at the top of exactly
 * one file here, and a reviewer can confirm it in one `ls`.
 */

export { PricingFaq } from './faq';

export { PricingTierGrid } from './tier-grid';
export type { PricingTierGridProps } from './tier-grid';

export { UsageCalculator } from './usage-calculator';
export type { UsageCalculatorProps } from './usage-calculator';
