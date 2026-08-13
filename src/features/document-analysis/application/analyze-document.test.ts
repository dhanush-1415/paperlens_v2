import { describe, expect, it } from 'vitest';

import { internalError, upstreamError } from '@/core/errors/app-error';
import { err, isErr, isOk, ok, unwrapOrThrow } from '@/core/result/result';
import { INPUT_LIMITS } from '@/shared/constants/limits';

import {
 type AnalysisDraft,
 type DocumentAnalysis,
 type DocumentAnalysisRepository,
 type DocumentAnalyzer,
 type RiskFlag,
} from '../domain';
import { createAnalyzeDocument } from './analyze-document';

/**
 * The use case, exercised with three hand-written fakes and no container.
 *
 * That is the payoff for constructor injection: this file needs no bootstrap, no request, no
 * database and no framework. Every collaborator is a literal, and the failure cases that are
 * awkward to provoke in an integration test — the analyzer being down, the store returning
 * someone else's row — are two lines each.
 */

const VALID_TEXT = 'This lease agreement contains terms.'.repeat(4);
const FIXED_NOW = new Date('2026-04-01T09:30:00.000Z');

const criticalFlag: RiskFlag = {
 id: 'flag-1',
 category: 'arbitration',
 level: 'critical',
 title: 'Waives your right to sue',
 excerpt: 'binding arbitration',
 explanation: 'You cannot take this to court.',
 charStart: 0,
 charEnd: 19,
};

function fakeAnalyzer(flags: readonly RiskFlag[] = []): DocumentAnalyzer {
 return { name: 'fake', analyze: async () => ok({ flags, summary: null, actionPlan: [], urgency: null, entities: [], legitimacy: null, confidence: null, suggestedQuestions: [] }) };
}

function failingAnalyzer(): DocumentAnalyzer {
 return { name: 'failing', analyze: async () => err(upstreamError('analyzer')) };
}

/** Records what it was asked to save, which is how the draft's derived fields are asserted. */
function fakeRepository(overrides: Partial<DocumentAnalysisRepository> = {}) {
 const saved: AnalysisDraft[] = [];

 const repository: DocumentAnalysisRepository = {
 async save(draft) {
 saved.push(draft);
 return ok({ ...draft, id: `id-${saved.length}` } as DocumentAnalysis);
 },
 async findById() {
 return ok(null);
 },
 async listRecent() {
 return ok([]);
 },
 async remove() {
 return ok(undefined);
 },
 ...overrides,
 };

 return { repository, saved };
}

function subject(analyzer: DocumentAnalyzer, repository: DocumentAnalysisRepository) {
 return createAnalyzeDocument({ analyzer, repository, now: () => FIXED_NOW });
}

describe('validation — the invariant, not the form message', () => {
 it('rejects text below the minimum', async () => {
 const { repository } = fakeRepository();
 const result = await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text: 'too short',
 documentType: 'other',
 });

 expect(isErr(result)).toBe(true);
 expect(isErr(result) && result.error.code).toBe('VALIDATION_FAILED');
 expect(isErr(result) && result.error.fieldErrors?.text).toBeDefined();
 });

 it('rejects text above the maximum', async () => {
 const { repository } = fakeRepository();
 const result = await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text: 'x'.repeat(INPUT_LIMITS.maxDocumentChars + 1),
 documentType: 'other',
 });

 expect(isErr(result) && result.error.code).toBe('VALIDATION_FAILED');
 });

 it('trims before measuring — whitespace is not content', async () => {
 const { repository } = fakeRepository();
 const padded = `${' '.repeat(200)}short${' '.repeat(200)}`;

 const result = await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text: padded,
 documentType: 'other',
 });

 expect(isErr(result)).toBe(true);
 });

 it('never reaches the analyzer when the input is invalid', async () => {
 let called = false;
 const analyzer: DocumentAnalyzer = {
 name: 'spy',
 analyze: async () => {
 called = true;
 return ok({ flags: [], summary: null, actionPlan: [], urgency: null, entities: [], legitimacy: null, confidence: null, suggestedQuestions: [] });
 },
 };

 await subject(analyzer, fakeRepository().repository)({
 ownerId: 'user-1',
 text: 'nope',
 documentType: 'other',
 });

 expect(called).toBe(false);
 });
});

describe('the happy path', () => {
 it('analyses, scores and persists in one operation', async () => {
 const { repository, saved } = fakeRepository();

 const result = await subject(fakeAnalyzer([criticalFlag]), repository)({
 ownerId: 'user-1',
 text: VALID_TEXT,
 documentType: 'rental_agreement',
 title: 'My lease',
 });

 const analysis = unwrapOrThrow(result);

 expect(analysis.id).toBe('id-1');
 expect(analysis.ownerId).toBe('user-1');
 expect(analysis.flags).toEqual([criticalFlag]);
 expect(saved).toHaveLength(1);
 });

 it('scores with the domain rule rather than asking the analyzer', async () => {
 // The analyzer returns flags and nothing else. If scoring lived in the adapter, two
 // adapters would score the same clauses two ways and the port would be a lie.
 const { repository } = fakeRepository();

 const analysis = unwrapOrThrow(
 await subject(fakeAnalyzer([criticalFlag]), repository)({
 ownerId: 'user-1',
 text: VALID_TEXT,
 documentType: 'rental_agreement',
 }),
 );

 expect(analysis.score.counts.critical).toBe(1);
 expect(analysis.score.value).toBeLessThan(100);
 });

 it('stamps the time from the injected clock, never the wall clock', async () => {
 const { repository } = fakeRepository();

 const analysis = unwrapOrThrow(
 await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text: VALID_TEXT,
 documentType: 'other',
 }),
 );

 expect(analysis.analyzedAt).toBe(FIXED_NOW.toISOString());
 });

 it('records the trimmed character count, not the raw length', async () => {
 const { repository, saved } = fakeRepository();

 await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text: `\n\n ${VALID_TEXT} \n`,
 documentType: 'other',
 });

 expect(saved[0]?.charCount).toBe(VALID_TEXT.length);
 });
});

describe('title derivation', () => {
 const analyse = async (text: string, title?: string) => {
 const { repository, saved } = fakeRepository();
 await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text,
 documentType: 'rental_agreement',
 ...(title === undefined ? {} : { title }),
 });
 return saved[0]?.title;
 };

 it('prefers the supplied title, trimmed', async () => {
 expect(await analyse(VALID_TEXT, ' My lease ')).toBe('My lease');
 });

 it('falls back to the first non-empty line when the title is blank', async () => {
 // A whitespace-only title is not a title. `||` rather than `??` is what makes that true.
 expect(await analyse(`Residential Tenancy Agreement\n${VALID_TEXT}`, ' ')).toBe(
 'Residential Tenancy Agreement',
 );
 });

 it('skips leading blank lines', async () => {
 expect(await analyse(`\n\n \nAgreement of Lease\n${VALID_TEXT}`)).toBe('Agreement of Lease');
 });

 it('truncates a long first line with a real ellipsis character', async () => {
 const title = await analyse(`${'A'.repeat(200)}\n${VALID_TEXT}`);

 expect(title?.length).toBeLessThanOrEqual(72);
 expect(title?.endsWith('…')).toBe(true);
 expect(title).not.toContain('...');
 });

 it('trims trailing whitespace before appending the ellipsis', async () => {
 // Cutting mid-word leaves "…betwe…"; cutting on a space would leave a floating "… …".
 const title = await analyse(`${'word '.repeat(40)}\n${VALID_TEXT}`);

 expect(title?.endsWith(' …')).toBe(false);
 expect(title?.endsWith('…')).toBe(true);
 });

 it('always produces a non-empty title', async () => {
 // The one property every caller depends on. `DEFAULT_TITLES` is the guard for callers
 // that reach `deriveTitle` with no usable line at all; through this use case the
 // minimum-length rule already makes that unreachable, so the invariant is what is
 // asserted rather than the branch.
 for (const text of [`.\n${VALID_TEXT}`, `- -\n${VALID_TEXT}`, VALID_TEXT]) {
 expect((await analyse(text))?.length).toBeGreaterThan(0);
 }
 });
});

describe('failure propagation', () => {
 it('returns the analyzer’s own error rather than re-wrapping it', async () => {
 const { repository, saved } = fakeRepository();

 const result = await subject(failingAnalyzer(), repository)({
 ownerId: 'user-1',
 text: VALID_TEXT,
 documentType: 'other',
 });

 // The precise cause survives: the boundary needs the code, severity and retryability the
 // analyzer already set. A generic wrapper here would throw all three away.
 expect(isErr(result) && result.error.code).toBe('UPSTREAM_ERROR');
 expect(saved).toHaveLength(0);
 });

 it('returns the repository’s error', async () => {
 const { repository } = fakeRepository({
 save: async () => err(internalError('disk on fire')),
 });

 const result = await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text: VALID_TEXT,
 documentType: 'other',
 });

 expect(isErr(result) && result.error.code).toBe('INTERNAL_ERROR');
 });

 it('refuses a saved analysis that came back owned by someone else', async () => {
 // A store returning another user's row is either compromised or wrong. This is the last
 // place the mistake is cheap — one comparison turns a data leak into a 500.
 const { repository } = fakeRepository({
 save: async (draft) => ok({ ...draft, ownerId: 'attacker', id: 'id-1' } as DocumentAnalysis),
 });

 const result = await subject(fakeAnalyzer(), repository)({
 ownerId: 'user-1',
 text: VALID_TEXT,
 documentType: 'other',
 });

 expect(isOk(result)).toBe(false);
 expect(isErr(result) && result.error.code).toBe('INTERNAL_ERROR');
 });
});
