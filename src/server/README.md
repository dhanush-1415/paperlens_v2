# `src/server` — the composition root

The one place in the codebase that names concrete implementations.

Everywhere else asks for an interface. Here, and only here, `AuthProvider` becomes
`InMemoryAuthProvider`, `Logger` becomes a JSON transport, `ErrorReporter` becomes the
logger-backed reporter. That is what "swap a provider by changing one line" means: this is the
line.

## Files

| File | Job |
|---|---|
| `bootstrap.ts` | Builds the container, registers every binding, exports typed accessors and `action()` |
| `actions/` | Cross-feature Server Actions — currently auth. Feature-specific actions live in that feature's `presentation/` |

## What `bootstrap.ts` exports

**Typed accessors** — `logger()`, `translator()`, `errorReporter()`, `httpClient()`, `flags()`.
Call sites use these instead of resolving from the container directly, so the container itself
is an implementation detail of this file.

**`action()`** — the Server Action wrapper. Every action in the app goes through it, which is
what makes "every action is logged, reported, rate-limited and returns `Result`" a property of
the codebase rather than a review habit:

```ts
export const doThing = action('feature.doThing', async (formData: FormData) => { … });
```

Note that `action()` resolves its dependencies **inside** the returned function, not alongside
it. Every call site is `export const x = action(…)` at module scope, which evaluates at import
time — before there is a request, and therefore before there is a request scope holding a
translator. Resolving per invocation is also what makes the locale the caller's rather than
whichever request happened to load the module first.

## Lifetimes

| Lifetime | For | Examples |
|---|---|---|
| `singleton` | Stateless or process-wide | logger, config, HTTP client, flags |
| `request` | Per-request state | translator, session, correlation id |
| `transient` | Fresh every resolve | rare |

Request scope is `React.cache()`, not `AsyncLocalStorage` plumbing — React already provides one
memo slot per request, which is exactly what request scope means.

## Registering something new

1. Define the port and its token in `core/<concern>/`.
2. `container.register(TOKEN, factory, lifetime)` here.
3. Export a typed accessor if call sites need it.
4. For a feature, call its `register<Feature>(container)` from `module.ts` instead — the feature
   owns its own bindings, this file just invokes them.

## Fakes and the boot warning

The shipped auth provider is `InMemoryAuthProvider`: plaintext password comparison, sessions
that die with the process. It logs at `fatal` when bound in a production build.

That log line is deliberate. A naming convention is a hope; a `fatal` at boot is a fact. See
[ADR 0007](../../docs/adr/0007-provider-agnostic-ports.md) for why no vendor SDK is wired yet
and what integrating one will actually involve — write an adapter, pass the port's existing
contract suite, change one line here.
