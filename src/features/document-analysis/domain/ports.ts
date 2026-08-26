/**
 * The ports. Interfaces the outside world must satisfy to be usable by this feature.
 *
 * This is the inversion the whole architecture turns on. The use cases in `application/`
 * depend on these declarations; the adapters in `infrastructure/` depend on them too. Neither
 * depends on the other, and neither can name the other. Swapping the regex analyzer for an
 * LLM call, or the in-process store for Postgres, is a change to `module.ts` and nothing else.
 *
 * Two ports, not one, because they fail differently and change for different reasons. The
 * analyzer is compute — it will one day be a rate-limited, expensive, non-deterministic
 * upstream call. The repository is storage — it will one day be a database with row-level
 * security. Fusing them into a single `DocumentService` would mean the day either changes,
 * both are rewritten.
 */

import { type AppError } from '@/core/errors/app-error';
import { type Result } from '@/core/result/result';

import {
  type AnalysisDraft,
  type DocumentAnalysis,
  type DocumentAnalysisSummary,
  type DocumentType,
  type RiskFlag,
  type KeyEntity,
} from './document';

/** What the analyzer is asked to look at. Text only — file parsing happens above it. */
export interface AnalysisRequest {
  readonly text: string; // The extracted text, or an empty string if it's media-only
  readonly documentType: DocumentType;
  readonly tone?: 'simple' | 'professional';
  readonly media?: {
    readonly data: string; // Base64 encoded string
    readonly mimeType: string;
  };
}

/**
 * Finds unfair clauses in a document.
 *
 * Returns flags, not a score. Scoring is a rule (`domain/risk.ts`), and a rule that lives in
 * an adapter is a rule that two adapters will implement two ways. This port's entire job is
 * "here is the text, tell me what is in it".
 *
 * Async and `Result`-returning even though the only shipped adapter is synchronous and
 * infallible. Both are load-bearing for the *next* adapter: a network-backed analyzer is
 * async by nature, and a synchronous port would force every call site to be rewritten the day
 * one arrives. `Result` puts "the upstream was down" in the type rather than in a stack trace.
 */
export interface AnalyzerResult {
  readonly flags: readonly RiskFlag[];
  readonly summary: string | null;
  readonly actionPlan: readonly string[];
  readonly urgency: string | null;
  readonly entities: readonly KeyEntity[];
  readonly legitimacy: string | null;
  readonly confidence: string | null;
  readonly suggestedQuestions: readonly string[];
  readonly transcription?: string;
  readonly timeline?: any[];
}

export interface DocumentAnalyzer {
  /** Stable identifier for logs and analytics: `heuristic-v1`, `claude-opus-5`. */
  readonly name: string;
  analyze(request: AnalysisRequest): Promise<Result<AnalyzerResult, AppError>>;
}

/**
 * Stores and retrieves analyses.
 *
 * **`ownerId` is a parameter on every read, and that is not a convenience.** It is the
 * authorization boundary expressed in the type system: there is no `findById(id)` overload to
 * reach for in a hurry, so a handler cannot accidentally load another user's document and
 * check ownership afterwards — or forget to. Whatever ends up behind this port must scope the
 * query itself, not filter after the fact.
 *
 * A missing document returns `ok(null)`, not `err(notFound)`. "No such row" is an ordinary
 * outcome of a lookup and the caller nearly always has something to do about it; reserving
 * `err` for genuine failures keeps the distinction between "I answered, the answer is none"
 * and "I could not answer" visible at every call site.
 */
export interface DocumentAnalysisRepository {
  save(draft: AnalysisDraft): Promise<Result<DocumentAnalysis, AppError>>;
  findById(id: string, ownerId: string): Promise<Result<DocumentAnalysis | null, AppError>>;
  listRecent(
    ownerId: string,
    limit: number,
  ): Promise<Result<readonly DocumentAnalysisSummary[], AppError>>;
  /** Used by the ownership tests and by account deletion. Idempotent. */
  remove(id: string, ownerId: string): Promise<Result<void, AppError>>;
}
