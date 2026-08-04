# 0004 — Next's own cache is the only cache

**Status:** Accepted · **Owner:** `src/core/cache` · **Config:** `cacheComponents: true`

## Context

The requirement asks for a centralized cache manager. On a framework that already owns a
request cache, a data cache, a full-route cache and a router cache, a second cache manager is
not centralization — it is a fifth cache that disagrees with the other four.

## Decision

`cacheComponents: true`, and `core/cache` owns the *vocabulary* rather than the storage:

- **`profiles.ts`** — named `cacheLife` profiles (`static`, `session`, `document`, …). A
  duration is a named policy, never a number at a call site.
- **`tags.ts`** — typed tag builders. `documentTag(id)` instead of `` `document:${id}` ``
  written in four files with one typo.
- **`revalidate.ts`** — two verbs, deliberately distinct:
  - `expire(tag)` → `revalidateTag(tag, profile)`, stale-while-revalidate. For "somebody
    else's change should land soon".
  - `update(tag)` → `updateTag(tag)`, read-your-writes, Server Actions only. For "the user did
    this and must see it on the very next render".

Under `cacheComponents`, `export const dynamic` is a build error and any request API
(`cookies()`, `searchParams`) must sit inside a `<Suspense>` boundary. That is the mechanism
behind partial prerendering: **the dynamic part of a page is exactly as large as its Suspense
boundary**, so boundary placement is an architectural decision, not a loading-spinner one.

## Alternatives considered

**A bespoke `CacheManager` service with its own store.** Two sources of truth for freshness,
two invalidation paths, and the framework's cache silently serving the stale copy of whatever
ours just invalidated.

**TanStack Query.** Excellent, and aimed at a problem RSC removes: client-side server-state
caching. Here the server component *is* the query, and the cache is the framework's. Adding it
would put a second copy of every document in the client bundle.

**Redis / an external cache from day one.** Real infrastructure for a load nobody has measured.
When it is needed it belongs *behind* `revalidate.ts` as a cache handler, which is exactly why
those two verbs are functions rather than direct calls to Next's API.

**`export const revalidate` per route.** Per-route numbers scattered across 500 files, with no
way to answer "how long do we cache a document?" without grepping.

## Consequences

- One cache, one invalidation path, one place to change a duration.
- Cache tags are typed, so a rename is a compile error rather than a silently dead tag.
- PPR is available — but it is why the CSP is `compatible` rather than nonce-based; see
  [0009](0009-csp-strategy.md).
- The cost is a stricter dialect of Next: `dynamic` is banned, Suspense boundaries are
  mandatory around request data, and both are build errors rather than review comments.
