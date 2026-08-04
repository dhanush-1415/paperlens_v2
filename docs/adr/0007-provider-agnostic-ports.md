# 0007 — Ports and fakes now; no vendor SDK anywhere yet

**Status:** Accepted

## Context

The product will need a backend — most likely Supabase — for auth, storage and persistence.
It does not have one yet. The tempting move is to install the SDK now and wire the real thing
as we go, on the reasoning that we will need it anyway and adapting later is wasted work.

That reasoning is how a vendor stops being a dependency and becomes the architecture. An SDK
imported directly by a repository is imported by every repository within a month. Its client
type appears in function signatures, its error shape leaks into `catch` blocks, its query
builder shows up in a Server Component because it was convenient once. At that point the
vendor is not replaceable, and — more immediately — it is not *testable*: every unit test
needs either a network or a mock of a surface nobody fully understands.

There is also a schedule reason. Wiring a real provider means schema design, migrations, RLS
policies and environment secrets. None of that is architecture, and all of it would block the
architecture from being finished and verified.

## Decision

Every external capability is a **port** — a TypeScript interface owned by the layer that
needs it, named for what the application wants rather than for what a vendor provides:

| Port | Owner | Shipped adapter |
|---|---|---|
| `AuthProvider` | `core/auth` | `InMemoryAuthProvider` |
| `SessionStore` | `core/auth` | `CookieSessionStore` (real) |
| `StorageDriver` | `core/storage` | `local` / `session` / `memory` / `cookie` (real) |
| `ErrorReporter` | `core/monitoring` | `LoggerErrorReporter` |
| `AnalyticsProvider` | `core/analytics` | console / noop |
| `FlagProvider` | `core/flags` | `StaticFlagProvider` |
| `RateLimiter` | `core/security` | `MemoryRateLimiter` |
| `NetworkMonitor` | `core/network` | `NoopNetworkMonitor` (server) / browser monitor |
| `Dictionary` | `core/i18n` | English, statically imported |
| `Clock` | `core/time` | `systemClock` |
| `DocumentAnalysisRepository` | `features/document-analysis/domain` | `FakeDocumentAnalysisDataSource` |

Everything is bound in one composition root, `server/bootstrap.ts`. No file outside that root
and a feature's own `module.ts` names a concrete adapter.

Fakes are named `Fake*` or `InMemory*` — never `Default*` or `Simple*`. A name is the only
warning a future reader gets at the call site, and `DefaultAuthProvider` reads like something
you may ship. `InMemoryAuthProvider` logs `fatal` at boot when bound in production, because a
naming convention is a hope and a log line is a fact.

## Alternatives considered

**Install the Supabase SDK now, adapt later.** Rejected: "later" never has a scheduled date,
and by the time it arrives the SDK is load-bearing in fifty files. The migration cost grows
super-linearly with how long you defer it, which is the opposite of what deferring assumes.

**Ports, but with the vendor's shape.** Defining `AuthProvider` to mirror Supabase's API —
`signInWithPassword`, `getSession` — makes the eventual adapter trivial and every other
adapter impossible. A port shaped like one vendor is that vendor with extra steps. Ours is
shaped like the use cases: `authenticate`, `findByEmail`, `revoke`.

**No abstraction; call the SDK and rely on integration tests.** This is a real position and
it is defensible for a product that will never change vendor. It was rejected here because
the requirement was explicitly a foundation where every dependency is replaceable, and
because it makes the entire test suite need a network.

**Generate adapters from an OpenAPI/Postgres schema.** Premature — there is no schema. It
also inverts ownership: the database would define the domain instead of the domain defining
what it needs from storage.

## Consequences

- The whole suite runs with no network, no containers and no secrets. 347 tests in ~5s.
- Every port has a **contract suite** in `src/test/contracts/` — one set of assertions run
  against every adapter of that port. This is what makes swappability a fact rather than a
  claim: a new adapter is correct when it passes the suite the fake already passes.
- Integrating Supabase later means writing `SupabaseAuthProvider`, passing the contract
  suite, and changing one line in `server/bootstrap.ts`. No call site changes. That claim is
  verified by the DI swap test, not asserted.
- **Cost, stated honestly:** an interface and an adapter for something with one implementation
  is more code than calling the thing directly. The bet is that the second implementation
  always arrives — as a test double if nothing else — and that it arrives sooner than the
  refactor would have been affordable.
- Data does not survive a restart. That is correct for a foundation and obviously wrong for a
  product, which is what the `fatal` boot log exists to say.

Related: [0005](0005-dal-and-repository.md) (repositories are ports), [0003](0003-own-di-container.md)
(how they are bound), [0012](0012-no-realtime-transports.md) (a constraint the ports encode).
