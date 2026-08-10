/**
 * The static adapter: a `ContentRepository` over two TypeScript modules.
 *
 * ### Why an adapter at all, when the data is already right there
 *
 * Because `import { DOCUMENT_GUIDES }` in a page component is a decision that cannot be undone
 * without touching every page that made it. Six routes reading the array directly is six
 * migrations the day content moves to a CMS, and — worse — six places that each invent their
 * own lookup, their own "not found" handling, and their own idea of whether the slug should be
 * lowercased. One adapter behind one port makes that day a change to `module.ts`.
 *
 * ### Why the index is built once at module scope
 *
 * `Array.find` over 25 entries is genuinely fast enough, and the `Map` is not here for speed.
 * It is here because building it is where the *invariants get checked*: a duplicate slug — the
 * single most damaging content mistake possible, since it silently makes one of two pages
 * unreachable — throws at import time rather than resolving to whichever entry happened to be
 * first. Module scope is the right place for that: it runs once per process, during the build
 * that prerenders these routes, so a bad corpus fails `next build` and never reaches a user.
 *
 * ### On throwing here, in a codebase built on `Result`
 *
 * The rule is that exceptions live at boundaries and `Result` lives in the data path — and a
 * malformed corpus is not a data-path failure, it is a programming error in a file that ships
 * with the binary. There is no runtime handling that would help: no retry, no fallback, no
 * message worth showing a user. Failing loudly at load is the honest response, and it is the
 * same reason `configurationError` exists and is thrown rather than returned.
 */

import { internalError, type AppError } from '@/core/errors/app-error';
import { ok, type Result } from '@/core/result/result';

import {
 toGuideSummary,
 type ContentRepository,
 type DocumentGuide,
 type GuideSummary,
 type LegalDocument,
 type LegalDocumentSlug,
 type PricingPlan,
} from '../domain';
import { DOCUMENT_GUIDES } from './guides.data';
import { LEGAL_DOCUMENTS } from './legal.data';
import { PRICING_PLAN } from './pricing.data';

export interface StaticContentRepositoryDeps {
 /** Injected so a test can supply three guides instead of twenty-five. */
 readonly guides?: readonly DocumentGuide[];
 readonly pricing?: PricingPlan;
 readonly legal?: Readonly<Record<LegalDocumentSlug, LegalDocument>>;
}

function indexBySlug(guides: readonly DocumentGuide[]): ReadonlyMap<string, DocumentGuide> {
 const bySlug = new Map<string, DocumentGuide>();
 for (const guide of guides) {
 if (bySlug.has(guide.slug)) {
 throw internalError(`Duplicate guide slug: ${guide.slug}`);
 }
 bySlug.set(guide.slug, guide);
 }
 return bySlug;
}

function assertOneHighlightedTier(pricing: PricingPlan): void {
 const highlighted = pricing.tiers.filter((tier) => tier.highlighted);
 if (highlighted.length !== 1) {
 /**
 * Two highlighted tiers is visually identical to none — the "most popular" ribbon only
 * means something if it is scarce. Checked here rather than trusted from `pricing.data.ts`
 * because the mistake is made while editing that file and noticed, if at all, in
 * production.
 */
 throw internalError(`Pricing must highlight exactly one tier, found ${highlighted.length}.`);
 }
}

export function createStaticContentRepository(
 deps: StaticContentRepositoryDeps = {},
): ContentRepository {
 const guides = deps.guides ?? DOCUMENT_GUIDES;
 const pricing = deps.pricing ?? PRICING_PLAN;
 const legal = deps.legal ?? LEGAL_DOCUMENTS;

 const bySlug = indexBySlug(guides);
 assertOneHighlightedTier(pricing);

 /**
 * Summaries are projected once, not per call.
 *
 * The hub page, the footer's cross-links and `/for/[slug]`'s "related guides" rail all ask
 * for this list, and under PPR each of those is a separate render. Mapping 25 objects three
 * times per build is not expensive — but the array is immutable and identical every time, so
 * recomputing it is pure waste and, more usefully, a stable reference means React can bail
 * out of re-rendering a memoised list.
 */
 const summaries: readonly GuideSummary[] = guides.map(toGuideSummary);
 const slugs: readonly string[] = guides.map((guide) => guide.slug);

 return {
 listGuides(): Promise<Result<readonly GuideSummary[], AppError>> {
 return Promise.resolve(ok(summaries));
 },

 getGuide(slug): Promise<Result<DocumentGuide | null, AppError>> {
 return Promise.resolve(ok(bySlug.get(slug) ?? null));
 },

 listGuideSlugs(): Promise<Result<readonly string[], AppError>> {
 return Promise.resolve(ok(slugs));
 },

 getPricing(): Promise<Result<PricingPlan, AppError>> {
 return Promise.resolve(ok(pricing));
 },

 getLegalDocument(slug): Promise<Result<LegalDocument, AppError>> {
 /**
 * No `?? null` and no not-found branch: the record is total over the slug union, so the
 * only way this can miss is a corpus that failed to compile. `noUncheckedIndexedAccess`
 * does not weaken a `Record<Union, T>` lookup, so this is a genuine `LegalDocument`.
 */
 return Promise.resolve(ok(legal[slug]));
 },
 };
}
