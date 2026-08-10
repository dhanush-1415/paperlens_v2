/**
 * The price list.
 *
 * ### Why these numbers live here and not in a payments provider
 *
 * Because two systems have to agree on them and only one of them can be the source: the page
 * that quotes a price, and the checkout that charges it. Neither is authoritative on its own —
 * the provider knows what gets charged, the site knows what was promised. This file is the
 * side that gets *reviewed by a human before it ships*, which is the side a discrepancy has to
 * be caught on. When billing is wired up, the integration test that matters is the one
 * asserting each `PricingTier` here matches the live price object, and it fails the build
 * rather than the customer.
 *
 * ### A note on the feature lists
 *
 * `included: false` entries are deliberate and are rendered, struck through, rather than
 * omitted. A buyer comparing tiers is scanning for what they *lose* by staying on the cheaper
 * one; a table that only shows presence makes them infer absence, and inference is where trust
 * goes. The same instinct is why no tier advertises a capability the product does not have.
 */

import { type PricingPlan } from '../domain';

const FREE_FEATURES = [
 { label: '5 documents per month', included: true },
 { label: 'Full risk report — every clause, every flag', included: true },
 { label: 'Deadline extraction with calendar export', included: true },
 { label: 'Documents deleted after analysis', included: true },
 { label: 'Saved history and re-analysis', included: false },
 { label: 'Side-by-side document comparison', included: false },
] as const;

const PRO_FEATURES = [
 { label: '200 documents per month', included: true },
 { label: 'Everything in Free', included: true },
 {
 label: 'Saved history, searchable',
 included: true,
 note: 'Kept until you delete it. Nothing is retained without your say-so.',
 },
 { label: 'Side-by-side document comparison', included: true },
 { label: 'Follow-up questions on any analysis', included: true },
 { label: 'Export to PDF and CSV', included: true },
 { label: 'Shared team workspace', included: false },
] as const;

const BUSINESS_FEATURES = [
 { label: '2,000 documents per month', included: true },
 { label: 'Everything in Pro', included: true },
 { label: 'Shared team workspace with roles', included: true },
 { label: 'API access', included: true },
 {
 label: 'Custom clause library',
 included: true,
 note: 'Train the reviewer on the terms your organisation always negotiates.',
 },
 { label: 'Audit log and SSO', included: true },
 { label: 'Priority support with a named contact', included: true },
] as const;

export const PRICING_PLAN: PricingPlan = {
 /**
 * Ordered cheapest to dearest, left to right.
 *
 * Not an arbitrary convention: the middle position is where the eye lands first on a
 * three-column grid, and the middle tier is the one most buyers should pick. Anchoring works
 * because Free establishes that the product costs nothing to try and Business establishes
 * the ceiling; Pro is then read as the reasonable answer rather than the expensive one. The
 * ordering is data because a fourth tier must not require a component to be re-laid-out.
 */
 tiers: [
 {
 id: 'free',
 name: 'Free',
 tagline: 'For the notice sitting on your kitchen table right now.',
 monthlyCents: 0,
 annualMonthlyCents: 0,
 scansPerMonth: 5,
 features: FREE_FEATURES,
 cta: 'Analyze a document',
 highlighted: false,
 },
 {
 id: 'pro',
 name: 'Pro',
 tagline: 'For landlords, freelancers and anyone who signs things monthly.',
 monthlyCents: 2900,
 /* $24/mo billed annually — $288 against $348, two months back. See
 * `monthsSavedAnnually`, which derives the claim rather than trusting this comment. */
 annualMonthlyCents: 2400,
 scansPerMonth: 200,
 features: PRO_FEATURES,
 cta: 'Start Pro',
 highlighted: true,
 },
 {
 id: 'business',
 name: 'Business',
 tagline: 'For teams who review other people’s paperwork for a living.',
 monthlyCents: 9900,
 annualMonthlyCents: 8200,
 scansPerMonth: 2000,
 features: BUSINESS_FEATURES,
 cta: 'Talk to us',
 highlighted: false,
 },
 ],
 overageCentsPerThousand: 2500,
 calculatorBaseTierId: 'business',
};
