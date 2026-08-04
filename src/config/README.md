# `src/config` — the only reader of `process.env`

Every environment variable in the product is read here, validated here, and typed here.
`process.env` anywhere else is an ESLint error.

That rule exists because of a specific failure. Env vars read at call sites are `string |
undefined`, which means the missing-variable case is discovered by whatever happens when
`undefined` reaches a string concatenation, a URL constructor, or a `parseInt` — usually at
runtime, on the one path nobody exercised locally, hours after deploy. Parsing them all at boot
turns that into a startup crash that names the variable.

## Files

| File | Job |
|---|---|
| `env.server.ts` | Server-side vars. Zod-parsed at import. Marked `server-only` |
| `env.client.ts` | `NEXT_PUBLIC_*` only. Safe to bundle, by construction |
| `app.config.ts` | Derived, typed settings. What the rest of the app actually reads |
| `runtime.ts` | Which runtime is executing — server / client / edge / build |
| `tenant.ts` | White-labeling: design-token and copy overrides per tenant |
| `index.ts` | Public surface |

## How it fails

`env.server.ts` calls `.parse()` at module scope. A missing or malformed variable throws during
import, which means the process does not start and the error names the variable and the
expectation. There is no degraded mode where the app runs with half its configuration.

`server-only` on that file makes importing it from a Client Component a **build** error rather
than a secret in a JS bundle. This is the single most valuable line in the folder.

## Two configs, on purpose

Not one file with a `isServer` branch. The split is what makes the safety mechanical: anything
in `env.client.ts` is public by definition, anything in `env.server.ts` cannot physically reach
the browser. A single file would put both behind a runtime check, and a runtime check that
guards a bundling decision is a check that has already lost.

## Adding a variable

1. Add it to the Zod schema in `env.server.ts` (or `env.client.ts` if it is `NEXT_PUBLIC_*`).
2. Give it a default if one is sensible; if not, leave it required so boot fails loudly.
3. Expose it through `app.config.ts` if the shape callers want differs from the raw string.
4. Add it to `.env.example` — the file is the contract for whoever deploys this.

Never read it at the call site. Never add a fallback at the call site. The fallback belongs in
the schema, where it is written once and visible to everyone.

## White-labeling

`tenant.ts` resolves a tenant and returns design-token and copy overrides. Because every design
value lives in one stylesheet ([ADR 0008](../../docs/adr/0008-design-tokens-single-source.md))
and every string lives in a dictionary, re-skinning the product for a tenant is a data change,
not a code change. `TenantConfig.tokenOverrides` is typed against the token contract — a tenant
may restyle the system, not invent new slots in it.
