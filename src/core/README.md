# `src/core` — the framework

This is the part of the codebase that would still make sense if the product were something
else entirely. It knows about logging, caching, HTTP, authentication and errors. It knows
nothing about documents, risk flags, or PaperLens.

That direction is absolute: **`core/` never imports `features/`.** A framework that knows its
users is not a framework — it is a second copy of the application with worse boundaries.

## Modules

| Module | Owns |
|---|---|
| `result/` | `Result<T, E>` — `ok`, `err`, `map`, `andThen`, `unwrapOr` |
| `errors/` | `AppError`, the `ERROR_CODES` registry, `normalizeError`, boundary wrappers |
| `container/` | Typed-token DI: `register` / `resolve` / `override`, three lifetimes |
| `logging/` | `Logger` port, transports, redaction, request-scoped context |
| `http/` | `HttpClient` — interceptors, timeout, bounded retry, Zod parsing |
| `auth/` | `AuthProvider` + `SessionStore` ports, the DAL, RBAC policy |
| `cache/` | `cacheLife` profiles, typed tag builders, revalidation helpers |
| `storage/` | `StorageDriver` port — local / session / memory / cookie |
| `network/` | Connectivity status port and offline policy |
| `security/` | CSP, security headers, sanitization, rate-limit port |
| `analytics/` | `AnalyticsProvider` port + typed event registry + consent |
| `monitoring/` | `ErrorReporter` port — crash reporting |
| `flags/` | `FlagProvider` port + the `FLAGS` registry |
| `i18n/` | Dictionary port, typed `t()`, plurals via `Intl.PluralRules`, locales |
| `time/` | `Clock` port — so "now" is injectable and tests are deterministic |

## The shape every module has

```
<module>/
├── types.ts      The PORT — an interface named for what the app needs
├── <impl>.ts     One or more adapters
├── index.ts      Public surface
└── *.test.ts     Unit tests
```

A port is named for the need, never for a vendor: `AuthProvider`, not `SupabaseClient`. A port
shaped like one vendor is that vendor with extra steps.

Every port has a **contract suite** in `src/test/contracts/` — one set of assertions run
against every adapter of that port. A new adapter is correct when it passes the suite the
existing one passes. That is what makes "swappable" a fact rather than a claim.

## May import

| | |
|---|---|
| ✅ | `@/config` |
| ✅ | `@/shared/constants`, `@/shared/utils` — pure, no cycle |
| ✅ | Other `core/` modules |
| ❌ | `@/features/**` — ever |
| ❌ | `@/app/**` |

## Adding a module

1. Define the port in `types.ts`, in the application's vocabulary.
2. Write a contract suite in `src/test/contracts/` **before** the first adapter.
3. Write at least one adapter and one fake. Name the fake `Fake*` or `InMemory*`.
4. Add a DI token and register it in `server/bootstrap.ts`.
5. Export from `index.ts`.

Step 2 first, not last. A contract suite written after an adapter describes that adapter; one
written before describes the port.

## Time and randomness

`Clock` is a port for the same reason everything else is: a test that calls `Date.now()`
directly is a test that fails at midnight in a different timezone. `systemClock` in production,
a fixed clock in tests.
