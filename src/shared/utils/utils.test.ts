import { describe, expect, it, vi } from 'vitest';

import { backoffDelay, dedupe, retry, sleep, withTimeout } from './async';
import { chunk, groupBy, partition, sortBy, toggle, unique, uniqueBy } from './array';
import { addDays, daysBetween, isPast, startOfUtcDay, utcMonthKey } from './date';
import { debounce, once, throttle } from './function';
import { correlationId, slugId, uuid } from './id';
import { clamp, formatBytes, formatMoney, normalize, quotaUsage, roundTo } from './number';
import { compactObject, deepMerge, isPlainObject, omit, pick, shallowEqual } from './object';
import { initials, mask, normalizeParagraphs, slugify, titleCaseFromKey, truncate } from './string';
import { buildQueryString, displayHost, isSafeUrl, isSameOrigin, joinPath, withQuery } from './url';

/**
 * The utility layer.
 *
 * Everything here is pure, which is why it can be tested exhaustively in milliseconds — and
 * why it is worth doing. These are the functions with the highest fan-in in the codebase: a
 * wrong edge case in `clamp` or `isSafeUrl` is wrong in fifty call sites at once, and none of
 * those call sites will have a test that notices.
 *
 * The assertions concentrate on the cases a naive implementation gets wrong, because the
 * happy path of `unique([1,1,2])` is not what breaks in production.
 */

describe('strings', () => {
 it('truncates on grapheme boundaries, not code units', () => {
 // `slice(0, 5)` on this cuts a surrogate pair and renders as `�`. The screenshot bug.
 expect([...truncate('👨‍👩‍👧‍👦 family outing', 8)]).not.toContain('�');
 expect(truncate('short', 20)).toBe('short');
 });

 it('reserves room for the ellipsis inside the limit', () => {
 expect(truncate('abcdefghij', 5)).toHaveLength(5);
 });

 it('collapses blank-line runs while keeping paragraph structure', () => {
 // The pasted-document normaliser. Losing the double newline would merge two clauses into
 // one paragraph and break every character offset a risk flag points at.
 expect(normalizeParagraphs('One\r\n\r\n\r\n\r\nTwo\t three')).toBe('One\n\nTwo three');
 });

 it('turns a key into a label without a lookup table', () => {
 expect(titleCaseFromKey('rental_agreement')).toBe('Rental Agreement');
 expect(titleCaseFromKey('documentAnalysis')).toBe('Document Analysis');
 });

 it('slugifies accents rather than dropping the words containing them', () => {
 expect(slugify('Contrat de Résiliation')).toBe('contrat-de-resiliation');
 expect(slugify(' --Hello, World!-- ')).toBe('hello-world');
 });

 it('takes initials from graphemes, so non-Latin names still work', () => {
 expect(initials('Ada Lovelace')).toBe('AL');
 expect(initials('Ada')).toBe('A');
 expect(initials('')).toBe('');
 });

 it('masks without revealing the length boundary it cannot honour', () => {
 expect(mask('4242424242424242')).toBe('••••••••••••4242');
 // Shorter than the visible window: mask everything rather than show the whole value.
 expect(mask('123', 4)).toBe('•••');
 });
});

describe('numbers', () => {
 it('clamps at both ends', () => {
 expect(clamp(5, 0, 3)).toBe(3);
 expect(clamp(-5, 0, 3)).toBe(0);
 });

 it('normalizes a zero-width range to 0 instead of NaN', () => {
 // `(v - min) / (max - min)` divides by zero here and renders as an empty bar with no
 // explanation. The guard is the whole reason this function exists.
 expect(normalize(5, 5, 5)).toBe(0);
 expect(Number.isNaN(normalize(5, 5, 5))).toBe(false);
 });

 it('treats an unmetered quota as 0% used, never NaN', () => {
 expect(quotaUsage(10, Number.POSITIVE_INFINITY)).toBe(0);
 expect(quotaUsage(10, 0)).toBe(0);
 expect(quotaUsage(5, 10)).toBe(0.5);
 // And never over 100%, however the counters drifted.
 expect(quotaUsage(15, 10)).toBe(1);
 });

 it('formats money from minor units, so no float ever touches a total', () => {
 expect(formatMoney(1999)).toBe('$19.99');
 expect(formatMoney(0)).toBe('$0.00');
 });

 it('formats bytes in base 1024, matching what the OS reports', () => {
 expect(formatBytes(0)).toBe('0 B');
 expect(formatBytes(1024)).toBe('1 KB');
 expect(formatBytes(1536)).toBe('1.5 KB');
 });

 it('rounds to a decimal count without float drift', () => {
 expect(roundTo(1.005, 2)).toBe(1.0);
 expect(roundTo(2.345, 2)).toBe(2.35);
 });
});

describe('arrays', () => {
 it('dedupes by identity and by key', () => {
 expect(unique([1, 1, 2])).toEqual([1, 2]);
 expect(uniqueBy([{ id: 'a' }, { id: 'a' }, { id: 'b' }], (item) => item.id)).toHaveLength(2);
 });

 it('keeps the first occurrence when deduping — order is information', () => {
 expect(uniqueBy([{ id: 'a', n: 1 }, { id: 'a', n: 2 }], (item) => item.id)[0]?.n).toBe(1);
 });

 it('groups and partitions without losing members', () => {
 const items = [1, 2, 3, 4, 5];
 const [even, odd] = partition(items, (n) => n % 2 === 0);

 expect(even.length + odd.length).toBe(items.length);
 expect(Object.values(groupBy(items, (n) => (n % 2 === 0 ? 'even' : 'odd'))).flat()).toHaveLength(
 items.length,
 );
 });

 it('chunks with a short final chunk rather than padding', () => {
 expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
 expect(chunk([], 2)).toEqual([]);
 });

 it('sorts without mutating the input', () => {
 const input = [{ n: 3 }, { n: 1 }];
 const sorted = sortBy(input, (item) => item.n);

 expect(sorted[0]?.n).toBe(1);
 expect(input[0]?.n).toBe(3);
 });

 it('toggles membership', () => {
 expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
 expect(toggle(['a', 'b'], 'b')).toEqual(['a']);
 });
});

describe('objects', () => {
 it('picks and omits without touching the source', () => {
 const source = { a: 1, b: 2, c: 3 };

 expect(pick(source, ['a', 'c'])).toEqual({ a: 1, c: 3 });
 expect(omit(source, ['b'])).toEqual({ a: 1, c: 3 });
 expect(source).toEqual({ a: 1, b: 2, c: 3 });
 });

 it('drops undefined but keeps null and false', () => {
 // `null` is a value the server chose; `undefined` is the absence of a decision. Collapsing
 // them turns "clear this field" into "leave it alone" on every PATCH in the app.
 expect(compactObject({ a: 1, b: undefined, c: null, d: false })).toEqual({
 a: 1,
 c: null,
 d: false,
 });
 });

 it('recognises a plain object and rejects everything that merely looks like one', () => {
 expect(isPlainObject({})).toBe(true);
 expect(isPlainObject([])).toBe(false);
 expect(isPlainObject(null)).toBe(false);
 expect(isPlainObject(new Date())).toBe(false);
 });

 it('compares shallowly by value, not by reference', () => {
 expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
 expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
 expect(shallowEqual({ a: { n: 1 } }, { a: { n: 1 } })).toBe(false);
 });

 it('deep-merges nested config without replacing whole branches', () => {
 // The tenant-override case: a tenant setting one brand token must not wipe the rest.
 expect(deepMerge({ a: { x: 1, y: 2 } }, { a: { y: 9 } } as never)).toEqual({
 a: { x: 1, y: 9 },
 });
 });
});

describe('urls', () => {
 it('drops empty params so two equivalent URLs cache as one', () => {
 expect(buildQueryString({ q: 'lease', page: 1, empty: '', missing: undefined })).toBe(
 '?q=lease&page=1',
 );
 expect(buildQueryString({})).toBe('');
 });

 it('encodes rather than concatenates', () => {
 // The injection case: an unencoded `&` would split this into two parameters.
 expect(buildQueryString({ q: 'a&b=c' })).toBe('?q=a%26b%3Dc');
 });

 it('merges into an existing query and removes on empty', () => {
 expect(withQuery('/vault?page=2', { q: 'lease' })).toBe('/vault?page=2&q=lease');
 expect(withQuery('/vault?page=2&q=x', { q: '' })).toBe('/vault?page=2');
 });

 it('joins paths without doubling or losing slashes', () => {
 expect(joinPath('/api', 'v1', 'documents')).toBe('/api/v1/documents');
 expect(joinPath('/api/', '/v1/')).toBe('/api/v1');
 expect(joinPath('documents')).toBe('/documents');
 });

 it('rejects every scheme that is not http(s)', () => {
 // `javascript:` in an href is the classic stored-XSS vector, and `data:` is a phishing
 // primitive. Both parse fine as URLs, which is why a `new URL()` check alone is not one.
 expect(isSafeUrl('https://example.com')).toBe(true);
 expect(isSafeUrl('http://example.com')).toBe(true);
 expect(isSafeUrl('javascript:alert(1)')).toBe(false);
 expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
 expect(isSafeUrl('not a url')).toBe(false);
 });

 it('detects same-origin including protocol-relative and path forms', () => {
 expect(isSameOrigin('/vault', 'https://app.test')).toBe(true);
 expect(isSameOrigin('https://app.test/vault', 'https://app.test')).toBe(true);
 expect(isSameOrigin('https://evil.test/vault', 'https://app.test')).toBe(false);
 });

 it('shows a host a user can read, and falls back to the raw value', () => {
 expect(displayHost('https://www.example.com/a/b')).toBe('example.com');
 expect(displayHost('nonsense')).toBe('nonsense');
 });
});

describe('ids', () => {
 it('generates distinct v4 uuids', () => {
 const ids = new Set(Array.from({ length: 200 }, () => uuid()));

 expect(ids.size).toBe(200);
 for (const id of ids) {
 expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 }
 });

 it('produces a correlation id that is greppable in a log', () => {
 expect(correlationId()).toMatch(/^pl_[a-z0-9-]+$/i);
 expect(correlationId()).not.toBe(correlationId());
 });

 it('slugs an id with a fallback for unsluggable input', () => {
 expect(slugId('My Lease Agreement')).toContain('my-lease-agreement');
 expect(slugId('!!!', 'document')).toContain('document');
 });
});

describe('backoff', () => {
 const noJitter = { jitter: 0, random: () => 0.5 };

 it('doubles the delay per attempt', () => {
 expect(backoffDelay(1, { baseMs: 100, ...noJitter })).toBe(100);
 expect(backoffDelay(2, { baseMs: 100, ...noJitter })).toBe(200);
 expect(backoffDelay(3, { baseMs: 100, ...noJitter })).toBe(400);
 });

 it('caps at maxMs, so attempt 12 does not wait an hour', () => {
 expect(backoffDelay(12, { baseMs: 100, maxMs: 1_000, ...noJitter })).toBe(1_000);
 });

 it('spreads retries around the exponential rather than landing on it', () => {
 // Without jitter every client that failed during an outage retries at the same instant
 // and re-creates the outage the moment the service recovers. The spread is the fix, and
 // it has to be verifiably non-zero.
 const low = backoffDelay(3, { baseMs: 100, jitter: 0.5, random: () => 0 });
 const high = backoffDelay(3, { baseMs: 100, jitter: 0.5, random: () => 1 });

 expect(low).toBeLessThan(400);
 expect(high).toBeGreaterThan(400);
 });
});

describe('retry', () => {
 const instant = { baseMs: 0, jitter: 0 };

 it('returns the first success without retrying', async () => {
 const operation = vi.fn(async () => 'ok');

 expect(await retry(operation, instant)).toBe('ok');
 expect(operation).toHaveBeenCalledTimes(1);
 });

 it('retries up to the attempt count and then rethrows the last error', async () => {
 const operation = vi.fn(async () => {
 throw new Error('always fails');
 });

 await expect(retry(operation, { ...instant, attempts: 3 })).rejects.toThrow('always fails');
 expect(operation).toHaveBeenCalledTimes(3);
 });

 it('stops immediately when shouldRetry says the error is terminal', async () => {
 // A 400 will not become a 200 however often you ask. Retrying it burns the user's time
 // and the service's capacity for a guaranteed failure.
 const operation = vi.fn(async () => {
 throw new Error('bad request');
 });

 await expect(
 retry(operation, { ...instant, attempts: 5, shouldRetry: () => false }),
 ).rejects.toThrow('bad request');
 expect(operation).toHaveBeenCalledTimes(1);
 });

 it('reports each retry, so a log shows the pattern and not just the outcome', async () => {
 const onRetry = vi.fn();
 let calls = 0;

 await retry(
 async () => {
 calls += 1;
 if (calls < 3) throw new Error('transient');
 return 'ok';
 },
 { ...instant, attempts: 3, onRetry },
 );

 expect(onRetry).toHaveBeenCalledTimes(2);
 });
});

describe('timeout, sleep and dedupe', () => {
 it('rejects a promise that outruns its deadline', async () => {
 await expect(withTimeout(sleep(50), 5, 'too slow')).rejects.toThrow('too slow');
 });

 it('passes through a promise that settles in time', async () => {
 await expect(withTimeout(Promise.resolve('fast'), 50)).resolves.toBe('fast');
 });

 it('honours an abort signal rather than sleeping out the full delay', async () => {
 const controller = new AbortController();
 const pending = sleep(5_000, controller.signal);
 controller.abort(new Error('aborted'));

 await expect(pending).rejects.toThrow('aborted');
 });

 it('collapses concurrent identical calls into one', async () => {
 // Five components mounting at once must produce one request, not five.
 const underlying = vi.fn(async (id: string) => `value-${id}`);
 const deduped = dedupe(underlying);

 const results = await Promise.all([deduped('a'), deduped('a'), deduped('b')]);

 expect(results).toEqual(['value-a', 'value-a', 'value-b']);
 expect(underlying).toHaveBeenCalledTimes(2);
 });

 it('drops the entry once settled — it deduplicates, it does not cache', async () => {
 const underlying = vi.fn(async () => 'value');
 const deduped = dedupe(underlying);

 await deduped();
 await deduped();

 expect(underlying).toHaveBeenCalledTimes(2);
 });
});

describe('debounce, throttle, once', () => {
 it('debounce runs once, after the quiet period, with the last arguments', async () => {
 const spy = vi.fn();
 const debounced = debounce(spy, 10);

 debounced('first');
 debounced('second');
 await sleep(30);

 expect(spy).toHaveBeenCalledTimes(1);
 expect(spy).toHaveBeenCalledWith('second');
 });

 it('debounce can be cancelled before it fires', async () => {
 const spy = vi.fn();
 const debounced = debounce(spy, 10);

 debounced('x');
 debounced.cancel();
 await sleep(30);

 expect(spy).not.toHaveBeenCalled();
 });

 it('throttle runs on the leading edge and then rate-limits', async () => {
 const spy = vi.fn();
 const throttled = throttle(spy, 20);

 throttled('a');
 throttled('b');
 throttled('c');

 expect(spy).toHaveBeenCalledTimes(1);
 expect(spy).toHaveBeenCalledWith('a');
 });

 it('once memoises the first result, including for a thrown-away second call', () => {
 const spy = vi.fn(() => ({ built: true }));
 const build = once(spy);

 expect(build()).toBe(build());
 expect(spy).toHaveBeenCalledTimes(1);
 });
});

describe('dates', () => {
 const now = new Date('2026-03-15T12:30:00.000Z');

 it('adds days across a month boundary', () => {
 expect(addDays(new Date('2026-01-31T00:00:00.000Z'), 1).toISOString()).toBe(
 '2026-02-01T00:00:00.000Z',
 );
 });

 it('counts whole days between two instants', () => {
 expect(daysBetween('2026-03-01T00:00:00.000Z', '2026-03-15T00:00:00.000Z')).toBe(14);
 });

 it('answers isPast against the clock it is given', () => {
 expect(isPast('2026-01-01T00:00:00.000Z', now)).toBe(true);
 expect(isPast('2026-12-01T00:00:00.000Z', now)).toBe(false);
 });

 it('truncates to the UTC day, not the local one', () => {
 // A server in one timezone and a user in another must agree on which day a document was
 // analysed. UTC is the only answer both can compute.
 expect(startOfUtcDay(now).toISOString()).toBe('2026-03-15T00:00:00.000Z');
 });

 it('produces a sortable month key for usage buckets', () => {
 expect(utcMonthKey(now)).toBe('2026-03');
 });
});
