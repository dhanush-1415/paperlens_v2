# 0001 — Clean Architecture and feature-first modules, enforced by lint

**Status:** Accepted · **Date:** 2026-08 · **Applies to:** every directory under `src/`

## Context

The target is 500+ screens owned by several teams. The failure mode at that size is not bad
code — it is *reachability*: any module can import any other, so after two years every change
touches everything and nobody can reason about the blast radius of an edit.

Two axes have to be decided:

1. **Layering.** What may depend on what.
2. **Grouping.** Whether files are grouped by technical kind (`components/`, `hooks/`,
   `services/`) or by feature.

## Decision

**Layering** — a strict dependency direction, one way only:

```
app → features/<f>/index → presentation → application → domain ← infrastructure → core/shared
```

- `domain/` imports **nothing**. Not React, not zod, not `core/`. It is entities, value
  objects and ports.
- `application/` imports `domain/` only. Use cases, expressed against ports.
- `infrastructure/` implements `domain/`'s ports using `core/`. Nothing imports it except
  that feature's `module.ts`.
- `presentation/` imports `application/`. It never reaches past it.
- `app/` imports `features/<f>` — the feature's `index.ts` and no deeper path.

**Grouping** — feature-first. A feature is a vertical slice containing all five layers.
Sibling features **never** import each other.

**Enforcement** — ESLint `no-restricted-imports` zones in `eslint.config.mjs`, not a
convention in a document. The rule fires at edit time, in the editor, on the line that broke
it.

## Alternatives considered

**Technical-kind grouping** (`src/components`, `src/hooks`, `src/services`). Every feature is
smeared across six top-level folders, so "delete this feature" is an archaeology exercise and
two teams touch the same four directories all day. It reads well at 20 files and fails at 500.

**Layering by convention only.** Tried everywhere, works nowhere. Import rules that are not
mechanically enforced decay at exactly the rate the team grows.

**Full hexagonal architecture with a mapper at every boundary.** More ceremony than a
product of this size can pay for. What is kept is the part that earns its cost — ports at the
edges, and a DTO at the client boundary because it is also a *security* boundary.

**Nx / Turborepo package boundaries.** A real answer to the same problem, and the natural
next step when teams need independent release cadences. It buys nothing today that lint zones
do not, and costs a build-graph tool to maintain. Revisit when a second app appears.

## Consequences

- Deleting a feature is deleting a directory and one line in `server/bootstrap.ts`.
- A team owns a directory, so ownership is expressible in `CODEOWNERS`.
- `domain/` is testable with no mocks and no environment — it imports nothing to mock.
- Cross-feature reuse must go *down* into `shared/` or `core/`, never sideways. That is a
  deliberate cost: it makes coupling visible as a move rather than silent as an import.
- The cost is one more file (`index.ts`) per feature and the occasional argument about which
  layer something belongs to. Both are cheap compared to the alternative.
