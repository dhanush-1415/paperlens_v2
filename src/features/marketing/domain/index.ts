/**
 * The marketing domain's surface.
 *
 * Internal to the feature. `features/marketing/index.ts` decides what the application at
 * large may see, and it is a smaller list than this one.
 */

export {
 GUIDE_CATEGORIES,
 toGuideSummary,
 type DocumentGuide,
 type GuideCategory,
 type GuideFaq,
 type GuideSummary,
} from './guide';

export {
 isLegalDocumentSlug,
 legalTableOfContents,
 LEGAL_DOCUMENT_SLUGS,
 type LegalBlock,
 type LegalDocument,
 type LegalDocumentSlug,
 type LegalListItem,
 type LegalSection,
 type LegalSubsection,
} from './legal';

export {
 formatUsd,
 monthlyCostCents,
 monthsSavedAnnually,
 type BillingPeriod,
 type PricingPlan,
 type PricingTier,
 type TierFeature,
} from './pricing';

export type { ContentRepository } from './ports';
