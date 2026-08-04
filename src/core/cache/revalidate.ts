import 'server-only';

import { revalidateTag, updateTag } from 'next/cache';

import { CACHE_TAGS } from './tags';
import type { CacheProfileName } from './profiles';

/**
 * Cache invalidation (requirement 13).
 *
 * Next 16 has two invalidation verbs and they are not interchangeable. Choosing the wrong
 * one produces either a UI that shows the user stale data immediately after their own edit,
 * or a thundering herd of blocking revalidations. Both are subtle enough to survive review,
 * so the choice is made here, once, behind two named functions:
 *
 * | | `expire()` → `updateTag` | `markStale()` → `revalidateTag(tag, profile)` |
 * |---|---|---|
 * | Callable from | **Server Actions only** | Server Actions *and* Route Handlers |
 * | Next read | blocks for fresh data | serves stale, refreshes in background |
 * | Use for | the user's own writes | someone else's writes, webhooks, cron |
 *
 * The rule: **if the user who triggered this is about to look at the data, use `expire()`.**
 * Anything else — a webhook, a background job, another user's action — uses `markStale()`.
 *
 * The one-argument `revalidateTag(tag)` form is deprecated in Next 16; it still compiles if
 * TypeScript errors are suppressed and may be removed. Nothing here uses it.
 */

/**
 * Expire tags immediately — read-your-own-writes.
 *
 * **Server Actions only.** Next throws if this is reached from a Route Handler, which is the
 * correct behaviour and the reason it is not silently caught here.
 */
export function expire(tags: readonly string[]): void {
  for (const tag of tags) {
    updateTag(tag);
  }
}

/**
 * Mark tags stale — stale-while-revalidate.
 *
 * The profile defaults to `'max'`, which the docs recommend: the entry is marked stale and
 * refreshed in the background the next time a page carrying that tag is visited. Note the
 * consequence — nothing is fetched at the moment of the call, so this does not cause a burst
 * of regeneration on a high-fanout tag.
 *
 * Pass a `CacheProfileName` to override the staleness window for a specific invalidation.
 */
export function markStale(tags: readonly string[], profile: CacheProfileName | 'max' = 'max'): void {
  for (const tag of tags) {
    revalidateTag(tag, profile);
  }
}

/**
 * Expire everything derived from one user.
 *
 * The convenience wrapper for sign-out, plan change and account deletion — the three events
 * after which *no* cached projection of this user is trustworthy.
 */
export function expireUser(userId: string, extraTags: readonly string[] = []): void {
  expire([CACHE_TAGS.user(userId), ...extraTags]);
}
