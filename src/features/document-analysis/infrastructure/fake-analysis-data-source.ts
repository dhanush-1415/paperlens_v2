import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { documentTags, vaultTags } from '@/core/cache/tags';

import { type ClauseCategory, type DocumentType, type RiskLevel } from '../domain';

/**
 * The "database". **In-process, per-instance, and gone on restart.**
 *
 * ### Why this exists as its own layer
 *
 * A repository maps between the store's shape and the domain's. With no store there is
 * nothing to map, and the temptation is to let the repository hold the `Map` directly — which
 * works right up until a real database arrives and the repository turns out to contain both
 * the mapping and the persistence, tangled together.
 *
 * So the split is real from the start. This file is the only thing that knows what a stored
 * row looks like; `document-analysis-repository.ts` is the only thing that knows how a row
 * becomes an entity. Replacing this file with a Postgres client or a Supabase query changes
 * the repository's imports and not one line of the mapping.
 *
 * ### The row type is not the entity type
 *
 * `AnalysisRecord` below is deliberately *not* `DocumentAnalysis`. It is flat, it stores
 * enums as strings, it has a `deletedAt`, and it does not have a computed `score` object —
 * all the ways a real table differs from a domain object. If the two were the same type the
 * mapping would look like ceremony and the first person to touch it would delete it, and then
 * the day the column names stop matching the field names, every layer above changes at once.
 *
 * ### What is faithfully reproduced
 *
 * Owner scoping in the query itself, soft deletes, ordering by recency, and returning `null`
 * rather than throwing for a miss. Those are the behaviours the layers above are written
 * against, so they must be right here or the port is untested.
 */

/** A stored row. Flat, primitive, and nothing a domain rule would recognise. */
export interface AnalysisRecord {
  readonly id: string;
  readonly owner_id: string;
  readonly title: string;
  readonly document_type: DocumentType;
  readonly char_count: number;
  readonly score_value: number;
  readonly score_level: RiskLevel;
  readonly analyzed_at: string;
  readonly flags: readonly FlagRecord[];
  readonly deleted_at: string | null;
}

export interface FlagRecord {
  readonly id: string;
  readonly category: ClauseCategory;
  readonly level: RiskLevel;
  readonly title: string;
  readonly excerpt: string;
  readonly explanation: string;
  readonly recommendation: string | null;
  readonly char_start: number;
  readonly char_end: number;
}

/**
 * Module-level state, and the honest caveats.
 *
 * · **Per process.** Two instances behind a load balancer are two different databases. On
 * serverless, "process" means "whatever container answered this request".
 * · **Per dev reload.** Turbopack re-evaluating this module empties the store, so a document
 * can vanish mid-session while editing. That is a property of the fake, not a bug above it.
 * · **Unbounded.** Nothing evicts. Fine for a demo, ruinous for anything else — one more
 * reason this must not outlive the scaffold.
 *
 * `globalThis` is not used to survive reloads on purpose: a store that persists across code
 * changes hides schema mistakes until production, which is the opposite of what a fake is for.
 */
const rows = new Map<string, AnalysisRecord>();

export interface FakeAnalysisDataSource {
  insert(record: AnalysisRecord): Promise<AnalysisRecord>;
  selectById(id: string, ownerId: string): Promise<AnalysisRecord | null>;
  selectRecent(ownerId: string, limit: number): Promise<readonly AnalysisRecord[]>;
  softDelete(id: string, ownerId: string): Promise<void>;
  /** Test seam. Not part of any port — the repository never calls it. */
  clear(): void;
}

/**
 * Cached read.
 *
 * ### Why the cache directive is here and not in the repository
 *
 * `use cache` serialises what it returns. `AnalysisRecord` is flat data and survives that
 * trivially; a `Result<DocumentAnalysis, AppError>` does not — `AppError` is a class, and a
 * tainted entity must not be handed to a cache at all. Caching the raw row and mapping
 * afterwards is the only arrangement where both the cache and the domain get what they need.
 *
 * ### Why `use cache` and not `use cache: private`
 *
 * The private variant exists for functions that read `cookies()` inside the cached scope. This
 * one does not: the owner is resolved by the DAL *before* the call and passed in as an
 * argument, which is the arrangement Next's own caching guide recommends. That has a security
 * consequence worth stating plainly — `ownerId` is part of the cache key, so one user's cached
 * row can never be served to another. Reading the cookie inside would have made the key
 * argument-independent and the isolation a matter of trust.
 *
 * ### And yes, caching a `Map` lookup is pointless
 *
 * It is. The point is the *seam*: when this becomes a network round trip the caching is
 * already correct, tagged and invalidated, instead of being retrofitted under deadline. The
 * cost today is one serialisation of a small object.
 */
async function selectById(id: string, ownerId: string): Promise<AnalysisRecord | null> {
  'use cache';

  /**
   * Tagged with both the document and the owner's vault. A single document's tag invalidates
   * this read when it is re-analysed; the vault tag invalidates it when the user's whole
   * collection changes — a bulk delete, an account downgrade — without needing to enumerate
   * ids. `documentTags` builds both, which is why no call site writes a tag string by hand.
   */
  cacheTag(...documentTags(id, ownerId));

  /**
   * `session` — minutes, not hours. A document is immutable in practice once analysed, so a
   * longer profile would be safe for the content; the short window is about *access*, since a
   * revoked share or a deleted account should stop being readable promptly even if some tag
   * is missed. Profiles are declared in `core/cache/profiles.ts` and registered in
   * `next.config.ts`; passing a literal object here would be a fourth definition of "how long
   * is a while".
   */
  cacheLife('session');

  const found = rows.get(id);
  if (!found) return null;

  /**
   * The ownership predicate lives in the query, not above it.
   *
   * This is the single most important line in the file to preserve when a real store replaces
   * it: it must become a `WHERE owner_id = $2` (or a row-level-security policy), never a
   * fetch-then-compare in application code. Fetch-then-compare is correct only for as long as
   * nobody adds an early return above it.
   */
  if (found.owner_id !== ownerId || found.deleted_at !== null) return null;

  return found;
}

async function selectRecent(ownerId: string, limit: number): Promise<readonly AnalysisRecord[]> {
  'use cache';
  cacheTag(...vaultTags(ownerId));
  cacheLife('session');

  return [...rows.values()]
    .filter((row) => row.owner_id === ownerId && row.deleted_at === null)
    .sort((a, b) => b.analyzed_at.localeCompare(a.analyzed_at))
    .slice(0, limit);
}

export interface FakeAnalysisDataSourceOptions {
  /**
   * Injected for the same reason everything else in this codebase takes a clock: a soft
   * delete writes a timestamp, and a test asserting "deleted at the right moment" cannot do
   * so against the wall clock. A real store would take this from the database's own `now()`,
   * which is the equivalent seam.
   */
  readonly now: () => Date;
}

export function createFakeAnalysisDataSource(
  options: FakeAnalysisDataSourceOptions,
): FakeAnalysisDataSource {
  return {
    async insert(record) {
      rows.set(record.id, record);
      return record;
    },

    selectById,
    selectRecent,

    async softDelete(id, ownerId) {
      const found = rows.get(id);
      /**
       * Idempotent, and silent on a miss. Deleting something that is already gone is not an
       * error — the caller's intent ("this must not exist") is satisfied either way, and
       * throwing would make retrying a failed request fail differently the second time.
       */
      if (!found || found.owner_id !== ownerId) return;
      rows.set(id, { ...found, deleted_at: options.now().toISOString() });
    },

    clear() {
      rows.clear();
    },
  };
}
