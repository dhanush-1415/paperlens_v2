/**
 * Entities and value objects for document analysis.
 *
 * This file is the deepest point in the dependency graph for this feature. It imports
 * nothing — not React, not Next, not a single `@/core` module beyond the error kernel that
 * ports need to describe failure. That is not asceticism for its own sake: it is what makes
 * the rules below testable in milliseconds with no container, no request, and no framework,
 * and what lets the same rules be reused by a background job or a CLI later without dragging
 * a rendering framework along.
 *
 * Everything here is `readonly`. An entity that can be mutated in place is an entity whose
 * invariants hold only until someone forgets, and the rules in `risk.ts` are pure functions
 * over these shapes precisely so there is never a half-updated analysis in flight.
 */

/**
 * How dangerous a single clause is.
 *
 * Deliberately identical to `RiskTone` in the design system, and deliberately *not* imported
 * from it. The domain owns this vocabulary — a clause is critical because of what it says,
 * not because of what colour it renders in. The design system happens to name its reserved
 * palette the same way, and `presentation/` is where the two meet. If the UI ever renames
 * `caution` to `warning`, the domain does not move.
 *
 * Three levels, not five. A scale finer than the decision it feeds is false precision: the
 * user's decision is "sign / read this bit again / do not sign", and there are three of those.
 */
export type RiskLevel = 'critical' | 'caution' | 'safe';

/**
 * What kind of unfair term was found.
 *
 * A closed union rather than a free string, because every member of it has to be explained
 * in the UI, translated, and counted in analytics. A free string would let an adapter invent
 * `'auto-renew'` alongside `'auto_renewal'` and quietly split the metric in two.
 */
export type ClauseCategory =
  | 'auto_renewal'
  | 'arbitration'
  | 'liability_cap'
  | 'unilateral_change'
  | 'termination_penalty'
  | 'data_sharing'
  | 'late_fee'
  | 'indemnity'
  | 'non_compete'
  | 'jurisdiction';

export interface KeyEntity {
  readonly label: string;
  readonly value: string;
  readonly iconHint: string;
}

export const CLAUSE_CATEGORIES = [
 'auto_renewal',
 'arbitration',
 'liability_cap',
 'unilateral_change',
 'termination_penalty',
 'data_sharing',
 'late_fee',
 'indemnity',
 'non_compete',
 'jurisdiction',
] as const;

/**
 * The kind of document being analysed.
 *
 * Affects which clauses matter — an arbitration clause in an employment contract carries
 * different weight than in a gym membership — and is carried through to analytics so the
 * product can learn what people actually paste.
 */
export const DOCUMENT_TYPES = [
 'rental_agreement',
 'employment_contract',
 'terms_of_service',
 'loan_agreement',
 'insurance_policy',
 'service_contract',
 'other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * One finding.
 *
 * `excerpt` is the user's own text, quoted back. That is the single most important field in
 * the product: a risk rating with no evidence is an opinion, and an opinion about a contract
 * is worth nothing. `charStart`/`charEnd` locate it in the source so a future viewer can
 * highlight in place rather than showing a detached quotation.
 */
export interface RiskFlag {
 readonly id: string;
 readonly category: ClauseCategory;
 readonly level: RiskLevel;
 /** Short, plain-language headline. "Renews automatically without notice". */
 readonly title: string;
 /** The clause itself, verbatim from the source document. */
 readonly excerpt: string;
 /** Why it matters, in the user's language rather than the drafter's. */
 readonly explanation: string;
 /** What to do about it. Absent when there is nothing useful to say. */
 readonly recommendation?: string;
 /** Offsets into the source text. Half-open: `[charStart, charEnd)`. */
 readonly charStart: number;
 readonly charEnd: number;
}

/**
 * The aggregate verdict.
 *
 * `value` is 0–100 where 100 is *safest*, because users read a score as "how good is this",
 * and a risk score where high is bad inverts that intuition every single time. `level` is the
 * headline the score maps to, computed once here so the UI, an email digest and an export all
 * agree — a threshold duplicated in a template is a threshold that drifts.
 */
export interface RiskScore {
 readonly value: number;
 readonly level: RiskLevel;
 readonly counts: Readonly<Record<RiskLevel, number>>;
}

/**
 * An analysis that has not been persisted yet.
 *
 * The absence of `id` is the type-level statement that identity is the store's to assign.
 * A use case that invents an id before saving has taken a decision that belongs to whatever
 * ends up behind the repository port — an autoincrement column, a UUID default, a document
 * key — and would have to be rewritten the day that changes.
 */
export interface AnalysisDraft {
 readonly ownerId: string;
 readonly title: string;
 readonly documentType: DocumentType;
 readonly charCount: number;
 readonly flags: readonly RiskFlag[];
 readonly score: RiskScore;
 readonly summary: string | null;
 readonly actionPlan: readonly string[];
 readonly urgency: string | null;
 readonly rawText: string;
 readonly fileUrl?: string | null;
 readonly mimeType?: string | null;
 readonly entities: readonly KeyEntity[];
 readonly legitimacy: string | null;
 readonly confidence: string | null;
 readonly suggestedQuestions: readonly string[];
 readonly timeline?: readonly any[];
 readonly deadlineDate?: string | null;
 /** ISO 8601. Produced from an injected clock, never from `new Date()` inside a rule. */
 readonly analyzedAt: string;
}

/** A persisted analysis. Identity assigned by the repository. */
export interface DocumentAnalysis extends AnalysisDraft {
 readonly id: string;
 readonly resolvedFlagIds: readonly string[];
}

/**
 * Enough to render a row in a list without loading the flags.
 *
 * Exists because "list my documents" and "open this document" are different reads with
 * different costs, and a list endpoint that returns full flag arrays is the classic way to
 * turn a fast page into a slow one once a user has three hundred documents.
 */
export interface DocumentAnalysisSummary {
 readonly id: string;
 readonly title: string;
 readonly documentType: DocumentType;
 readonly score: RiskScore;
 readonly analyzedAt: string;
}

export function toSummary(analysis: DocumentAnalysis): DocumentAnalysisSummary {
 return {
 id: analysis.id,
 title: analysis.title,
 documentType: analysis.documentType,
 score: analysis.score,
 analyzedAt: analysis.analyzedAt,
 };
}
