/**
 * One `/for/<slug>` page, in five sections plus its structured data.
 *
 * Hero, risks, checklist, questions, siblings — the order a person reads a document they did not
 * ask for: *what is this*, *what could it cost me*, *what do I do*, *what am I still unsure
 * about*, *is this even the right page*. Twenty-five URLs share this one template, which is the
 * only way a corpus this size stays consistent as it grows.
 */

export { GuideChecklist } from './checklist';
export type { GuideChecklistProps } from './checklist';

export { GuideFaqSection } from './faq';
export type { GuideFaqSectionProps } from './faq';

export { GuideHero } from './hero';
export type { GuideHeroProps } from './hero';

export { GuideRelated } from './related';
export type { GuideRelatedProps } from './related';

export { GuideRisks } from './risks';
export type { GuideRisksProps } from './risks';

export { GuideStructuredData } from './structured-data';
export type { GuideStructuredDataProps } from './structured-data';

export { GUIDE_SECTION_IDS } from './section-ids';
