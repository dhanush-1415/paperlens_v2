/**
 * The marketing feature's UI.
 *
 * Sections and page views, not components. A `Button` belongs to the design system and is
 * reused by every feature; a `LegalDocumentView` belongs here because it renders this
 * feature's entities and would be meaningless without them.
 *
 * Nothing in this folder may import `../infrastructure` — ESLint enforces it. UI reaches
 * content through a use case, which the route resolves from the container.
 */

export {
  LandingAssurances,
  LandingClosingCta,
  LandingCoverage,
  LandingHero,
  LandingSpecimen,
  LandingBentoGrid,
  LandingBenefits,
  LandingHowItWorks,
  LandingSocialProofAndCta,
} from './landing';
export type {
  LandingClosingCtaProps,
  LandingCoverageProps,
  LandingHeroProps,
  LandingSpecimenProps,
} from './landing';

export { HowItWorksAnatomy, HowItWorksLimits, HowItWorksPipeline } from './how-it-works';

export { PricingFaq, PricingTierGrid, UsageCalculator } from './pricing';
export type { PricingTierGridProps, UsageCalculatorProps } from './pricing';

export { SecurityCommitments, SecurityLifecycle, SecurityPosture } from './security';
export type { SecurityPostureProps } from './security';

export { GuideHub } from './guide-hub';
export type { GuideHubProps } from './guide-hub';

export {
  GUIDE_SECTION_IDS,
  GuideChecklist,
  GuideFaqSection,
  GuideHero,
  GuideRelated,
  GuideRisks,
  GuideStructuredData,
} from './guide';
export type {
  GuideChecklistProps,
  GuideFaqSectionProps,
  GuideHeroProps,
  GuideRelatedProps,
  GuideRisksProps,
  GuideStructuredDataProps,
} from './guide';

export { MarketingPageIntro } from './page-intro';
export type { MarketingPageIntroProps } from './page-intro';

export { LegalBlocks } from './legal-blocks';
export type { LegalBlocksProps } from './legal-blocks';

export { LegalDocumentView } from './legal-document-view';
export type { LegalDocumentViewProps } from './legal-document-view';

export { RichText, renderInline } from './rich-text';
export type { RichTextProps } from './rich-text';

export { siteFooterGroups, siteLegalLinks, siteNavItems } from './navigation';
export type { SiteFooterContentDeps } from './navigation';
export * from './faq-accordion';
