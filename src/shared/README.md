# `src/shared` — cross-feature building blocks

Everything more than one feature needs and no single feature owns: the design system,
pure utilities, constants, validation primitives, and the client-store factory.

The distinction from `core/`: `core/` owns **capabilities** (logging, caching, auth) behind
ports with adapters. `shared/` owns **material** — a button, a date formatter, a route
constant. Nothing here has a lifecycle or a dependency to inject.

## Folders

| Folder | Owns | Rule |
|---|---|---|
| `ui/` | The design system | See its own README |
| `constants/` | routes, storage keys, query params, HTTP, limits, regex | A literal used twice belongs here |
| `validation/` | Zod primitives + `parse` helpers returning `Result` | Messages are keys, never sentences |
| `utils/` | Pure functions | **No I/O, no framework, no state** |
| `state/` | `createStore()` — the Zustand factory | Every store is built by it |

## May import

| | |
|---|---|
| ✅ | `@/core/**` |
| ✅ | Other `shared/` modules |
| ❌ | `@/features/**` — this is what "shared" means |
| ❌ | `@/app/**` |

## `utils/` means pure

A function here takes values and returns values. No `fetch`, no `localStorage`, no `Date.now()`
(use the `Clock` port), no React. The test is whether it can be called from a Node script, a
Server Component and a browser event handler and behave identically in all three.

Anything that fails that test is a capability and belongs in `core/`.

`interpolate` and `encodeMessageRef` live here rather than in `core/i18n` for exactly this
reason: they are string operations, and **both sides of the RSC boundary need them**. A Client
Component handed a message template as a prop interpolates in the browser; the translator
interpolates on the server. Templates cross that boundary — the functions that would otherwise
format them cannot.

## `constants/` and the two-use rule

A string literal used in one place is fine where it is. The moment it appears twice, it is a
fact about the system and belongs here — because the second copy is where drift starts.

`routes.ts` in particular is why a renamed route is a compile error rather than a 404: nothing
in the app writes a URL as a literal.

## `state/` — read this before adding a store

Most things that look like client state are not. Check the table in
[CONVENTIONS.md](../../docs/CONVENTIONS.md#state-where-does-it-go) first. Server data belongs
to the DAL, URL state to `searchParams`, form state to `useActionState`, session to
`verifySession()`.

What remains — toasts, drawers, theme preference, unsaved drafts — is what `createStore()` is
for. It owns devtools, persistence through the injected `StorageDriver` (never raw
`localStorage`), `skipHydration`, and `reset()`. [ADR 0006](../../docs/adr/0006-state-management.md).
