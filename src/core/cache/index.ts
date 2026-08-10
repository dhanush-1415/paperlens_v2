/**
 * Cache — public API (requirement 13).
 *
 * There is deliberately **no cache manager class here**. Next 16 with `cacheComponents: true`
 * already owns caching: `'use cache'` marks a boundary, `cacheLife` sets its lifetime,
 * `cacheTag` labels it, and `updateTag`/`revalidateTag` invalidate it. A bespoke manager
 * would sit beside that machinery and immediately disagree with it — two caches, two
 * invalidation paths, one of which is always wrong.
 *
 * What this module owns instead is the *vocabulary*: the named lifetime profiles and the
 * typed tag builders, so that lifetime and invalidation are auditable in two files rather
 * than scattered across every data source.
 *
 * `./revalidate` is NOT re-exported — it is `server-only` and its two functions have
 * different legal call sites (Server Action vs. Route Handler). Importing it by path keeps
 * that choice visible at the call site.
 */

export { CACHE_PROFILES, type CacheProfile, type CacheProfileName } from './profiles';

export {
 CACHE_TAGS,
 documentTags,
 usageTags,
 vaultTags,
 type CacheTagBuilders,
} from './tags';
