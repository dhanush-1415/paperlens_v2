# `src/app` — routing only

This folder decides **what lives at which URL**. Nothing else.

A page reads its params, calls a use case through a feature's public API, and renders. If a
file here contains a business rule, a `fetch`, a SQL-shaped string, or an `if` about domain
state, it belongs one layer down.

The reason is ownership, not purity. Route files are the most-edited files in any app and the
least reviewed — everyone touches them, nobody owns them. Logic that lands here gets copied to
the next route that needs it, and then the two copies drift.

## May import

| | |
|---|---|
| ✅ | `@/features/<name>` — the public `index.ts`, nothing deeper |
| ✅ | `@/shared/ui`, `@/shared/constants` |
| ✅ | `@/server/bootstrap` — for `action()` and typed accessors |
| ❌ | `@/features/<name>/{domain,application,infrastructure,presentation}` |
| ❌ | Any concrete adapter |
| ❌ | `process.env` |

Enforced by `no-restricted-imports` in `eslint.config.mjs`.

## Layout

```
(marketing)/       Public pages
(app)/             Authenticated shell — /scan, /document/[id]
(auth)/            /login
api/health/        The one route handler
```

Route groups carry no URL segment. They exist so each area gets its own `layout.tsx` — which is
where an auth shell differs from a marketing shell.

## Files that are not pages

| File | Job |
|---|---|
| `layout.tsx` | Root document. Fonts, the theme bootstrap script, `<Providers>` |
| `providers.tsx` | The single client-provider tree. New global provider goes here or nowhere |
| `globals.css` | Tailwind import + `@theme` mapping |
| `tokens.css` | **Every design value in the product**, declared once → [ADR 0008](../../docs/adr/0008-design-tokens-single-source.md) |
| `error.tsx` | Segment error boundary. Next 16 passes `unstable_retry`, not `reset` |
| `global-error.tsx` | Root boundary — replaces `<html>`, so it re-declares the theme itself |
| `not-found.tsx` | Also what an unowned resource renders. 404, never 403 |
| `unauthorized.tsx` / `forbidden.tsx` | Thrown by `requireSession()` / `requirePermission()` |
| `loading.tsx` | Suspense fallback for the shell |

## Rules specific to this folder

- **Server Components by default.** `'use client'` belongs on the smallest component that needs
  interactivity, never on a page.
- **`export const dynamic` is a hard build error** under `cacheComponents: true`. Control
  caching with `use cache` and `cacheLife` in the data layer instead.
- `params` and `searchParams` are **Promises**. Await them.
- Every `<Link href>` is type-checked (`typedRoutes`). Route strings come from
  `@/shared/constants/routes`, so a renamed route is a compile error rather than a 404.
