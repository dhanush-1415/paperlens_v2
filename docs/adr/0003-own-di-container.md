# 0003 — A ~200-line typed container instead of InversifyJS or tsyringe

**Status:** Accepted · **Owner:** `src/core/container`

## Context

Every rule in [0001](0001-clean-architecture-feature-modules.md) depends on one thing being
true: a use case must receive its repository rather than import it. Something has to do that
wiring, and it has to work in three places React Server Components make awkward — module
scope, per-request scope, and the client, where a container cannot cross the serialization
boundary at all.

## Decision

A hand-written container built on **typed tokens**:

```ts
export const DOCUMENT_ANALYSIS_REPOSITORY = token<DocumentAnalysisRepository>('...');
container.register(DOCUMENT_ANALYSIS_REPOSITORY, () => createRepository(deps), 'singleton');
const repository = container.resolve(DOCUMENT_ANALYSIS_REPOSITORY); // typed, no cast
```

- Three lifetimes: `singleton`, `transient`, `request`.
- **Request scope comes from `React.cache()`**, not from an AsyncLocalStorage of our own — one
  request-scoped container per render, provided by React, free.
- `override()` exists for tests and is the mechanism behind the "swap the adapter, change no
  call sites" property.
- Registration happens in `features/<f>/module.ts`, called from `server/bootstrap.ts`. That
  file is the composition root and the only place implementations are named.

## Alternatives considered

**InversifyJS / tsyringe.** Both need `reflect-metadata` and `experimentalDecorators`, which
means a decorator transform in the build. SWC and Turbopack support it unevenly, the metadata
emit defeats tree-shaking, and decorated classes do not survive the RSC boundary. That is a
large amount of build risk for a feature — constructor injection by type — that a token map
provides with no build step at all.

**No container; pass dependencies down as arguments.** Honest, and what the use cases do
internally. It fails at the top: a page would have to construct a repository, which means
`app/` imports `infrastructure/`, which is precisely the rule the layering exists to enforce.

**Module-level singletons (`export const repo = createRepo()`).** Zero ceremony, and untestable
without module mocking — which is the thing every "just mock the module" test suite turns into.
Also evaluates at import time, so a missing env var becomes an inscrutable import crash.

**React Context for services.** Would force `'use client'` on the entire tree and is the wrong
lifetime: services are per-request on the server, not per-component.

## Consequences

- Resolution is typed end to end; a token *is* its type, so there is no `as` at a call site.
- Tests build a container, `override()` two tokens, and assert against real code paths.
- Swapping `InMemoryAuthProvider` for a real provider is one line in `bootstrap.ts`.
- The cost: no automatic constructor injection, so registrations are written by hand. For
  roughly thirty services that is a page of code, and it is the page that documents what the
  application is made of.
