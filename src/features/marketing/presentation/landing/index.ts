/**
 * The home page, in six sections.
 *
 * ### Why the copy lives in these files and not behind the content port
 *
 * The guides, the pricing table and the legal documents are *records* — a marketer edits one
 * field and the page redraws itself, which is exactly what a CMS is for, and why they sit behind
 * `ContentRepository`. A landing page is not that shape. Its prose and its layout are one
 * decision: the headline is sized the way it is because of how long it is, the specimen's two
 * columns exist because of the mono/sans contrast between them, and the closing band's copy only
 * works against a brand fill. Modelling that as content produces a schema with one row.
 *
 * So each section owns its own words, and the route composes sections. The three strings that do
 * come from outside — the CTA label and its reassurance line, which must be byte-identical to the
 * header's, and the guide corpus — are props.
 */

export { LandingHero } from './hero';
export type { LandingHeroProps } from './hero';

export { LandingBenefits } from './benefits';
export { LandingHowItWorks } from './how-it-works';
export { LandingSocialProofAndCta } from './social-proof';

export { LandingAssurances } from './assurances';
export { LandingClosingCta } from './closing-cta';
export type { LandingClosingCtaProps } from './closing-cta';
export { LandingCoverage } from './coverage';
export type { LandingCoverageProps } from './coverage';
export { LandingSpecimen } from './specimen';
export type { LandingSpecimenProps } from './specimen';
export { LandingBentoGrid } from './bento-grid';
