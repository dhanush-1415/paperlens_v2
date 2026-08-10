/**
 * Pricing as domain data.
 *
 * ### Why money is modelled in integer cents
 *
 * `29.99` is not representable in binary floating point, so `0.1 + 0.2 !== 0.3` and a
 * calculator that multiplies a per-scan rate by a volume drifts by fractions of a cent that
 * eventually surface as a total ending in `.0000000004`. Every amount here is an integer count
 * of cents and formatting happens once, at the edge, in `formatUsd`.
 *
 * ### Why the tiers are data rather than JSX
 *
 * The pricing table, the plan comparison on `/security`, the upgrade prompt in the app and the
 * structured data for the SERP all need the same numbers. Three of those rendering their own
 * literal is how a product ends up advertising a price it does not charge.
 */

export type BillingPeriod = 'monthly' | 'annual';

/** What a tier lets you do. `included: false` renders struck through rather than hidden —
 * the absence is information a buyer is actively looking for. */
export interface TierFeature {
 readonly label: string;
 readonly included: boolean;
 /** Shown as a tooltip. For limits that need a caveat ("fair use, no hard cap"). */
 readonly note?: string;
}

export interface PricingTier {
 readonly id: 'free' | 'pro' | 'business';
 readonly name: string;
 /** One line under the name: who this tier is for, not what it costs. */
 readonly tagline: string;
 /** Integer cents per month when billed monthly. `0` for free. */
 readonly monthlyCents: number;
 /**
 * Integer cents per month when billed annually.
 *
 * Stored as the *monthly-equivalent* rather than the annual total, because that is the
 * number displayed and deriving it by division would reintroduce rounding at render time.
 */
 readonly annualMonthlyCents: number;
 readonly scansPerMonth: number | null;
 readonly features: readonly TierFeature[];
 readonly cta: string;
 /**
 * The anchored middle tier. Exactly one tier may set this — asserted in the data source,
 * because two highlighted tiers is the same as none.
 */
 readonly highlighted: boolean;
}

export interface PricingPlan {
 readonly tiers: readonly PricingTier[];
 /**
 * Cents per *thousand* scans once a tier's included volume is exhausted.
 *
 * Per-thousand rather than per-scan because the rate the business actually wants to charge
 * is 2.5¢, and 2.5 is not an integer number of cents. Storing it as `2` under-charges,
 * storing it as `3` over-charges by 20%, and storing it as a float `0.025` reintroduces
 * exactly the drift this module exists to avoid — 40,000 scans × 0.025 is a number ending in
 * `.0000000006`. Moving the unit up by three orders of magnitude makes the real rate exactly
 * representable as `2500`, and it is also the unit the price is quoted in on the page:
 * "$25 per additional 1,000 scans" is a sentence a buyer can hold in their head.
 */
 readonly overageCentsPerThousand: number;
 /** The tier the usage calculator starts from. */
 readonly calculatorBaseTierId: PricingTier['id'];
}

/** Cents → `$29` or `$29.50`. Trailing `.00` is dropped: `$29.00` reads like a form field. */
export function formatUsd(cents: number): string {
 const whole = Math.trunc(cents / 100);
 const remainder = Math.abs(cents % 100);
 return remainder === 0 ? `$${whole}` : `$${whole}.${String(remainder).padStart(2, '0')}`;
}

/**
 * What a year on the annual plan actually saves, in whole months.
 *
 * "Save 17%" is a number a buyer has to do arithmetic on. "Two months free" is the same fact,
 * already converted into the unit they care about. Floored, never rounded up — claiming three
 * months when the discount is worth 2.6 is the kind of small dishonesty this product cannot
 * afford, given it exists to catch exactly that behaviour in other people's contracts.
 */
export function monthsSavedAnnually(tier: PricingTier): number {
 if (tier.monthlyCents <= 0) return 0;
 const saved = (tier.monthlyCents - tier.annualMonthlyCents) * 12;
 return Math.floor(saved / tier.monthlyCents);
}

/**
 * Monthly cost for a given scan volume on a given tier, in cents.
 *
 * Volume at or below the tier's allowance costs the tier price; scans beyond it are billed at
 * the overage rate. A `null` allowance means unmetered and the tier price is the answer.
 *
 * The division by 1,000 happens once, at the end, on an integer product — so the only rounding
 * in the whole calculation is a single `Math.round` on a value that is already in cents. Doing
 * it the other way round (rate per scan, then multiply) would round 40,000 times.
 */
export function monthlyCostCents(
 tier: PricingTier,
 scans: number,
 overageCentsPerThousand: number,
 period: BillingPeriod = 'monthly',
): number {
 const base = period === 'annual' ? tier.annualMonthlyCents : tier.monthlyCents;
 if (tier.scansPerMonth === null) return base;

 // `Math.max(0, …)` guards a negative volume from crediting the bill. The slider cannot
 // produce one, but a URL parameter or a future API caller can.
 const overage = Math.max(0, scans - tier.scansPerMonth);
 return base + Math.round((overage * overageCentsPerThousand) / 1000);
}
