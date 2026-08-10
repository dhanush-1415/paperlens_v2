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
} from '../domain';
import { type AnalysisRecord, type FakeAnalysisDataSource, type FlagRecord } from './fake-analysis-data-source';

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

function toFlag(record: FlagRecord): RiskFlag {
 return {
 id: record.id,
 category: record.category,
 level: record.level,
 title: record.title,
 excerpt: record.excerpt,
 explanation: record.explanation,
 // `null` in a column, `undefined` in an entity. The store distinguishes "no value" from
 // "column absent"; the domain has one absence and it is `undefined`, so the conversion
 // happens here rather than leaving every consumer to write `?? undefined`.
 ...(record.recommendation === null ? {} : { recommendation: record.recommendation }),
 charStart: record.char_start,
 charEnd: record.char_end,
 };
}

function toEntity(record: AnalysisRecord): DocumentAnalysis {
 const flags = record.flags.map(toFlag);

 const analysis: DocumentAnalysis = {
 id: record.id,
 ownerId: record.owner_id,
 title: record.title,
 documentType: record.document_type,
 charCount: record.char_count,
 flags,
 /**
 * Recomputed from the flags rather than read from `score_value`/`score_level`.
 *
 * Those columns exist so the store can sort and filter by risk without unpacking a JSON
 * array — a real query need. But they are a *denormalisation*, and the rule that produced
 * them lives in `domain/risk.ts`. Reading them back would mean a document analysed before
 * a weighting change keeps the old score forever, silently, and two documents with
 * identical clauses disagree. The scoring rule is the source of truth; the columns are an
 * index.
 */
 score: scoreOf(flags),
 analyzedAt: record.analyzed_at,
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

function toRecord(draft: AnalysisDraft, id: string): AnalysisRecord {
 return {
 id,
 owner_id: draft.ownerId,
 title: draft.title,
 document_type: draft.documentType,
 char_count: draft.charCount,
 score_value: draft.score.value,
 score_level: draft.score.level,
 analyzed_at: draft.analyzedAt,
 flags: draft.flags.map((flag) => ({
 id: flag.id,
 category: flag.category,
 level: flag.level,
 title: flag.title,
 excerpt: flag.excerpt,
 explanation: flag.explanation,
 recommendation: flag.recommendation ?? null,
 char_start: flag.charStart,
 char_end: flag.charEnd,
 })),
 deleted_at: null,
 };
}

export interface DocumentAnalysisRepositoryDeps {
 readonly dataSource: FakeAnalysisDataSource;
}

export function createDocumentAnalysisRepository(
 deps: DocumentAnalysisRepositoryDeps,
): DocumentAnalysisRepository {
 return {
 async save(draft) {
 return attempt(async () => {
 /**
 * Identity is assigned here, which is why the port takes a draft and returns an
 * entity. A UUIDv4 from `crypto`, not a counter and not `Math.random` — ids end up in
 * URLs, and a guessable document id is an enumeration vulnerability wearing a
 * primary key's clothes.
 *
 * When a real store arrives this line usually disappears in favour of a column
 * default, and the port's shape already accommodates that.
 */
 const record = await deps.dataSource.insert(toRecord(draft, uuid()));
 return toEntity(record);
 });
 },

 async findById(id, ownerId) {
 return attempt(async () => {
 const record = await deps.dataSource.selectById(id, ownerId);
 return record === null ? null : toEntity(record);
 });
 },

 async listRecent(ownerId, limit) {
 return attempt(async () => {
 const records = await deps.dataSource.selectRecent(ownerId, limit);
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
 await deps.dataSource.softDelete(id, ownerId);
 });
 },
 };
}
