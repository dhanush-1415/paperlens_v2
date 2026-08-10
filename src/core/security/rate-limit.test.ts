import { describe, expect, it } from 'vitest';

import { RATE_LIMITS } from '@/shared/constants/limits';

import {
 createMemoryRateLimiter,
 createPermissiveRateLimiter,
 rateLimitKey,
 retryAfterSeconds,
} from './rate-limit';

/**
 * Rate limiting.
 *
 * The tests below are written against the *port*, not the in-memory adapter, because the
 * adapter is explicitly a placeholder: on more than one instance each process keeps its own
 * counter and the effective limit becomes `limit × instances`. When a Redis limiter replaces
 * it, this file should run against that one unchanged — which is the only way to know the
 * abstraction was real.
 *
 * A sliding window is asserted rather than a fixed one because the difference is exploitable:
 * with fixed windows a client sends `limit` requests at 59s and `limit` more at 61s and
 * passes at twice the intended rate.
 */

function clock(start = 1_000_000) {
 let current = start;
 return {
 now: () => current,
 advance(ms: number) {
 current += ms;
 },
 };
}

const SCOPE = 'auth.login';
const LIMIT = RATE_LIMITS[SCOPE].limit;
const WINDOW_MS = RATE_LIMITS[SCOPE].windowSeconds * 1_000;

describe('the memory limiter', () => {
 it('allows exactly the configured number of requests', async () => {
 const limiter = createMemoryRateLimiter();

 for (let i = 0; i < LIMIT; i += 1) {
 expect((await limiter.consume(SCOPE, 'u1')).allowed, `request ${i + 1}`).toBe(true);
 }
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(false);
 });

 it('counts down remaining and floors it at zero', async () => {
 const limiter = createMemoryRateLimiter();

 expect((await limiter.consume(SCOPE, 'u1')).remaining).toBe(LIMIT - 1);
 const exhausted = await Promise.all(
 Array.from({ length: LIMIT }, () => limiter.consume(SCOPE, 'u1')),
 );
 expect(exhausted.at(-1)?.remaining).toBe(0);
 });

 it('keeps buckets separate per key', async () => {
 // One user hitting their limit must not lock out another. Obvious, and exactly the bug
 // a shared counter keyed on the scope alone would produce.
 const limiter = createMemoryRateLimiter();
 for (let i = 0; i < LIMIT; i += 1) await limiter.consume(SCOPE, 'u1');

 expect((await limiter.consume(SCOPE, 'u2')).allowed).toBe(true);
 });

 it('keeps buckets separate per scope', async () => {
 const limiter = createMemoryRateLimiter();
 for (let i = 0; i < LIMIT; i += 1) await limiter.consume(SCOPE, 'u1');

 expect((await limiter.consume('document.analyze', 'u1')).allowed).toBe(true);
 });

 it('slides rather than resetting on a boundary', async () => {
 // The fixed-window bug in one test: exhaust the limit, advance to just before the
 // window closes, and confirm the client is still blocked rather than handed a fresh
 // allowance because a clock ticked over.
 const time = clock();
 const limiter = createMemoryRateLimiter({ now: time.now });
 for (let i = 0; i < LIMIT; i += 1) await limiter.consume(SCOPE, 'u1');

 time.advance(WINDOW_MS - 1);
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(false);

 time.advance(2);
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(true);
 });

 it('frees capacity one request at a time as the window slides', async () => {
 const time = clock();
 const limiter = createMemoryRateLimiter({ now: time.now });

 await limiter.consume(SCOPE, 'u1');
 time.advance(1_000);
 for (let i = 1; i < LIMIT; i += 1) await limiter.consume(SCOPE, 'u1');
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(false);

 // Only the first request has aged out; exactly one slot should open.
 time.advance(WINDOW_MS - 1_000 + 1);
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(true);
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(false);
 });

 it('does not consume on peek', async () => {
 // The quota meter in the UI must not itself spend quota.
 const limiter = createMemoryRateLimiter();
 for (let i = 0; i < 20; i += 1) await limiter.peek(SCOPE, 'u1');

 expect((await limiter.peek(SCOPE, 'u1')).remaining).toBe(LIMIT);
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(true);
 });

 it('reports when the window resets', async () => {
 const time = clock();
 const limiter = createMemoryRateLimiter({ now: time.now });
 const first = await limiter.consume(SCOPE, 'u1');

 expect(first.resetAt).toBe(time.now() + WINDOW_MS);
 });

 it('clears a key on reset, so support can unblock a user', async () => {
 const limiter = createMemoryRateLimiter();
 for (let i = 0; i < LIMIT; i += 1) await limiter.consume(SCOPE, 'u1');

 await limiter.reset(SCOPE, 'u1');

 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(true);
 });

 it('bounds its own memory', async () => {
 // An unbounded map keyed by IP is a denial-of-service surface: the limiter becomes the
 // thing that exhausts the process.
 const limiter = createMemoryRateLimiter({ maxKeys: 5 });
 for (let i = 0; i < 200; i += 1) await limiter.consume(SCOPE, `ip-${i}`);

 // Recent keys still work; the map has not grown without limit.
 expect((await limiter.peek(SCOPE, 'ip-199')).remaining).toBe(LIMIT - 1);
 });

 it('reports the configured limit back to the caller', async () => {
 const limiter = createMemoryRateLimiter();

 expect((await limiter.consume('document.analyze', 'u1')).limit).toBe(
 RATE_LIMITS['document.analyze'].limit,
 );
 });
});

describe('the permissive limiter', () => {
 it('allows everything, so unrelated tests do not fail on the hundredth run', async () => {
 const limiter = createPermissiveRateLimiter();
 for (let i = 0; i < LIMIT * 3; i += 1) {
 expect((await limiter.consume(SCOPE, 'u1')).allowed).toBe(true);
 }
 });

 it('still reports the real configured limit', async () => {
 expect((await createPermissiveRateLimiter().peek(SCOPE, 'u1')).limit).toBe(LIMIT);
 });
});

describe('the counting identity', () => {
 it('prefers the user id over the IP', () => {
 // Counting a signed-in user by IP punishes everyone behind one office NAT, and lets that
 // user evade the limit by walking to a coffee shop.
 expect(rateLimitKey({ userId: 'u1', ip: '10.0.0.1' })).toBe('u:u1');
 });

 it('falls back to the IP for anonymous traffic', () => {
 expect(rateLimitKey({ ip: '10.0.0.1' })).toBe('ip:10.0.0.1');
 });

 it('degrades to one shared bucket rather than no limit', () => {
 // A global cap is strictly better than silently allowing everything.
 expect(rateLimitKey({})).toBe('anonymous');
 expect(rateLimitKey({ userId: null, ip: null })).toBe('anonymous');
 });
});

describe('retry-after', () => {
 it('rounds up to whole seconds and never returns zero', () => {
 // `Retry-After: 0` invites an immediate retry, which is the opposite of what a limiter
 // that just refused a request wants.
 expect(retryAfterSeconds({ allowed: false, limit: 1, remaining: 0, resetAt: 1_500 }, 1_000)).toBe(1);
 expect(retryAfterSeconds({ allowed: false, limit: 1, remaining: 0, resetAt: 4_100 }, 1_000)).toBe(4);
 });

 it('returns at least one second for a window that already closed', () => {
 expect(retryAfterSeconds({ allowed: false, limit: 1, remaining: 0, resetAt: 0 }, 9_000)).toBe(1);
 });
});
