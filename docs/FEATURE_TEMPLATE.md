# Feature module template

Every feature is a vertical slice under `src/features/<name>/`. It owns its domain, its data
access, its UI and its wiring, and it exposes exactly one import path to everything else.

`src/features/document-analysis/` is the reference implementation. Read it alongside this
document — every rule below is demonstrated there, in code, with the reasoning written next to
the line it applies to.

---

## Directory shape

```
src/features/<name>/
├── domain/                 # entities, value objects, PORTS. The dependency sink.
│   ├── <entity>.ts
│   ├── <rules>.ts          # pure business rules — scoring, state machines, invariants
│   ├── ports.ts            # the interfaces the outside world must satisfy
│   └── index.ts
├── application/            # use cases + DTO mappers. Imports domain only.
│   ├── <use-case>.ts       # create<UseCase>(deps) → a callable
│   ├── dto.ts              # the only shapes allowed to cross to a client
│   └── index.ts
├── infrastructure/         # port implementations. Imported ONLY by module.ts.
│   ├── <adapter>.ts
│   ├── <data-source>.ts    # 'use cache' lives here, not in the repository
│   └── index.ts
├── presentation/           # components, server actions. Imports application.
│   ├── actions.ts          # 'use server'
│   ├── <component>.tsx
│   └── index.ts
├── validation/             # zod schemas for this feature's inputs
├── constants.ts            # labels, scopes, values only this feature has an opinion about
├── tokens.ts               # DI tokens for this feature's abstractions
├── module.ts               # register<Name>(container) — the wiring API
└── index.ts                # the public API
```

Not every feature needs every folder. A feature with no mutations has no `actions.ts`; a
feature that only renders shared data has no `infrastructure/`. What it may **not** do is add a
layer, or skip one that it does need.

---

## The dependency rule

```
app/ ──▶ features/<name> (index.ts only)
             │
             ├─▶ presentation/ ──▶ application/ ──▶ domain/ ◀── infrastructure/
             │                                        ▲              │
             └─▶ module.ts ───────────────────────────┘──────────────┘
                                                              ▼
                                            shared/ ──▶ core/ ──▶ (nothing)
```

Read the arrows as "may import". Four consequences worth stating plainly:

1. **`domain/` imports nothing** except its own files, `zod`, and the pure error kernel
   (`@/core/result`, `@/core/errors`). It has no framework, no HTTP, no React. That is what
   makes the business rules testable in milliseconds without a render or a server.
2. **`application/` never names a concrete adapter.** It declares what it needs as a `deps`
   parameter typed by a port. The adapter arrives at runtime from `module.ts`.
3. **`infrastructure/` has exactly one importer** — `module.ts`. If a second file imports it,
   the abstraction has been bypassed and the swap this whole arrangement exists to permit no
   longer works.
4. **Sibling features are invisible to each other.** `features/a` may not import `features/b`
   under any circumstance. If two features need the same thing, it moves to `shared/` or
   `core/` and gets an owner.

All four are enforced by `no-restricted-imports` zones in `eslint.config.mjs`, not by review.

---

## Building one, in order

### 1. `domain/` — say what the thing *is*

Entities as `readonly` interfaces. Unions as `as const` arrays with a derived type, so
exhaustiveness is checkable:

```ts
export const DOCUMENT_TYPES = ['rental_agreement', 'employment_contract', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
```

Business rules as pure functions in their own file — `scoreOf(flags)`, not
`analysis.calculateScore()`. A pure function is testable without constructing anything and
cannot be accidentally coupled to a persistence shape.

Identity belongs to whoever stores it. Model the pre-save shape separately:

```ts
export interface AnalysisDraft { /* … no id … */ }
export interface DocumentAnalysis extends AnalysisDraft { readonly id: string }
```

### 2. `domain/ports.ts` — say what you need from the world

One port per reason-to-change. `DocumentAnalyzer` (compute) and `DocumentAnalysisRepository`
(storage) are separate because they fail differently and will change at different times.

Every method returns `Promise<Result<T, AppError>>`. Ports never throw: a port is a boundary
with the outside world, and every outside world fails.

Every read takes the owner:

```ts
findById(id: string, ownerId: string): Promise<Result<T | null, AppError>>;
```

That parameter is the authorization boundary expressed in the type system — an implementation
physically cannot return another user's row without being handed their id.

"Not found" is `ok(null)`, not `err(...)`. Absence is an answer; only a broken query is an error.

### 3. `application/` — say what the thing *does*

A use case is a factory over its dependencies:

```ts
export interface AnalyzeDocumentDeps { analyzer: DocumentAnalyzer; repository: …; now: Clock }
export type AnalyzeDocument = (input: AnalyzeDocumentInput) => Promise<Result<DocumentAnalysis, AppError>>;
export function createAnalyzeDocument(deps: AnalyzeDocumentDeps): AnalyzeDocument { … }
```

A test constructs it with three fakes and calls it. No container, no request, no mocking
framework.

What does **not** go in a use case: authentication, rate limiting, analytics, cache
invalidation, redirects, HTTP status codes. Those are properties of *being called over HTTP by
a browser*, not of the operation. A queue worker running the same use case should do none of
them — which is the test to apply when unsure.

### 4. `application/dto.ts` — say what may leave

A DTO is an allowlist, and the mapper is where the question "should the client see this?" gets
asked. A new field on the entity does not reach the browser until someone writes the line that
puts it there.

Omit `ownerId`. Omit anything no component renders *today* — adding it back later is one line,
and shipping it now is a payload nobody reviews.

### 5. `infrastructure/` — satisfy the ports

Adapters map between the storage shape (snake_case rows, nullable columns) and the domain
shape. The mapper is the seam: keeping the row type deliberately unlike the entity type is what
stops a schema change from propagating into the domain.

Caching happens **at the data source, on the row** — never on a `Result`:

```ts
async function selectById(id: string, ownerId: string) {
  'use cache';
  cacheTag(...documentTags(id, ownerId));
  cacheLife('session');
  …
}
```

`use cache` serialises its return value, and a `Result` wraps an `AppError` class instance and a
tainted object — neither can be cached. Passing `ownerId` as an argument rather than reading it
from cookies inside also puts the owner in the cache key, which makes cross-user leakage
structurally impossible rather than merely unlikely.

Derived values are recomputed from source data on the way out, never read back from a
denormalised column. A weighting change then applies retroactively, and two adapters cannot
disagree about the same document.

Every adapter file starts with `import 'server-only'`.

### 6. `tokens.ts` — name the abstractions

```ts
export const ANALYZE_DOCUMENT = token<AnalyzeDocument>('feature.documentAnalysis.analyzeDocument');
```

Core services are declared in `core/container/tokens.ts`; feature tokens live with the feature,
because `core/` cannot import a feature's types. The rule is one owner per abstraction, and
`token()` mints a unique symbol so two features cannot collide even with identical strings.

Tokens are for the things a *caller* needs — the use cases. Adapters are constructed inline in
`module.ts` and get no token: a token is a way to ask for something, and nothing outside the
wiring should be asking for a data source.

### 7. `module.ts` — wire it

```ts
import 'server-only';

export function registerDocumentAnalysis(container: Container): void {
  container.register(DOCUMENT_ANALYZER, () => createHeuristicAnalyzer(), 'singleton');
  container.register(ANALYZE_DOCUMENT, (c) => createAnalyzeDocument({
    analyzer: c.resolve(DOCUMENT_ANALYZER),
    repository: c.resolve(DOCUMENT_ANALYSIS_REPOSITORY),
    now: c.resolve(CLOCK),
  }), 'singleton');
}
```

This is the only file that may import `infrastructure/`, and it must **not** import
`presentation/` — see the cycle warning below.

`server/bootstrap.ts` calls it, and that is the whole integration: one import, one line.

### 8. `presentation/` — the request-shaped edge

Server Actions are where the transport concerns live, in a fixed order:

1. `checkPermissionResult(...)` — authorization. **Always**, even when the proxy already
   redirected. A Server Action is a POST endpoint with a public id, reachable with `curl` and
   no page load; the proxy is a redirect for humans, not a security boundary.
2. Rate limit — after auth, before the expensive parse.
3. `parseFormData(schema, formData)` — server-side and authoritative.
4. Analytics for intent.
5. Resolve the use case from the container and call it once.
6. `expire(tags)` — invalidate what the write changed.
7. `redirect(...)` — outside any `try`, because `redirect` throws a control-flow signal.

Actions throw `AppError`s; the `action()` wrapper catches, logs, reports and serialises.
Returning an `err` from inside would produce `ok(err(…))` and skip the logging.

Client Components are the exception, not the default. Draw the boundary around the thing that
genuinely needs a browser — a pending state, a live counter, one analytics call — and pass
everything else in as props from a Server Component. A `'use client'` module must deep-import
types (`../application/dto`), never a barrel, or the barrel's runtime exports follow it into
the bundle.

### 9. `index.ts` — publish the surface

Export types, components, DTO mappers and tokens. Do **not** export repositories, data sources,
adapters or entities-for-rendering.

**Two entry points, and the reason matters:**

| File | Imported by | Contains |
| --- | --- | --- |
| `index.ts` | routes, other features | types, components, mappers, tokens |
| `module.ts` | `server/bootstrap.ts` only | `register<Name>(container)` |

`presentation/actions.ts` imports `@/server/bootstrap` for `action()`. If the composition root
imported the feature *barrel* to get its registration function, the graph would be
`bootstrap → index → actions → bootstrap` — and `action()` runs at module scope, so the cycle
would be evaluated during boot and surface as a `TypeError` on an undefined import from a stack
trace naming none of the files responsible. `module.ts` never imports `presentation/`, so that
edge does not close the loop. An ESLint rule on `src/server/**` permits `@/features/*/module`
and nothing else.

---

## Checklist before opening the pull request

- [ ] `domain/` imports nothing but its own files, zod, and `@/core/result` + `@/core/errors`.
- [ ] Every port method returns `Result`. None throw.
- [ ] Every repository read takes `ownerId`.
- [ ] `infrastructure/` is imported by `module.ts` and nothing else.
- [ ] Adapters start with `import 'server-only'`.
- [ ] `use cache` is on a data source function returning a plain serialisable row.
- [ ] Every cached read calls `cacheTag` with tags from `core/cache/tags.ts`, and every write
      invalidates the same tags.
- [ ] Entities are tainted; the DTO mapper is the only path to a client.
- [ ] The Server Action re-checks permission, independent of the proxy.
- [ ] The use case contains no auth, no analytics, no cache calls, no redirects.
- [ ] `index.ts` exports no adapter, and `module.ts` imports no `presentation/`.
- [ ] The feature is registered in `buildServerContainer` via `@/features/<name>/module`.
- [ ] `npx tsc --noEmit` and `npx eslint src --max-warnings=0` are clean.
