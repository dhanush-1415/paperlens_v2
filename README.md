# PaperLens

Paste a contract, get back the clauses that will cost you — worst first.

This repository is, first and foremost, an **application architecture**. The product surface is
deliberately one vertical slice; what is built out is the foundation underneath it, where every
cross-cutting concern has exactly one owner and changing it there changes it everywhere.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sign in with `demo@paperlens.test` / `demo-password-1234` — the credentials are printed on the
login page in development. Data is in-memory and does not survive a restart, which is correct
for a foundation and obviously wrong for a product; see
[ADR 0007](docs/adr/0007-provider-agnostic-ports.md).

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run verify` | **typecheck + lint + test + build** — run before pushing |
| `npm run test` | Unit, contract and component tests |
| `npm run test:coverage` | With thresholds enforced |
| `npm run test:e2e` | Playwright, against the production build |
| `npm run lint` | ESLint, including the architectural boundary rules |

## Documentation

| | |
|---|---|
| [**ARCHITECTURE.md**](docs/ARCHITECTURE.md) | Folder structure, dependency graph, and every lifecycle as a diagram. **Start here.** |
| [CONVENTIONS.md](docs/CONVENTIONS.md) | Day-to-day rules: where code goes, state ownership, testing, naming |
| [FEATURE_TEMPLATE.md](docs/FEATURE_TEMPLATE.md) | Adding a feature, step by step |
| [adr/](docs/adr/README.md) | Twelve decisions, each with the alternatives it beat |

Every top-level folder under `src/` also has a `README.md` stating its purpose and its import
rules.

## The shape of it

```
app → features/*/index → presentation → application → domain ← infrastructure → core → config
```

- **`app/`** decides URLs. Nothing else.
- **`features/`** are independently ownable modules. Siblings never import each other.
- **`shared/`** is the design system, pure utilities and validation primitives.
- **`core/`** is the framework — DI, errors, logging, http, auth, cache, storage, security,
  analytics, flags, i18n. It never imports `features/`.
- **`config/`** is the only reader of `process.env`.
- **`server/bootstrap.ts`** is the only file that names a concrete implementation.

Those arrows are ESLint rules, not documentation. To watch one fire, import
`@/features/document-analysis/infrastructure` from a page and run `npm run lint`.

## What is real and what is a placeholder

Real: the DI container, error and logging pipelines, HTTP client, DAL and authorization, cache
vocabulary, storage, security headers and CSP, i18n, design tokens and theme, the boundary
rules, and the whole test apparatus.

Placeholder, and named so at every call site: `InMemoryAuthProvider`,
`FakeDocumentAnalysisDataSource`, `MemoryRateLimiter`, `LoggerErrorReporter`,
`StaticFlagProvider`. Each implements a port, each passes that port's contract suite, and each
is replaced by writing an adapter and changing one line in `server/bootstrap.ts`. The in-memory
auth provider logs at `fatal` if it is ever bound in a production build.

Nothing is stubbed while pretending to work.

## Stack

Next.js 16 (App Router, `cacheComponents`/PPR, Turbopack) · React 19 · TypeScript 5 ·
Tailwind CSS v4 · Zod 4 · Zustand 5 · Vitest + Testing Library · Playwright

## Notes

This project targets Next.js 16, which differs from earlier versions in ways that matter:
`proxy.ts` replaces `middleware.ts`, `export const dynamic` is a build error under
`cacheComponents`, `error.tsx` receives `unstable_retry` rather than `reset`, and `cookies()`,
`params` and `searchParams` are all async. See the end of
[CONVENTIONS.md](docs/CONVENTIONS.md#things-that-will-bite-you-next-16).
