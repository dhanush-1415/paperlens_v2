/**
 * Data Transfer Objects — the only shape of this feature's data that may cross to a client.
 *
 * ### Why a DTO at all, when the entity is already a plain object
 *
 * Because the entity will not stay plain. The moment a real store is behind the repository,
 * `DocumentAnalysis` grows the fields a store carries: `ownerId`, soft-delete markers, the
 * raw source text, an internal revision, whatever the vendor adds. Serialising an entity
 * straight into a Server Component's props means every one of those fields ships to the
 * browser the day it is added — silently, with no diff to review, in a payload nobody reads.
 *
 * The mapper below is an allowlist. A new field on the entity does not appear in the DTO
 * until someone writes the line that puts it there, and writing that line is the moment the
 * question "should the client see this?" gets asked. That is the whole mechanism.
 *
 * `ownerId` is the concrete example: it is on the entity, it is deliberately absent here.
 * The client already knows who it is; telling it again only creates a second place where an
 * identifier can leak into a screenshot, a log line or an analytics payload.
 *
 * ### And why `taint` on top of that
 *
 * The allowlist is a convention enforced by review. `taintEntity` in the repository is the
 * runtime backstop: if anyone ever passes an entity to a Client Component instead of its DTO,
 * React throws with the message the taint call supplied, at the point of the mistake, rather
 * than leaking quietly forever. Belt and braces, because the failure mode is silent by nature.
 */

import {
  sortFlags,
  type ClauseCategory,
  type DocumentAnalysis,
  type DocumentAnalysisSummary,
  type DocumentType,
  type RiskFlag,
  type RiskLevel,
  type RiskScore,
  type KeyEntity,
} from '../domain';

export interface RiskFlagDto {
  readonly id: string;
  /**
   * Kept as the domain union rather than widened to `string`.
   *
   * A DTO usually loosens types on the way out; this one does not, because the union is the
   * thing that makes `CLAUSE_CATEGORY_LABEL[flag.category]` a total lookup. Widen it and every
   * consumer needs a fallback for a category that cannot occur — and the compiler stops
   * catching the label that was never added.
   */
  readonly category: ClauseCategory;
  readonly level: RiskLevel;
  readonly title: string;
  readonly excerpt: string;
  readonly explanation: string;
  readonly recommendation?: string;
  readonly isResolved: boolean;
}

export interface RiskScoreDto {
  readonly value: number;
  readonly level: RiskLevel;
  readonly criticalCount: number;
  readonly cautionCount: number;
  readonly safeCount: number;
}

export interface AnalysisDto {
  readonly id: string;
  readonly title: string;
  readonly documentType: DocumentType;
  readonly charCount: number;
  readonly analyzedAt: string;
  readonly score: RiskScoreDto;
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
  readonly flags: readonly RiskFlagDto[];
}

export interface AnalysisSummaryDto {
  readonly id: string;
  readonly title: string;
  readonly documentType: DocumentType;
  readonly analyzedAt: string;
  readonly score: RiskScoreDto;
}

/**
 * Note the absence of `charStart`/`charEnd`.
 *
 * They are real domain data and a future in-place highlighter will need them — but nothing
 * rendering today does, and a DTO is an allowlist of what is needed *now*. Adding them back
 * is one line, at the moment there is a component that uses them.
 */
function toFlagDto(flag: RiskFlag, isResolved: boolean): RiskFlagDto {
  return {
    id: flag.id,
    category: flag.category,
    level: flag.level,
    title: flag.title,
    excerpt: flag.excerpt,
    explanation: flag.explanation,
    ...(flag.recommendation === undefined ? {} : { recommendation: flag.recommendation }),
    isResolved,
  };
}

/**
 * Flattened from `Record<RiskLevel, number>` to three named fields.
 *
 * A `Record` keyed by a union survives the RSC serialization boundary fine, but it reaches
 * the client as a shape whose keys TypeScript can only promise are *some* subset — every
 * consumer then writes `counts.critical ?? 0`. Three explicit numbers make the guarantee at
 * the boundary instead of at every use.
 */
function toScoreDto(score: RiskScore): RiskScoreDto {
  return {
    value: score.value,
    level: score.level,
    criticalCount: score.counts.critical,
    cautionCount: score.counts.caution,
    safeCount: score.counts.safe,
  };
}

export function toAnalysisDto(analysis: DocumentAnalysis): AnalysisDto {
  return {
    id: analysis.id,
    title: analysis.title,
    documentType: analysis.documentType,
    charCount: analysis.charCount,
    analyzedAt: analysis.analyzedAt,
    score: toScoreDto(analysis.score),
    summary: analysis.summary,
    actionPlan: analysis.actionPlan,
    urgency: analysis.urgency,
    rawText: analysis.rawText,
    fileUrl: analysis.fileUrl,
    mimeType: analysis.mimeType,
    entities: analysis.entities,
    legitimacy: analysis.legitimacy,
    confidence: analysis.confidence,
    suggestedQuestions: analysis.suggestedQuestions,
    // Sorted here, once, rather than in whichever component happens to render them. Two
    // surfaces sorting independently is how a list and its summary end up disagreeing.
    flags: sortFlags(analysis.flags).map((f) =>
      toFlagDto(f, analysis.resolvedFlagIds.includes(f.id)),
    ),
  };
}

export function toSummaryDto(summary: DocumentAnalysisSummary): AnalysisSummaryDto {
  return {
    id: summary.id,
    title: summary.title,
    documentType: summary.documentType,
    analyzedAt: summary.analyzedAt,
    score: toScoreDto(summary.score),
  };
}
