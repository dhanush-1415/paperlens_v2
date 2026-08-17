/**
 * The marketing domain: document guides and pricing.
 *
 * A "guide" is one `/for/<slug>` page — a self-contained explanation of one document type
 * ("IRS CP2000 notice", "3-day pay-or-quit"), written for someone who has that document in
 * their hand right now and is frightened by it.
 *
 * ### Why this is a domain at all, and not just a `const` in a page file
 *
 * It is twenty-five pages generated from one shape, and the shape is a product decision: every
 * guide promises a summary, the risks that document typically carries, a checklist of what to
 * do, and the questions people actually ask. Encoding that as a type means a guide added next
 * quarter cannot quietly ship without a checklist — the compiler asks for one. A page-local
 * object literal makes the twenty-sixth entry a copy-paste with whatever fields the author
 * remembered.
 *
 * ### Why the content is not in this layer
 *
 * `domain/` describes what a guide *is*. Where the text lives — a TypeScript array today, a
 * CMS with an editorial workflow the moment a marketer wants to fix a typo without a deploy —
 * is `infrastructure/`'s problem, reached through the port in `./ports.ts`. That split is the
 * entire reason this feature is a slice rather than a folder of page components.
 */

/**
 * The six clusters the guides are grouped under.
 *
 * A closed union rather than a free string: the hub page renders one section per category and
 * the filter chips are generated from it, so a typo in a twenty-sixth guide would silently
 * create a seventh, single-entry category rather than failing the build.
 */
export const GUIDE_CATEGORIES = [
  'tax-govt',
  'real-estate',
  'medical-insurance',
  'hr-employment',
  'legal-court',
  'finance-corporate',
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

/** One question-and-answer pair. Rendered as an accordion and as `FAQPage` JSON-LD. */
export interface GuideFaq {
  readonly question: string;
  readonly answer: string;
}

/**
 * One `/for/<slug>` page.
 *
 * Every field is required. There is no `Partial` and no optional prose, because a guide
 * missing its checklist still renders — as a page that ranks for a scared person's search and
 * then fails to tell them what to do.
 */
export interface DocumentGuide {
  /** URL segment. Lowercase, hyphenated, stable — changing one costs the page its rankings. */
  readonly slug: string;
  readonly category: GuideCategory;
  /** Human label for the category, as shown on the badge. */
  readonly categoryLabel: string;
  /** `<title>`. Written for the SERP, so it carries the brand suffix and stays under ~60 chars. */
  readonly title: string;
  /** `<meta name="description">`. Under ~155 characters or Google truncates it mid-sentence. */
  readonly description: string;
  /** The on-page `<h1>`. Deliberately distinct from `title`: the SERP and the page have
   * different jobs, and reusing one string for both makes the page read like a listing. */
  readonly heading: string;
  /** First paragraph. The single most-read block on the page — and what an AI summarizer
   * quotes — so it answers "what is this document" before anything else. */
  readonly summary: string;
  /** What usually goes wrong with this document type. Rendered against the caution palette. */
  readonly typicalRisks: readonly string[];
  /** What to do, in order. Rendered as an ordered list; the order is meaningful. */
  readonly checklist: readonly string[];
  readonly faqs: readonly GuideFaq[];
}

/** A guide reduced to what a card needs. Keeps list pages from shipping every FAQ answer. */
export interface GuideSummary {
  readonly slug: string;
  readonly category: GuideCategory;
  readonly categoryLabel: string;
  readonly heading: string;
  readonly description: string;
}

export function toGuideSummary(guide: DocumentGuide): GuideSummary {
  return {
    slug: guide.slug,
    category: guide.category,
    categoryLabel: guide.categoryLabel,
    heading: guide.heading,
    description: guide.description,
  };
}
