# `src/features` — feature-first modules

One folder per business capability. A feature owns its domain rules, its use cases, its data
access and its UI, top to bottom — which is what makes it possible for one team to own a folder
and change everything inside it without a cross-team conversation.

**Sibling features never import each other.** Not through a deep path, not through the public
API, not "just this once". Two features that need each other's data either share a lower layer
in `core/`/`shared/`, or one of them is actually part of the other.

## Anatomy

```
<feature>/
├── domain/           Entities, value objects, PORTS.        Imports NOTHING.
├── application/      Use cases + DTO mappers.               Imports domain (+ core).
├── infrastructure/   Repository + data source impls.        Imports domain + core.
├── presentation/     Components + Server Actions.           Imports application.
├── validation/       Feature-specific Zod schemas
├── constants.ts      Feature-local constants
├── module.ts         DI registration — the ONLY importer of infrastructure/
└── index.ts          Public API — the ONLY legal import path from outside
```

The two arrows into `domain/` are the point of the whole arrangement: `application/` **calls**
the port, `infrastructure/` **implements** it. So `domain/` depends on nothing and can be
reasoned about — and tested — without knowing that a database, a network or React exist.

## The layers, concretely

**`domain/`** — the rules that would be true if the product were a paper form. Entities, value
objects, and the ports describing what the feature needs from the outside world. No imports.
Not React, not Zod, not `core/`. If something here needs a dependency, it is not domain logic.

**`application/`** — use cases: one exported function per thing a user can do. Orchestrates
domain objects and ports, returns `Result`. Also owns `dto.ts`, the mapper that turns an entity
into the narrower shape UI is allowed to see. This is the taint boundary.

**`infrastructure/`** — the only place a database, an HTTP API or a vendor SDK is named.
Implements the ports `domain/` declared. Imported by `module.ts` and nothing else, so no call
site can bind itself to an adapter.

**`presentation/`** — components and `'use server'` actions. Actions are wrapped by `action()`
from `server/bootstrap`, which supplies the boundary: logging, reporting, `Result`, message-key
resolution. Components are Server Components unless they need interactivity.

## `index.ts` is a promise

Everything exported there is a contract with the rest of the app. Everything not exported can
be changed freely. That is the entire mechanism by which a feature becomes independently
ownable, and it only works if nobody imports past it — which the lint zones enforce.

Keep it deliberately small. A public API that re-exports everything is the same as no public
API.

An earlier version of `document-analysis/index.ts` omitted two types consumers needed. It was
caught by a test that imports the module the way an outside consumer would — worth copying.

## Reference implementation

`document-analysis/` exercises every rule in this architecture at least once: DAL-gated read,
validated mutation, port + fake adapter, DTO + taint, cache tags, a translated field error, and
a single client component. Read it before writing a new feature; the step-by-step is in
[FEATURE_TEMPLATE.md](../../docs/FEATURE_TEMPLATE.md).

## Adding a feature

1. `mkdir` the six folders. Do not skip `domain/` because "it's just CRUD" — CRUD is where the
   rules end up hidden inside a repository.
2. Write entities and ports first, then a contract suite for each port.
3. Use cases next; they are the only thing `presentation/` may call.
4. Adapter last. It is the most replaceable part and should be written knowing what it must satisfy.
5. Register in `module.ts`; call it from `server/bootstrap.ts`.
6. Export the minimum from `index.ts`.
