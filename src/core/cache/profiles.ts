/**
 * Cache lifetime profiles — the single source of truth for how long anything is cached.
 *
 * These are registered into `next.config.ts` under `cacheLife`, which makes them
 * available by name to `cacheLife('<name>')` inside any `use cache` scope.
 *
 * Rules:
 * - `expire` must be strictly greater than `revalidate` (Next validates this).
 * - A profile with `revalidate: 0` or `expire < 5 minutes` is excluded from the
 * prerender and becomes a dynamic hole. That is intentional for `realtime`.
 * - Never inline a `cacheLife({...})` object in feature code. Add a named profile
 * here so cache behaviour is auditable in one file.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/cacheLife
 */

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;

export interface CacheProfile {
  /** How long the client router may serve this without asking the server. Min 30s enforced. */
  stale: number;
  /** After this, the next request triggers a background regeneration. */
  revalidate: number;
  /** After this with no traffic, the next request blocks on fresh content. */
  expire: number;
}

export const CACHE_PROFILES = {
  /**
   * Legal copy, terms, privacy, brand pages. Changes on deploy, not on data.
   */
  immutable: {
    stale: 1 * HOUR,
    revalidate: 30 * DAY,
    expire: 1 * YEAR,
  },

  /**
   * Landing, pricing, feature pages. Edited by humans, deployed occasionally.
   */
  marketing: {
    stale: 5 * MINUTE,
    revalidate: 1 * HOUR,
    expire: 1 * DAY,
  },

  /**
   * Blog posts, guides, `/for/[slug]` SEO pages. Daily editorial cadence.
   */
  editorial: {
    stale: 10 * MINUTE,
    revalidate: 6 * HOUR,
    expire: 3 * DAY,
  },

  /**
   * Slow-moving reference data: document taxonomies, plan limits, jurisdictions.
   */
  reference: {
    stale: 30 * MINUTE,
    revalidate: 1 * DAY,
    expire: 1 * WEEK,
  },

  /**
   * Per-user derived data safe to hold briefly (usage counters, entitlements).
   * Pair with `'use cache: private'` when the input is a runtime API.
   */
  session: {
    stale: 60 * SECOND,
    revalidate: 5 * MINUTE,
    expire: 30 * MINUTE,
  },

  /**
   * Deliberately excluded from the static shell. Renders at request time.
   * Wrap consumers in `<Suspense>` — this is a dynamic hole by design.
   */
  realtime: {
    stale: 30 * SECOND,
    revalidate: 1 * SECOND,
    expire: 1 * MINUTE,
  },
} as const satisfies Record<string, CacheProfile>;

export type CacheProfileName = keyof typeof CACHE_PROFILES;
