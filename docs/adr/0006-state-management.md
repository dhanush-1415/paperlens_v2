# 0006 — Zustand, for the state React Server Components leave behind

**Status:** Accepted · **Owner:** `src/shared/state` · **Referenced by:** `src/shared/state/create-store.ts`, `src/app/providers.tsx`

## Context

"Pick one state management solution and explain why" is the wrong first question in an RSC app.
The right first question is *what state is actually left*, because the App Router removes most
of the categories a client store used to hold:

| Kind of state | Where it belongs here | Not the store |
|---|---|---|
| Server data | DAL + `use cache` | The server *is* the cache |
| URL / filters / pagination | `searchParams` | Shareable, back-button-correct, free |
| Form state | `useActionState` + Server Actions | Progressive-enhancement, works without JS |
| Session | `verifySession()` per request | A client copy is a lie waiting to be stale |
| Ephemeral UI (one component) | `useState` | A store for a dropdown is architecture theatre |

What remains is genuinely client-owned, cross-component UI state: theme preference, command
palette, toasts, drawers, multi-step wizard progress, unsaved-draft buffers. It is a small
surface — and the tool should be sized to it, not to the surface a Redux app has.

## Decision

**Zustand**, behind a factory: `createStore()` in `shared/state`. No feature calls `create()`
from the library directly.

The factory owns the cross-cutting concerns so no slice has to:

- `devtools` in development only, with the store name attached.
- `persist` wired to our own `StorageDriver` port (see `core/storage`) — versioned, TTL-aware,
  and quota-safe — rather than reaching for `localStorage`, which is undefined on the server.
- `skipHydration` where the store is persisted, so the first client render matches the server
  HTML and hydration does not mismatch.
- A `reset()` on every slice, which is what makes sign-out actually clear client state.

Slices live in the feature that owns them and are exported through the feature's `index.ts`.

## Alternatives considered

**Redux Toolkit.** The strongest option if this were a client-rendered app with heavy shared
state and time-travel debugging needs. Here it costs a provider tree, actions/reducers/selectors
per slice, and a middleware stack to manage the state described above — which is a toast queue
and a theme string. Its main advantage, disciplined structure at scale, is provided in this
codebase by feature modules and the DI container instead.

**Jotai / Recoil.** Excellent for fine-grained derived state. Atoms have no natural module
boundary, so at 500 screens the failure mode is several hundred atoms with no owner — the exact
sprawl the feature-module rule exists to prevent.

**React Context.** Free, and re-renders every consumer on every change because it has no
selector. Also forces a `'use client'` boundary high in the tree, which pushes it *outward*
until much of the app is client-rendered. Used here for exactly one thing — theme — where the
value changes rarely and a provider is genuinely required.

**TanStack Query.** Solves server-state caching, which RSC already solved on the server. See
[0004](0004-framework-native-caching.md).

**No library — `useState` plus prop drilling.** Fine until the command palette needs to open a
drawer from a keyboard shortcut registered three layers up.

## Consequences

- Zustand needs no provider, so a store can be read from any client component without pushing
  a `'use client'` boundary upward.
- Selectors are explicit (`useStore(s => s.isOpen)`), so a store change re-renders subscribers
  to that slice and nothing else.
- Testing a slice is calling functions — no provider, no renderer, no act().
- The cost: it is easy to reach for a store when `useState` or `searchParams` is correct.
  The table above is the rule, and it is repeated in `docs/CONVENTIONS.md` because this is the
  decision that decays fastest without one.
