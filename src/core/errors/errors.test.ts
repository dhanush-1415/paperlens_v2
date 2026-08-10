import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createBoundaryDeps } from '@/test/fakes';

import { AppError, isAppError, notFoundError, rateLimitError, validationError } from './app-error';
import { withActionErrors, withRouteErrors } from './boundaries';
import { ERROR_CODES, isErrorCode } from './codes';
import { normalizeError, toFieldErrors } from './normalize';

/**
 * Two properties are load-bearing here and everything else is detail:
 *
 * 1. `normalizeError` turns the six things a `catch` actually receives into exactly one type,
 * so no boundary has to re-guess what a rejected fetch means.
 * 2. It rethrows framework control-flow signals instead of swallowing them. A `redirect()`
 * that gets caught does not error — it silently does nothing, which is the worst kind of
 * bug because no test fails and no log line appears.
 */

describe('AppError', () => {
 it('reads its behaviour from the registry rather than the call site', () => {
 const error = new AppError('NOT_FOUND');

 expect(error).toBeInstanceOf(Error);
 expect(error.name).toBe('AppError');
 expect(error.status).toBe(ERROR_CODES.NOT_FOUND.status);
 expect(error.category).toBe(ERROR_CODES.NOT_FOUND.category);
 expect(error.retryable).toBe(ERROR_CODES.NOT_FOUND.retryable);
 expect(error.messageKey).toBe(ERROR_CODES.NOT_FOUND.messageKey);
 });

 it('is recognised by its guard across the module boundary', () => {
 expect(isAppError(new AppError('INTERNAL_ERROR'))).toBe(true);
 expect(isAppError(new Error('plain'))).toBe(false);
 expect(isAppError({ code: 'NOT_FOUND' })).toBe(false);
 });

 it('withContext and withCorrelationId copy rather than mutate', () => {
 const original = new AppError('UPSTREAM_ERROR', { context: { a: 1 } });
 const enriched = original.withContext({ b: 2 }).withCorrelationId('cid-1');

 expect(original.context).toEqual({ a: 1 });
 expect(original.correlationId).toBeUndefined();
 expect(enriched.context).toEqual({ a: 1, b: 2 });
 expect(enriched.correlationId).toBe('cid-1');
 });

 it('toClient omits everything that could leak — message, context, cause, stack', () => {
 const error = new AppError('UPSTREAM_ERROR', {
 message: 'postgres://user:password@host timed out',
 context: { query: 'SELECT * FROM users' },
 cause: new Error('inner'),
 });

 const wire = error.toClient();
 const serialized = JSON.stringify(wire);

 expect(wire.code).toBe('UPSTREAM_ERROR');
 expect(wire.messageKey).toBe(ERROR_CODES.UPSTREAM_ERROR.messageKey);
 expect(serialized).not.toContain('password');
 expect(serialized).not.toContain('SELECT');
 expect(Object.keys(wire)).not.toContain('stack');
 expect(Object.keys(wire)).not.toContain('context');
 });

 it('toLog keeps the detail toClient drops', () => {
 const log = new AppError('INTERNAL_ERROR', {
 message: 'boom',
 context: { userId: 'u1' },
 cause: new Error('inner'),
 }).toLog();

 expect(log.message).toBe('boom');
 expect(log.context).toEqual({ userId: 'u1' });
 expect(log.stack).toBeTypeOf('string');
 expect(log.cause).toMatchObject({ message: 'inner' });
 });

 it('factories set the fields their callers branch on', () => {
 expect(notFoundError('document', 'abc').code).toBe('NOT_FOUND');
 expect(rateLimitError(30, 'auth.login').retryAfterSeconds).toBe(30);
 expect(validationError({ email: ['bad'] }).fieldErrors).toEqual({ email: ['bad'] });
 });
});

describe('the code registry', () => {
 it('is exhaustive — every entry carries the full behaviour contract', () => {
 for (const [code, definition] of Object.entries(ERROR_CODES)) {
 expect(definition.status, code).toBeGreaterThanOrEqual(400);
 expect(definition.messageKey, code).toMatch(/^errors\./);
 expect(typeof definition.retryable, code).toBe('boolean');
 expect(typeof definition.report, code).toBe('boolean');
 }
 });

 it('isErrorCode rejects anything not in the registry', () => {
 expect(isErrorCode('NOT_FOUND')).toBe(true);
 expect(isErrorCode('INTERNAL')).toBe(false);
 expect(isErrorCode('')).toBe(false);
 });
});

describe('normalizeError', () => {
 it('passes an AppError through untouched — same instance, no re-wrap', () => {
 const original = notFoundError('document', 'x');
 expect(normalizeError(original)).toBe(original);
 });

 it('rebuilds an AppError that lost its prototype crossing a boundary', () => {
 const wire = JSON.parse(JSON.stringify(new AppError('FORBIDDEN').toClient()));
 const restored = normalizeError(wire);

 expect(restored).toBeInstanceOf(AppError);
 expect(restored.code).toBe('FORBIDDEN');
 });

 it('falls back to INTERNAL_ERROR when a wire error carries an unknown code', () => {
 const restored = normalizeError({ name: 'AppError', code: 'MADE_UP_CODE', status: 500 });
 expect(restored.code).toBe('INTERNAL_ERROR');
 });

 it('turns a ZodError into a validation error with dotted field paths', () => {
 const schema = z.object({ user: z.object({ email: z.email() }) });
 const parsed = schema.safeParse({ user: { email: 'nope' } });

 const error = normalizeError(parsed.success ? null : parsed.error);

 expect(error.code).toBe('VALIDATION_FAILED');
 expect(Object.keys(error.fieldErrors ?? {})).toContain('user.email');
 });

 it('maps an aborted request to TIMEOUT', () => {
 expect(normalizeError(new DOMException('aborted', 'AbortError')).code).toBe('TIMEOUT');
 });

 it('maps a timed-out request to TIMEOUT', async () => {
 // `AbortSignal.timeout()` rejects with a `TimeoutError`, not an `AbortError` — a
 // different name for the same condition, and the one the HTTP client's own budget
 // produces. Matching only `AbortError` reported every slow upstream as a crash in our
 // code.
 const signal = AbortSignal.timeout(1);
 await new Promise((resolve) => setTimeout(resolve, 20));

 expect(normalizeError(signal.reason).code).toBe('TIMEOUT');
 });

 it('recognises an abort constructed in another realm', () => {
 // The reason attached to an aborted fetch does not pass `instanceof DOMException` — it
 // was constructed inside undici, in a different realm from the ambient binding. Matching
 // on the class silently drops these into INTERNAL_ERROR; matching on the name does not.
 const foreign = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });

 expect(normalizeError(foreign).code).toBe('TIMEOUT');
 });

 it('recognises a dead connection behind undici’s TypeError', () => {
 expect(normalizeError(new TypeError('fetch failed')).code).toBe('NETWORK_UNAVAILABLE');
 expect(normalizeError(new TypeError('getaddrinfo ENOTFOUND api.test')).code).toBe(
 'NETWORK_UNAVAILABLE',
 );
 });

 it('wraps an ordinary Error and keeps it as the cause', () => {
 const cause = new Error('kaboom');
 const error = normalizeError(cause);

 expect(error.code).toBe('INTERNAL_ERROR');
 expect(error.message).toBe('kaboom');
 expect(error.cause).toBe(cause);
 });

 it('survives a thrown non-Error, including one JSON cannot stringify', () => {
 expect(normalizeError('a string').code).toBe('INTERNAL_ERROR');

 const circular: Record<string, unknown> = {};
 circular.self = circular;
 expect(() => normalizeError(circular)).not.toThrow();
 });

 it('rethrows a framework control-flow signal instead of normalising it', () => {
 // Next marks these with a digest; `unstable_rethrow` recognises the shape and throws it
 // back out. If this ever regresses, every redirect() inside a try/catch becomes a no-op.
 const redirectSignal = Object.assign(new Error('NEXT_REDIRECT'), {
 digest: 'NEXT_REDIRECT;replace;/login;307;',
 });

 expect(() => normalizeError(redirectSignal)).toThrowError(redirectSignal);
 });
});

describe('toFieldErrors', () => {
 it('groups multiple issues under one path and buckets root issues under _form', () => {
 const schema = z.object({ name: z.string().min(3).regex(/^[a-z]+$/) });
 const parsed = schema.safeParse({ name: '1' });
 const fieldErrors = toFieldErrors(parsed.success ? new z.ZodError([]) : parsed.error);

 expect(fieldErrors.name?.length).toBeGreaterThan(1);

 const rootIssue = new z.ZodError([
 { code: 'custom', message: 'whole form is wrong', path: [] },
 ]);
 expect(toFieldErrors(rootIssue)._form).toEqual(['whole form is wrong']);
 });
});

describe('withActionErrors', () => {
 it('returns ok for a successful action', async () => {
 const wrapped = withActionErrors('test.op', async () => 'value', createBoundaryDeps());
 await expect(wrapped()).resolves.toEqual({ ok: true, value: 'value' });
 });

 it('converts a thrown failure into a serialized error the client can branch on', async () => {
 const deps = createBoundaryDeps();
 const wrapped = withActionErrors(
 'test.op',
 async () => {
 throw notFoundError('document', 'x');
 },
 deps,
 );

 const result = await wrapped();

 expect(result.ok).toBe(false);
 if (!result.ok) {
 expect(result.error.code).toBe('NOT_FOUND');
 // Plain data — it has to survive the RSC boundary.
 expect(result.error).toEqual(JSON.parse(JSON.stringify(result.error)));
 }
 });

 it('logs at the severity the code declares and reports only when the code says to', async () => {
 // The point of putting `report` in the registry: whether an incident pages someone is a
 // property of the failure, decided once, not a judgement call at each throw site.
 const notFound = createBoundaryDeps();
 await withActionErrors('test.op', async () => {
 throw notFoundError('document', 'x');
 }, notFound)();

 expect(notFound.logger.records).toHaveLength(1);
 expect(notFound.reporter.reports).toHaveLength(0);

 const internal = createBoundaryDeps();
 await withActionErrors('test.op', async () => {
 throw new Error('kaboom');
 }, internal)();

 expect(internal.logger.records[0]?.level).toBe('error');
 expect(internal.reporter.reports).toHaveLength(1);
 expect(internal.reporter.reports[0]?.context.tags).toMatchObject({
 code: 'INTERNAL_ERROR',
 operation: 'test.op',
 });
 });

 it('does not catch a redirect — the navigation must still happen', async () => {
 const redirectSignal = Object.assign(new Error('NEXT_REDIRECT'), {
 digest: 'NEXT_REDIRECT;replace;/login;307;',
 });

 const wrapped = withActionErrors(
 'test.op',
 async () => {
 throw redirectSignal;
 },
 createBoundaryDeps(),
 );

 await expect(wrapped()).rejects.toThrowError(redirectSignal);
 });

 it('passes its arguments through unchanged', async () => {
 const spy = vi.fn(async (a: number, b: number) => a + b);
 const wrapped = withActionErrors('test.op', spy, createBoundaryDeps());

 await expect(wrapped(2, 3)).resolves.toEqual({ ok: true, value: 5 });
 expect(spy).toHaveBeenCalledWith(2, 3);
 });
});

describe('withRouteErrors', () => {
 it('answers with the application error envelope and the code’s status', async () => {
 const wrapped = withRouteErrors(
 'test.route',
 async () => {
 throw notFoundError('document', 'x');
 },
 createBoundaryDeps(),
 );

 const response = await wrapped();
 const body = (await response.json()) as { error: { code: string } };

 expect(response.status).toBe(404);
 expect(response.headers.get('content-type')).toBe('application/json');
 expect(body.error.code).toBe('NOT_FOUND');
 });

 it('sets Retry-After when the error carries one', async () => {
 const wrapped = withRouteErrors(
 'test.route',
 async () => {
 throw rateLimitError(42, 'auth.login');
 },
 createBoundaryDeps(),
 );

 expect((await wrapped()).headers.get('retry-after')).toBe('42');
 });

 it('leaves a successful response untouched', async () => {
 const response = new Response('ok');
 const wrapped = withRouteErrors('test.route', async () => response, createBoundaryDeps());

 await expect(wrapped()).resolves.toBe(response);
 });
});
