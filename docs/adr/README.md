# Architecture Decision Records

One file per decision that would be expensive to reverse. Each records the alternatives that
were actually considered and the reason the chosen one won — because in two years the code
will say *what* we did and nobody will remember *why*, and the cost of not knowing is that
somebody "simplifies" a constraint back out.

An ADR is immutable once accepted. A decision that changes gets a new record that supersedes
the old one; the old file stays, marked `Superseded by NNNN`. Editing history to look
consistent is how a team loses the ability to learn from it.

| # | Decision | Status |
|---|---|---|
| [0001](0001-clean-architecture-feature-modules.md) | Clean Architecture + feature-first modules, enforced by lint | Accepted |
| [0002](0002-result-type-error-handling.md) | `Result<T, AppError>` in the data path, exceptions at boundaries | Accepted |
| [0003](0003-own-di-container.md) | A ~200-line typed container instead of InversifyJS/tsyringe | Accepted |
| [0004](0004-framework-native-caching.md) | Next's own cache (`cacheComponents`) as the only cache | Accepted |
| [0005](0005-dal-and-repository.md) | DAL + DTO + repository ports for every data read | Accepted |
| [0006](0006-state-management.md) | Zustand for the client state RSC leaves behind | Accepted |
| [0007](0007-provider-agnostic-ports.md) | Ports + fakes now; no vendor SDK anywhere yet | Accepted |
| [0008](0008-design-tokens-single-source.md) | `tokens.css` owns every design value | Accepted |
| [0009](0009-csp-strategy.md) | `compatible` CSP, so the static shell survives | Accepted |
| [0010](0010-react-compiler.md) | React Compiler off, one flag away | Accepted |
| [0011](0011-theme-ownership.md) | Our own `ThemeProvider`, not `next-themes` | Accepted |
| [0012](0012-no-realtime-transports.md) | Request/response only — no WebSockets or SSE | Accepted |

## Format

Context → Decision → Alternatives considered → Consequences. Short. An ADR nobody reads
because it is nine pages long is the same as no ADR.
