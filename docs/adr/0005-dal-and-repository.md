# 0005 — A Data Access Layer with DTOs, on top of repository ports

**Status:** Accepted · **Owner:** `src/core/auth/dal.ts`, `features/*/infrastructure`

## Context

In the App Router, a Server Component can query a database directly. Nothing stops it, and the
result serializes straight into the client payload. That makes two mistakes easy and invisible:

1. **Over-fetching into the client.** Return the row, and `passwordHash`, `internalNotes` and
   `stripeCustomerId` cross the network — even if the JSX never renders them.
2. **Authorization by omission.** A page checks the session; a Server Action on that page does
   not, because "the page already checked". Server Actions are directly POST-reachable.

A repository alone does not fix either. A repository that returns database rows is just a
prettier way to leak them.

## Decision

Three things, together:

**A DAL that owns session verification.** `verifySession()` is the *only* place a session is
proven, it is wrapped in `React.cache()` so N calls in one render cost one check, and it is
marked `server-only` so importing it from a client component fails the build rather than
failing in production.

**A DTO at the client boundary.** Repositories return domain entities; the presentation layer
maps to a DTO with an explicit field list. The mapper is a function with a return type, so
adding a sensitive field to an entity does *not* add it to the wire. `experimental.taint` marks
entities so an accidental pass-through throws in development.

**Ports for the data source.** `DocumentAnalysisRepository` is an interface in `domain/`; the
implementation lives in `infrastructure/` and is named exactly once, in `module.ts`. The shared
contract suite in `src/test/contracts/` runs against every implementation, which is what makes
"swappable" a tested property rather than a claim.

Every read is `verifySession()` → repository → entity → mapper → DTO. Never a shortcut.

## Alternatives considered

**Query directly in Server Components.** Fastest to write, and it distributes authorization
across every file that touches data. One missed check is a breach, and there is no single place
to audit.

**A repository returning raw rows.** Keeps the layering diagram tidy while leaking exactly as
much as no layering at all. The DTO, not the repository, is the security boundary.

**An ORM's row types as the domain model.** Couples `domain/` — the layer that is supposed to
import nothing — to a specific database client, and makes swapping the provider a rewrite. This
matters concretely here: the plan is to add Supabase later, and this is the difference between
that being one adapter file and being a migration.

**`proxy.ts` as the authorization layer.** Next's own documentation says not to. It runs on a
subset of requests, sees only cookies, and cannot see whether *this* user owns *this* document.
It stays an optimistic redirect for UX; `verifySession()` is the check. The E2E suite asserts
this directly — a forged session cookie passes the proxy and is rejected by the page.

## Consequences

- One function to audit for "is the user who they say they are".
- Ownership failures return **404, not 403** — a 403 confirms the resource exists. The E2E
  suite asserts the status code, not just the copy.
- Adding a field to an entity never silently ships it to the browser.
- The cost is a mapper per read, which is real boilerplate. It is bought back the first time
  someone adds a column that should never leave the server.
