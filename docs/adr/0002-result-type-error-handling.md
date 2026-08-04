# 0002 — `Result<T, AppError>` in the data path, exceptions at the boundaries

**Status:** Accepted · **Owner:** `src/core/result`, `src/core/errors`

## Context

Failure is the normal case in this product: a document is too long, an upstream analyzer is
down, a session expired, an id belongs to somebody else. With plain exceptions, none of those
appear in a function's type — the caller finds out at runtime, or does not find out at all
because a `catch` two frames up swallowed it.

There is also a Next-specific hazard. `redirect()`, `notFound()`, `unauthorized()` and
`forbidden()` are implemented **by throwing**. A well-meaning `try/catch` around a Server
Action silently converts a redirect into a caught error, and the symptom is a form that
submits successfully and goes nowhere.

## Decision

Two regimes, with an explicit line between them.

**In the data path** — use cases, repositories, data sources — every fallible function returns
`Result<T, AppError>`. No throwing. The failure is in the signature, and the compiler will not
let a caller ignore it.

**At the boundaries** — Server Actions, route handlers, React components — exceptions are the
mechanism, because that is what React's error boundaries and Next's control flow are built on.
`withActionErrors()` and `withRouteErrors()` convert one regime to the other in exactly one
place each.

**Every `catch` starts with `unstable_rethrow(error)`.** Lint-enforced. That is what keeps a
`redirect()` inside a wrapped action working.

`AppError` carries `{ code, category, severity, httpStatus, messageKey, retryable,
correlationId }` and a `toClient()` that strips everything else. `ERROR_CODES` is a registry,
so an error code is a value with one definition rather than a string typed twice.

## Alternatives considered

**Exceptions everywhere.** Invisible to the type system, and every `catch` becomes a decision
about control flow it cannot see. Rejected on the `redirect()` hazard alone.

**`Result` everywhere, including components.** Would mean re-implementing error boundaries by
hand and giving up `error.tsx`, `notFound()` and `unauthorized()`. Fighting the framework at
its own boundaries.

**`neverthrow` / `fp-ts` / `effect`.** `neverthrow` is close to what is here and would have
been reasonable; it was rejected because `Result` is forty lines and a dependency at the
absolute centre of every call in the app is a permanent tax on upgrades. `fp-ts`/`effect` ask
the whole team to learn a second language to get the same guarantee.

**Go-style tuples `[error, value]`.** No exhaustiveness, no `map`/`andThen`, and destructuring
gives up the discriminated union that makes `if (!result.ok)` narrow correctly.

## Consequences

- A caller cannot forget to handle a failure; `result.value` does not exist until `result.ok`
  is checked.
- Every user-visible error has a `messageKey`, so error copy is translatable and lives in the
  dictionary, not in a `throw new Error('...')`.
- Every error has a `correlationId` that also appears in the log line, which is what turns
  "it broke yesterday" into a single `grep`.
- The cost is verbosity in the data path and two wrapper functions everyone must remember to
  use. The wrappers are the only place `try` appears in feature code, which is the point.
