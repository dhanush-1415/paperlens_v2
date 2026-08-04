import { beforeEach, describe, expect, it, vi } from 'vitest';

import { unwrapOrThrow } from '@/core/result/result';
import { describeDocumentAnalysisRepositoryContract } from '@/test/contracts/document-analysis-repository.contract';

/**
 * `cacheTag` and `cacheLife` are only callable inside a `use cache` scope, which exists only
 * inside Next's renderer. Under Vitest there is no such scope, so they are replaced with
 * recorders — and the recording is then *asserted on*, which turns a necessary stub into a
 * genuine test: the cache tags a read declares are part of its contract, because they are what
 * a later `markStale` has to match for an invalidation to reach it.
 */
const cacheCalls = vi.hoisted(() => ({ tags: [] as string[], profiles: [] as string[] }));

vi.mock('next/cache', () => ({
  cacheTag: (...tags: string[]) => {
    cacheCalls.tags.push(...tags);
  },
  cacheLife: (profile: string) => {
    cacheCalls.profiles.push(profile);
  },
}));

const { createFakeAnalysisDataSource } = await import('./fake-analysis-data-source');
const { createDocumentAnalysisRepository } = await import('./document-analysis-repository');

const FIXED_NOW = new Date('2026-03-01T12:00:00.000Z');

function createRepository() {
  const dataSource = createFakeAnalysisDataSource({ now: () => FIXED_NOW });
  // The fake's store is module-level — one process, one map — so each test starts by
  // emptying it. That is a property of the fake, and the reason `clear()` exists on it and
  // on no port.
  dataSource.clear();
  return createDocumentAnalysisRepository({ dataSource });
}

/**
 * The adapter is held to the port's contract, not to its own implementation. When a real
 * store replaces the fake, this line changes to name the new adapter and every clause —
 * including the owner-scoping ones — is re-run against it unchanged.
 */
describeDocumentAnalysisRepositoryContract('fake in-process data source', { createRepository });

describe('cache declarations', () => {
  beforeEach(() => {
    cacheCalls.tags.length = 0;
    cacheCalls.profiles.length = 0;
  });

  it('tags a document read with both its own tag and the owner’s vault tag', async () => {
    const repository = createRepository();
    const saved = unwrapOrThrow(
      await repository.save({
        ownerId: 'user-1',
        title: 'Lease',
        documentType: 'rental_agreement',
        charCount: 100,
        flags: [],
        score: { value: 100, level: 'safe', counts: { critical: 0, caution: 0, safe: 0 } },
        analyzedAt: FIXED_NOW.toISOString(),
      }),
    );

    cacheCalls.tags.length = 0;
    await repository.findById(saved.id, 'user-1');

    // The document tag lets a re-analysis invalidate exactly one read; the vault tag lets a
    // bulk change invalidate a user's whole collection without enumerating ids.
    expect(cacheCalls.tags.some((tag) => tag.includes(saved.id))).toBe(true);
    expect(cacheCalls.tags.some((tag) => tag.includes('user-1'))).toBe(true);
  });

  it('uses the short `session` profile — access changes must take effect promptly', async () => {
    await createRepository().listRecent('user-1', 10);

    expect(cacheCalls.profiles).toContain('session');
  });
});

describe('row/entity mapping', () => {
  it('recomputes the score from the flags rather than trusting the stored columns', async () => {
    // The store keeps `score_value`/`score_level` so it can sort by risk. They are an index,
    // not the truth: if a weighting rule changes, a document analysed before it must not keep
    // yesterday's verdict. This asserts the domain rule wins over the denormalised column.
    const repository = createRepository();

    const saved = unwrapOrThrow(
      await repository.save({
        ownerId: 'user-1',
        title: 'Lease',
        documentType: 'rental_agreement',
        charCount: 100,
        // Two criticals: 100 − (2 × 28) = 44, which is below the 55 threshold and therefore a
        // `critical` headline. One alone scores 72 and reads as `caution` — the deliberate
        // distinction in `scoreOf` between "contains a bad term" and "is a bad contract".
        flags: [
          {
            id: 'flag-1',
            category: 'arbitration',
            level: 'critical',
            title: 'Waives your right to sue',
            excerpt: 'Any dispute shall be resolved by binding arbitration.',
            explanation: 'You cannot take this to court.',
            charStart: 0,
            charEnd: 52,
          },
          {
            id: 'flag-2',
            category: 'indemnity',
            level: 'critical',
            title: 'You cover their legal costs',
            excerpt: 'Tenant shall indemnify the landlord against all claims.',
            explanation: 'Their losses become your bill.',
            charStart: 60,
            charEnd: 114,
          },
        ],
        // Deliberately inconsistent with the flags — a "perfect" score on a critical finding.
        score: { value: 100, level: 'safe', counts: { critical: 0, caution: 0, safe: 0 } },
        analyzedAt: FIXED_NOW.toISOString(),
      }),
    );

    const reread = unwrapOrThrow(await repository.findById(saved.id, 'user-1'));

    expect(reread?.score.level).toBe('critical');
    expect(reread?.score.counts.critical).toBe(2);
    expect(reread?.score.value).toBeLessThan(100);
  });

  it('turns a null column into an absent field, not a null one', async () => {
    const repository = createRepository();
    const saved = unwrapOrThrow(
      await repository.save({
        ownerId: 'user-1',
        title: 'Lease',
        documentType: 'rental_agreement',
        charCount: 100,
        flags: [
          {
            id: 'flag-1',
            category: 'late_fee',
            level: 'caution',
            title: 'Late fee',
            excerpt: 'A fee of 10% applies.',
            explanation: 'Higher than typical.',
            charStart: 0,
            charEnd: 20,
          },
        ],
        score: { value: 70, level: 'caution', counts: { critical: 0, caution: 1, safe: 0 } },
        analyzedAt: FIXED_NOW.toISOString(),
      }),
    );

    const flag = unwrapOrThrow(await repository.findById(saved.id, 'user-1'))?.flags[0];

    // The store has one absence spelled `null`; the domain has one spelled `undefined`. The
    // conversion happens here so no consumer above writes `?? undefined`.
    expect(flag).toBeDefined();
    expect('recommendation' in (flag as object)).toBe(false);
  });
});
