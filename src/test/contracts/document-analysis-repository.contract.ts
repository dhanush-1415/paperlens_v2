import { beforeEach, describe, expect, it } from 'vitest';

import { isErr, isOk, unwrapOrThrow } from '@/core/result/result';
import {
 type AnalysisDraft,
 type DocumentAnalysisRepository,
} from '@/features/document-analysis';

/**
 * The `DocumentAnalysisRepository` contract.
 *
 * The clauses here are not storage trivia — they are the authorization model. `ownerId` is a
 * parameter on every read *because* it is the boundary, and an adapter that ignores it type-
 * checks perfectly while leaking every user's contracts to every other user. That is the exact
 * failure this suite exists to make impossible to ship: the in-process fake and a future
 * Postgres adapter with row-level security both have to answer `ok(null)` to a cross-tenant
 * read, and both are asked here in the same words.
 *
 * The other clause worth stating out loud: a missing document is `ok(null)`, never
 * `err(NOT_FOUND)`. "I answered, the answer is none" and "I could not answer" are different
 * facts, and collapsing them costs the caller the ability to tell a 404 from an outage.
 */

export interface RepositoryContractDeps {
 /** Fresh, empty, per test. */
 createRepository(): DocumentAnalysisRepository;
}

const draft = (overrides: Partial<AnalysisDraft> = {}): AnalysisDraft => ({
 ownerId: 'user-1',
 title: 'Rental agreement',
 documentType: 'rental_agreement',
 charCount: 120,
 flags: [],
 score: { value: 90, level: 'safe', counts: { critical: 0, caution: 0, safe: 0 } },
 summary: null,
 actionPlan: [],
 urgency: null,
 rawText: '',
 entities: [],
 legitimacy: null,
 confidence: null,
 suggestedQuestions: [],
 analyzedAt: '2026-01-01T00:00:00.000Z',
 ...overrides,
});

export function describeDocumentAnalysisRepositoryContract(
 name: string,
 { createRepository }: RepositoryContractDeps,
): void {
 describe(`DocumentAnalysisRepository contract: ${name}`, () => {
 let repository: DocumentAnalysisRepository;

 beforeEach(() => {
 repository = createRepository();
 });

 describe('save', () => {
 it('assigns an identity the caller did not choose', async () => {
 const saved = unwrapOrThrow(await repository.save(draft()));

 expect(saved.id).toBeTypeOf('string');
 expect(saved.id.length).toBeGreaterThan(0);
 });

 it('preserves the draft’s own fields', async () => {
 const input = draft({ title: 'Employment contract', charCount: 4_200 });
 const saved = unwrapOrThrow(await repository.save(input));

 expect(saved).toMatchObject({
 ownerId: input.ownerId,
 title: input.title,
 documentType: input.documentType,
 charCount: input.charCount,
 flags: input.flags,
 analyzedAt: input.analyzedAt,
 });
 });

 it('recomputes the score rather than echoing it back', async () => {
 // `score` is derived from `flags` by a domain rule, so it is deliberately *not* in the
 // list above. An adapter that stored and returned it verbatim would let a stale verdict
 // outlive a change to the weighting — the rule is the source of truth, and whatever the
 // store keeps alongside it is an index.
 const saved = unwrapOrThrow(
 await repository.save(
 draft({ score: { value: 3, level: 'critical', counts: { critical: 9, caution: 9, safe: 9 } } }),
 ),
 );

 expect(saved.score).toEqual({
 value: 100,
 level: 'safe',
 counts: { critical: 0, caution: 0, safe: 0 },
 });
 });

 it('gives each save a distinct identity, even for identical drafts', async () => {
 const a = unwrapOrThrow(await repository.save(draft()));
 const b = unwrapOrThrow(await repository.save(draft()));

 expect(a.id).not.toBe(b.id);
 });
 });

 describe('findById — the authorization boundary', () => {
 it('returns the document to its owner', async () => {
 const saved = unwrapOrThrow(await repository.save(draft({ ownerId: 'user-1' })));
 const found = unwrapOrThrow(await repository.findById(saved.id, 'user-1'));

 expect(found?.id).toBe(saved.id);
 });

 it('returns ok(null) — not the document — to anyone else', async () => {
 const saved = unwrapOrThrow(await repository.save(draft({ ownerId: 'user-1' })));
 const result = await repository.findById(saved.id, 'user-2');

 // `ok(null)`, deliberately: an attacker probing ids learns nothing from it, because it
 // is indistinguishable from the answer for an id that never existed.
 expect(isOk(result)).toBe(true);
 expect(unwrapOrThrow(result)).toBeNull();
 });

 it('returns ok(null) for an id that never existed', async () => {
 const result = await repository.findById('no-such-id', 'user-1');

 expect(isOk(result)).toBe(true);
 expect(unwrapOrThrow(result)).toBeNull();
 // And specifically *not* an error: absence is an answer, not a failure.
 expect(isErr(result)).toBe(false);
 });
 });

 describe('listRecent', () => {
 it('returns only the caller’s own documents', async () => {
 await repository.save(draft({ ownerId: 'user-1', title: 'Mine' }));
 await repository.save(draft({ ownerId: 'user-2', title: 'Theirs' }));

 const listed = unwrapOrThrow(await repository.listRecent('user-1', 10));

 expect(listed).toHaveLength(1);
 expect(listed[0]?.title).toBe('Mine');
 });

 it('is empty for a user with nothing, rather than an error', async () => {
 const result = await repository.listRecent('user-nobody', 10);

 expect(isOk(result)).toBe(true);
 expect(unwrapOrThrow(result)).toEqual([]);
 });

 it('honours the limit', async () => {
 for (const index of [1, 2, 3, 4, 5]) {
 await repository.save(draft({ title: `Doc ${index}` }));
 }

 expect(unwrapOrThrow(await repository.listRecent('user-1', 2))).toHaveLength(2);
 });

 it('orders newest first — a "recent" list in insertion order is not recent', async () => {
 const first = unwrapOrThrow(
 await repository.save(draft({ analyzedAt: '2026-01-01T00:00:00.000Z', title: 'Older' })),
 );
 const second = unwrapOrThrow(
 await repository.save(draft({ analyzedAt: '2026-06-01T00:00:00.000Z', title: 'Newer' })),
 );

 const listed = unwrapOrThrow(await repository.listRecent('user-1', 10));

 expect(listed.map((summary) => summary.id)).toEqual([second.id, first.id]);
 });

 it('summarises without the flag payload', async () => {
 await repository.save(draft());
 const [summary] = unwrapOrThrow(await repository.listRecent('user-1', 10));

 expect(summary).toBeDefined();
 expect(summary).not.toHaveProperty('flags');
 });
 });

 describe('remove', () => {
 it('deletes the caller’s own document', async () => {
 const saved = unwrapOrThrow(await repository.save(draft({ ownerId: 'user-1' })));
 await repository.remove(saved.id, 'user-1');

 expect(unwrapOrThrow(await repository.findById(saved.id, 'user-1'))).toBeNull();
 });

 it('does not delete someone else’s', async () => {
 const saved = unwrapOrThrow(await repository.save(draft({ ownerId: 'user-1' })));
 await repository.remove(saved.id, 'user-2');

 expect(unwrapOrThrow(await repository.findById(saved.id, 'user-1'))).not.toBeNull();
 });

 it('is idempotent — removing twice, or removing nothing, still succeeds', async () => {
 const saved = unwrapOrThrow(await repository.save(draft()));

 expect(isOk(await repository.remove(saved.id, 'user-1'))).toBe(true);
 expect(isOk(await repository.remove(saved.id, 'user-1'))).toBe(true);
 expect(isOk(await repository.remove('never-existed', 'user-1'))).toBe(true);
 });
 });

 describe('isolation', () => {
 it('does not hand out a reference callers can mutate', async () => {
 // A store that returns its own object lets a caller edit persisted state by accident —
 // the in-process failure mode that has no equivalent over the wire, and therefore the
 // one that breaks the day the adapter is swapped for a real database.
 const saved = unwrapOrThrow(await repository.save(draft({ title: 'Original' })));
 (saved as { title: string }).title = 'Mutated';

 const reread = unwrapOrThrow(await repository.findById(saved.id, 'user-1'));
 expect(reread?.title).toBe('Original');
 });
 });
 });
}
