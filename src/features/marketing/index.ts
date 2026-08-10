/**
 * `marketing` — the public API.
 *
 * Routes import from `@/features/marketing` and nothing deeper; the ESLint zone enforces it.
 * Same two-entry-point split as `document-analysis`: `module.ts` is imported by the server
 * composition root and by nobody else, this file by everyone else.
 *
 * ### What is deliberately absent
 *
 * · **`DOCUMENT_GUIDES` and `PRICING_PLAN`.** The whole reason for the port. A page that could
 * import the array would import the array, and the CMS migration would stop being a one-line
 * change. Routes resolve a use case and get a `Result`.
 * · **The `ContentRepository` implementation.** Named by a token, bound in `module.ts`.
 */

/* ── Domain vocabulary ─────────────────────────────────────────────────────────────────── */
export {
 GUIDE_CATEGORIES,
 LEGAL_DOCUMENT_SLUGS,
 isLegalDocumentSlug,
 legalTableOfContents,
 formatUsd,
 monthlyCostCents,
 monthsSavedAnnually,
 type BillingPeriod,
 type DocumentGuide,
 type GuideCategory,
 type GuideFaq,
 type GuideSummary,
 type LegalBlock,
 type LegalDocument,
 type LegalDocumentSlug,
 type LegalListItem,
 type LegalSection,
 type LegalSubsection,
 type PricingPlan,
 type PricingTier,
 type TierFeature,
} from './domain';

/* ── Ports ─────────────────────────────────────────────────────────────────────────────────
 * Type-only, so an alternative adapter can be written — and contract-tested — from outside.
 */
export type { ContentRepository } from './domain';

/* ── Use-case contracts ────────────────────────────────────────────────────────────────── */
export type {
 GetDocumentGuide,
 GetLegalDocument,
 GetPricing,
 GuideGroup,
 ListDocumentGuides,
 ListGuideSlugs,
 ListGuidesByCategory,
} from './application';

/* ── Presentation ──────────────────────────────────────────────────────────────────────────
 * The sections a route composes, and the navigation data the layout renders. Exported because
 * a route's job is to fetch and compose, not to lay out — a `page.tsx` that contains a grid is
 * a `page.tsx` that will contain a conditional next.
 */
export {
 GUIDE_SECTION_IDS,
 GuideChecklist,
 GuideFaqSection,
 GuideHero,
 GuideHub,
 GuideRelated,
 GuideRisks,
 GuideStructuredData,
 HowItWorksAnatomy,
 HowItWorksLimits,
 HowItWorksPipeline,
 LandingAssurances,
 LandingBenefits,
 LandingBentoGrid,
 LandingClosingCta,
 LandingCoverage,
 LandingHero,
 LandingHowItWorks,
 LandingSocialProofAndCta,
 LandingSpecimen,
 LegalBlocks,
 LegalDocumentView,
 MarketingPageIntro,
 PricingFaq,
 PricingTierGrid,
 RichText,
 SecurityCommitments,
 SecurityLifecycle,
 SecurityPosture,
 UsageCalculator,
 renderInline,
 siteFooterGroups,
 siteLegalLinks,
 siteNavItems,
} from './presentation';
export type {
 GuideChecklistProps,
 GuideFaqSectionProps,
 GuideHeroProps,
 GuideHubProps,
 GuideRelatedProps,
 GuideRisksProps,
 GuideStructuredDataProps,
 LandingClosingCtaProps,
 LandingCoverageProps,
 LandingHeroProps,
 LandingSpecimenProps,
 LegalBlocksProps,
 LegalDocumentViewProps,
 MarketingPageIntroProps,
 PricingTierGridProps,
 RichTextProps,
 SecurityPostureProps,
 SiteFooterContentDeps,
 UsageCalculatorProps,
} from './presentation';

/* ── DI tokens ─────────────────────────────────────────────────────────────────────────────
 * How a route asks for content. The tokens are exported; what satisfies them is not.
 */
export {
 GET_DOCUMENT_GUIDE,
 GET_LEGAL_DOCUMENT,
 GET_PRICING,
 LIST_DOCUMENT_GUIDES,
 LIST_GUIDES_BY_CATEGORY,
 LIST_GUIDE_SLUGS,
} from './tokens';
