/**
 * The marketing feature's port.
 *
 * One port, not two. Guides and pricing are both *published content* — they change on an
 * editorial cadence, they are read-only to the application, and the day either moves to a CMS
 * they will move to the same one. Splitting them would produce two adapters over one backend.
 * (Contrast `document-analysis`, which has two ports precisely because compute and storage
 * fail differently and will never share an implementation.)
 *
 * ### Why this returns `Result` and is async when the only adapter is a synchronous array
 *
 * Because the second adapter will not be. A CMS-backed implementation is a network call that
 * can time out, return a draft, or 404 a slug that used to exist. If the port were
 * `getGuide(slug): DocumentGuide | undefined`, every one of those failures would have to be
 * flattened into `undefined` — and the page would render "guide not found" for an upstream
 * outage, which is a lie that costs a ranking. Async + `Result` puts the distinction in the
 * type now, so the swap is a change to `module.ts` and nothing else.
 *
 * `NotFound` is deliberately *not* an error: a slug that does not exist is an ordinary answer
 * to a reasonable question, and the route turns it into `notFound()`. Reserving `err` for
 * genuine failure is what lets a caller treat any `err` as "something broke".
 */

import { type AppError } from '@/core/errors/app-error';
import { type Result } from '@/core/result/result';

import { type DocumentGuide, type GuideSummary } from './guide';
import { type LegalDocument, type LegalDocumentSlug } from './legal';
import { type PricingPlan } from './pricing';

export interface ContentRepository {
  /** Every guide, in the order the hub page should present them. */
  listGuides(): Promise<Result<readonly GuideSummary[], AppError>>;

  /**
   * One guide, or `null` when the slug does not name one.
   *
   * `null` inside `ok` rather than an `err`: see the note above. The route maps `ok(null)` to
   * `notFound()` and any `err` to the error boundary, and those are genuinely different pages.
   */
  getGuide(slug: string): Promise<Result<DocumentGuide | null, AppError>>;

  /**
   * Every slug, for `generateStaticParams`.
   *
   * Separate from `listGuides` because it runs at build time for all 25 routes and needs
   * nothing but the identifiers — a CMS adapter can answer it with a projection instead of
   * fetching every body.
   */
  listGuideSlugs(): Promise<Result<readonly string[], AppError>>;

  getPricing(): Promise<Result<PricingPlan, AppError>>;

  /**
   * One legal document.
   *
   * The slug is the closed union rather than a string, so there is no not-found case: the
   * three documents exist for as long as the product does, and a route that could 404 its own
   * terms of service is a route with a bug in it. That is the difference between this and
   * `getGuide` — a guide corpus is editorial and open-ended; a legal corpus is not.
   */
  getLegalDocument(slug: LegalDocumentSlug): Promise<Result<LegalDocument, AppError>>;
}
