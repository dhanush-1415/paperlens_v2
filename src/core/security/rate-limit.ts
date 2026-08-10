/**
 * Rate limiting (requirement 15).
 *
 * A port plus an in-memory adapter. The port matters more than the adapter: rate limiting is
 * the one piece of security infrastructure that *must* move to shared state the moment the
 * app runs on more than one instance, and code that called a concrete limiter directly would
 * have to be rewritten at exactly the wrong moment.
 *
 * The limits themselves are not defined here — they live in `shared/constants/limits.ts`
 * alongside plan quotas, because "how many scans per hour" is a product decision and belongs
 * next to the other product decisions.
 */

import { RATE_LIMITS, type RateLimitScope } from '@/shared/constants/limits';

export interface RateLimitDecision {
 readonly allowed: boolean;
 /** Requests permitted in this window. */
 readonly limit: number;
 /** Requests left. Zero when `allowed` is false. */
 readonly remaining: number;
 /** Epoch ms when the window resets. Becomes the `Retry-After` header. */
 readonly resetAt: number;
}

export interface RateLimiter {
 readonly name: string;
 /**
 * Consume one unit against `key` in `scope`.
 *
 * Async because every distributed implementation is. Making the port synchronous to suit
 * the in-memory fake would force a rewrite of every call site the day Redis arrives.
 */
 consume(scope: RateLimitScope, key: string): Promise<RateLimitDecision>;
 /** Read the current state without consuming. For rendering a quota meter. */
 peek(scope: RateLimitScope, key: string): Promise<RateLimitDecision>;
 /** Clear a key. For tests, and for support un-blocking a user. */
 reset(scope: RateLimitScope, key: string): Promise<void>;
}

/**
 * In-memory sliding-window limiter.
 *
 * **Single-process only, and that limitation is the point.** On serverless or any multi-
 * instance deployment each instance keeps its own counter, so the effective limit is
 * `limit × instances`. That is a real hole, and naming it here is cheaper than discovering
 * it during an incident. It is correct for local development, for tests, and for a
 * single-container deployment; it is a placeholder everywhere else.
 *
 * The algorithm is a sliding window of timestamps rather than a fixed-window counter, which
 * avoids the classic burst at a window edge: with fixed windows, a client can send `limit`
 * requests at 59s and `limit` more at 61s and pass twice the intended rate.
 */
export interface MemoryRateLimiterOptions {
 now?: () => number;
 /** Entries are dropped after this long without use, so the map cannot grow unbounded. */
 maxKeys?: number;
}

export function createMemoryRateLimiter(options: MemoryRateLimiterOptions = {}): RateLimiter {
 const { now = () => Date.now(), maxKeys = 10_000 } = options;

 /** `scope:key` -> ascending timestamps of consumed units within the window. */
 const buckets = new Map<string, number[]>();

 function windowFor(scope: RateLimitScope): { limit: number; windowMs: number } {
 const config = RATE_LIMITS[scope];
 return { limit: config.limit, windowMs: config.windowSeconds * 1_000 };
 }

 function prune(bucketKey: string, windowMs: number): number[] {
 const cutoff = now() - windowMs;
 const hits = (buckets.get(bucketKey) ?? []).filter((at) => at > cutoff);

 if (hits.length === 0) buckets.delete(bucketKey);
 else buckets.set(bucketKey, hits);

 return hits;
 }

 function evictIfNeeded(): void {
 if (buckets.size <= maxKeys) return;
 // Map preserves insertion order, so the first key is the least recently created. Good
 // enough for a fake; a real limiter delegates expiry to the store's TTL.
 const oldest = buckets.keys().next().value;
 if (oldest !== undefined) buckets.delete(oldest);
 }

 function decide(scope: RateLimitScope, key: string, consumeOne: boolean): RateLimitDecision {
 const { limit, windowMs } = windowFor(scope);
 const bucketKey = `${scope}:${key}`;
 const hits = prune(bucketKey, windowMs);

 const oldest = hits[0];
 const resetAt = oldest === undefined ? now() + windowMs : oldest + windowMs;

 if (hits.length >= limit) {
 return { allowed: false, limit, remaining: 0, resetAt };
 }

 if (consumeOne) {
 hits.push(now());
 buckets.set(bucketKey, hits);
 evictIfNeeded();
 }

 return {
 allowed: true,
 limit,
 remaining: Math.max(0, limit - hits.length),
 resetAt,
 };
 }

 return {
 name: 'memory',
 consume: (scope, key) => Promise.resolve(decide(scope, key, true)),
 peek: (scope, key) => Promise.resolve(decide(scope, key, false)),
 reset: (scope, key) => {
 buckets.delete(`${scope}:${key}`);
 return Promise.resolve();
 },
 };
}

/**
 * Allows everything.
 *
 * For tests that are not about rate limiting, where a shared limiter would otherwise make
 * the hundredth test in a file fail for reasons the hundredth test knows nothing about.
 */
export function createPermissiveRateLimiter(): RateLimiter {
 const decision = (scope: RateLimitScope): RateLimitDecision => ({
 allowed: true,
 limit: RATE_LIMITS[scope].limit,
 remaining: RATE_LIMITS[scope].limit,
 resetAt: 0,
 });

 return {
 name: 'permissive',
 consume: (scope) => Promise.resolve(decision(scope)),
 peek: (scope) => Promise.resolve(decision(scope)),
 reset: () => Promise.resolve(),
 };
}

/**
 * The identity a limit is counted against.
 *
 * User id when known, IP otherwise. Preferring the user id is deliberate: counting a signed-in
 * user by IP punishes everyone behind one office NAT, and lets one user evade the limit by
 * changing networks.
 */
export function rateLimitKey(input: { userId?: string | null; ip?: string | null }): string {
 if (input.userId) return `u:${input.userId}`;
 if (input.ip) return `ip:${input.ip}`;
 // No identity at all. One shared bucket is strictly better than no limit — it degrades to
 // a global cap rather than silently allowing everything.
 return 'anonymous';
}

/** Seconds to put in a `Retry-After` header. Always at least 1; never fractional. */
export function retryAfterSeconds(decision: RateLimitDecision, now: number): number {
 return Math.max(1, Math.ceil((decision.resetAt - now) / 1_000));
}
