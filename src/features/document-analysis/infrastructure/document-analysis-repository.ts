import 'server-only';

import { attempt } from '@/core/errors/boundaries';
import { taintEntity } from '@/core/security/taint';
import { uuid } from '@/shared/utils/id';

import {
  scoreOf,
  toSummary,
  type AnalysisDraft,
  type DocumentAnalysis,
  type DocumentAnalysisRepository,
  type RiskFlag,
  type ClauseCategory,
  type RiskLevel,
} from '../domain';
import { prisma } from '@/server/db/prisma';

/**
 * The adapter that satisfies `DocumentAnalysisRepository`.
 *
 * Its whole job is translation, in three directions at once:
 *
 * 1. **Shape** — `snake_case` rows with flat columns become `camelCase` entities with computed
 * value objects. The mapping is written out by hand rather than produced by a generic
 * object-key transformer, because a generic transformer means the store's column names
 * *are* the domain's field names and a rename in the database becomes a rename everywhere.
 * 2. **Currency** — a store that throws becomes a `Result` that the caller must handle.
 * 3. **Trust** — an entity leaving here is tainted, so React refuses to serialise it to a
 * Client Component. Only the DTO mapper's output may cross.
 *
 * Nothing above this file knows the store exists. Nothing below it knows the domain exists.
 */

function toFlag(record: any): RiskFlag {
  return {
    id: record.id,
    category: record.category as ClauseCategory,
    level: record.level as RiskLevel,
    title: record.title,
    excerpt: record.excerpt,
    explanation: record.explanation,
    ...(record.recommendation ? { recommendation: record.recommendation } : {}),
    charStart: record.charStart ?? record.char_start,
    charEnd: record.charEnd ?? record.char_end,
  };
}

function toEntity(record: any): DocumentAnalysis {
  const flags = (record.flags as any[]).map(toFlag);

  const analysis: DocumentAnalysis = {
    id: record.id,
    ownerId: record.ownerId,
    title: record.title,
    documentType: record.documentType,
    charCount: record.charCount,
    flags,
    resolvedFlagIds: record.resolvedFlagIds || [],
    score: scoreOf(flags),
    summary: record.summary,
    actionPlan: record.actionPlan || [],
    urgency: record.urgency,
    rawText: record.rawText || "",
    entities: (record.entities as any) || [],
    legitimacy: record.legitimacy,
    confidence: record.confidence,
    suggestedQuestions: record.suggestedQuestions || [],
    deadlineDate: record.deadlineDate?.toISOString() || null,
    analyzedAt: record.analyzedAt.toISOString(),
  };

  /**
 * The runtime backstop for the DTO boundary (requirement 15).
 *
 * `taintEntity` marks this object so React throws if it is ever passed to a Client
 * Component — with the message below, at the point of the mistake, instead of quietly
 * shipping `ownerId` and the full clause text to the browser. The sanctioned path is
 * `toAnalysisDto`, which reads fields off this object and builds a new one; reading fields
 * is allowed, passing the reference is not.
 */
  return taintEntity(
    analysis,
    'DocumentAnalysis is a server entity — pass toAnalysisDto(analysis) to Client Components',
  );
}

export interface DocumentAnalysisRepositoryDeps {
  // Empty deps since prisma is imported directly. We keep the interface for tests.
  readonly dataSource?: any;
}

export function createDocumentAnalysisRepository(
  deps?: DocumentAnalysisRepositoryDeps,
): DocumentAnalysisRepository {
  return {
    async save(draft) {
      return attempt(async () => {
        const id = uuid();
        
        const record = await prisma.documentAnalysis.create({
          data: {
            id,
            ownerId: draft.ownerId,
            title: draft.title,
            documentType: draft.documentType,
            charCount: draft.charCount,
            scoreValue: draft.score.value,
            scoreLevel: draft.score.level,
            summary: draft.summary,
            actionPlan: draft.actionPlan as string[],
            urgency: draft.urgency,
            rawText: draft.rawText,
            entities: draft.entities as any,
            legitimacy: draft.legitimacy,
            confidence: draft.confidence,
            suggestedQuestions: draft.suggestedQuestions as string[],
            deadlineDate: draft.deadlineDate ? new Date(draft.deadlineDate) : null,
            analyzedAt: new Date(draft.analyzedAt),
            flags: draft.flags.map(f => ({
              id: f.id,
              category: f.category,
              level: f.level,
              title: f.title,
              excerpt: f.excerpt,
              explanation: f.explanation,
              recommendation: f.recommendation,
              charStart: f.charStart,
              charEnd: f.charEnd
            })) as any
          }
        });

        return toEntity(record);
      });
    },

    async findById(id, ownerId) {
      return attempt(async () => {
        const record = await prisma.documentAnalysis.findFirst({
          where: { id, ownerId, deletedAt: null }
        });
        return record === null ? null : toEntity(record);
      });
    },

    async listRecent(ownerId, limit) {
      return attempt(async () => {
        const records = await prisma.documentAnalysis.findMany({
          where: { ownerId, deletedAt: null },
          orderBy: { analyzedAt: 'desc' },
          take: limit
        });
        /**
 * Summaries are built from entities rather than from rows directly. One mapping, one
 * place it can be wrong. The cost is constructing flag objects that are immediately
 * discarded — irrelevant at a page size of twenty, and the moment it stops being
 * irrelevant the fix is a projection query, which is a change to the data source.
 */
        return records.map((record) => toSummary(toEntity(record)));
      });
    },

    async remove(id, ownerId) {
      return attempt(async () => {
        await prisma.documentAnalysis.updateMany({
          where: { id, ownerId },
          data: { deletedAt: new Date() }
        });
      });
    },
  };
}
