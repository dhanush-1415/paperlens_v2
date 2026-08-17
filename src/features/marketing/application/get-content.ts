/**
 * Use cases: read the guide corpus, read a guide, read pricing.
 *
 * Thin, and for the same reason the read use cases in `document-analysis` are thin: a page
 * that calls a repository directly has nowhere to put the first rule that shows up. And rules
 * are already visible on the horizon here — a guide hidden until its launch date, a tier
 * priced differently per region, an experiment that reorders the hub page. Each of those is one
 * edit in this file and zero edits in five routes.
 *
 * ### Where "not found" is decided
 *
 * The port answers `ok(null)` for a slug it does not have, because to a content store that is
 * a fact rather than a failure. `getDocumentGuide` keeps that distinction instead of collapsing
 * it to an error, unlike its counterpart in `document-analysis` — and the difference is worth
 * stating. There, an id that does not resolve is indistinguishable from one you may not read,
 * so collapsing both into `notFound` is a security property. Here the corpus is public, there
 * is no owner to leak, and the route's `notFound()` call reads better than unwrapping an error
 * only to check which kind it is.
 */

import { type AppError } from '@/core/errors/app-error';
import { isErr, ok, type Result } from '@/core/result/result';

import {
  type ContentRepository,
  type DocumentGuide,
  type GuideCategory,
  type GuideSummary,
  type LegalDocument,
  type LegalDocumentSlug,
  type PricingPlan,
} from '../domain';

export interface ContentDeps {
  readonly repository: ContentRepository;
}

export type ListDocumentGuides = () => Promise<Result<readonly GuideSummary[], AppError>>;

export function createListDocumentGuides(deps: ContentDeps): ListDocumentGuides {
  return function listDocumentGuides() {
    return deps.repository.listGuides();
  };
}

/** A category and the guides filed under it, ready to render as one section of the hub page. */
export interface GuideGroup {
  readonly category: GuideCategory;
  readonly label: string;
  readonly guides: readonly GuideSummary[];
}

export type ListGuidesByCategory = () => Promise<Result<readonly GuideGroup[], AppError>>;

/**
 * The hub page's shape, computed once here rather than in the component.
 *
 * Grouping is a `reduce` — four lines that would otherwise sit in a Server Component, where
 * they are untestable without rendering and get copy-pasted the moment the footer wants the
 * same grouping. The order of the groups follows first appearance in the corpus, so the
 * editorial ordering of `guides.data.ts` is the single control over page order; a second
 * sort here would silently override it.
 */
export function createListGuidesByCategory(deps: ContentDeps): ListGuidesByCategory {
  return async function listGuidesByCategory() {
    const listed = await deps.repository.listGuides();
    if (isErr(listed)) return listed;

    const order: GuideCategory[] = [];
    const buckets = new Map<GuideCategory, { label: string; guides: GuideSummary[] }>();

    for (const guide of listed.value) {
      let bucket = buckets.get(guide.category);
      if (bucket === undefined) {
        bucket = { label: guide.categoryLabel, guides: [] };
        buckets.set(guide.category, bucket);
        order.push(guide.category);
      }
      bucket.guides.push(guide);
    }

    const groups = order.map((category) => {
      // `order` is built from `buckets`' own keys, so this cannot miss — but
      // `noUncheckedIndexedAccess` is right to make us say so rather than assert it away.
      const bucket = buckets.get(category);
      return {
        category,
        label: bucket?.label ?? category,
        guides: bucket?.guides ?? [],
      };
    });

    return ok(groups);
  };
}

export type GetDocumentGuide = (slug: string) => Promise<Result<DocumentGuide | null, AppError>>;

export function createGetDocumentGuide(deps: ContentDeps): GetDocumentGuide {
  return function getDocumentGuide(slug) {
    /**
     * Normalised before the lookup, not after.
     *
     * A slug arrives from a URL segment, and URLs get typed, pasted with a trailing space and
     * capitalised by autocorrect on mobile. Every one of those should reach the guide rather
     * than a 404, and doing it here means each adapter does not have to remember to.
     */
    return deps.repository.getGuide(slug.trim().toLowerCase());
  };
}

export type ListGuideSlugs = () => Promise<Result<readonly string[], AppError>>;

export function createListGuideSlugs(deps: ContentDeps): ListGuideSlugs {
  return function listGuideSlugs() {
    return deps.repository.listGuideSlugs();
  };
}

export type GetPricing = () => Promise<Result<PricingPlan, AppError>>;

export function createGetPricing(deps: ContentDeps): GetPricing {
  return function getPricing() {
    return deps.repository.getPricing();
  };
}

export type GetLegalDocument = (
  slug: LegalDocumentSlug,
) => Promise<Result<LegalDocument, AppError>>;

export function createGetLegalDocument(deps: ContentDeps): GetLegalDocument {
  return function getLegalDocument(slug) {
    return deps.repository.getLegalDocument(slug);
  };
}
