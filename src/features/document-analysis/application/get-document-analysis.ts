/**
 * Use cases: read one analysis, or list a user's recent ones.
 *
 * Thin by design. A read use case that only forwards to a repository looks like ceremony
 * until the first time a read needs a rule attached to it — a share-link grant, a redaction
 * for a downgraded plan, an access audit entry. When that day comes there is already exactly
 * one place to put it, and every caller picks it up. The alternative is a page component that
 * calls the repository directly, and then eleven of them.
 *
 * The one rule that exists today is the interesting one: `ok(null)` from the port becomes
 * `err(notFound)` here. The port is right to distinguish "no row" from "query failed", and
 * this layer is right to collapse them for a caller whose next move is `notFound()` either
 * way. Translating between those vocabularies is precisely what an application layer is for.
 */

import { notFoundError, type AppError } from '@/core/errors/app-error';
import { err, isErr, ok, type Result } from '@/core/result/result';
import { PAGINATION } from '@/shared/constants/limits';

import {
 type DocumentAnalysis,
 type DocumentAnalysisRepository,
 type DocumentAnalysisSummary,
} from '../domain';

export interface DocumentReadDeps {
 readonly repository: DocumentAnalysisRepository;
}

export type GetDocumentAnalysis = (
 id: string,
 ownerId: string,
) => Promise<Result<DocumentAnalysis, AppError>>;

export function createGetDocumentAnalysis(deps: DocumentReadDeps): GetDocumentAnalysis {
 return async function getDocumentAnalysis(id, ownerId) {
 const found = await deps.repository.findById(id, ownerId);
 if (isErr(found)) return found;

 /**
 * "Does not exist" and "exists but is not yours" produce the same error, and that is the
 * security-relevant part. Distinguishing them turns the route into an oracle: an attacker
 * enumerating ids learns which ones are real from the difference between 404 and 403. The
 * repository already scopes by owner, so this branch cannot tell the two apart either —
 * which is the design working, not a limitation.
 */
 if (found.value === null) return err(notFoundError('document', id));

 return ok(found.value);
 };
}

export type ListRecentAnalyses = (
 ownerId: string,
 limit?: number,
) => Promise<Result<readonly DocumentAnalysisSummary[], AppError>>;

export function createListRecentAnalyses(deps: DocumentReadDeps): ListRecentAnalyses {
 return function listRecentAnalyses(ownerId, limit = PAGINATION.defaultPageSize) {
 /**
 * Clamped rather than trusted. `limit` reaches here from a query string often enough that
 * treating it as a number the caller chose is how a page becomes a denial-of-service
 * primitive: `?limit=1000000` is one character of typing and a full table scan.
 */
 const safeLimit = Math.max(1, Math.min(limit, PAGINATION.maxPageSize));
 return deps.repository.listRecent(ownerId, safeLimit);
 };
}
