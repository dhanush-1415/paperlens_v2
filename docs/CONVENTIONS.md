# Conventions

Rules that hold everywhere. Most are lint-enforced — where they are, it says so, and the
enforcement is the real rule; this page is the explanation.

Structure is in [ARCHITECTURE.md](ARCHITECTURE.md). Why a decision went the way it did is in
[adr/](adr/README.md). Adding a feature is [FEATURE_TEMPLATE.md](FEATURE_TEMPLATE.md).

---

## The one rule

**Every cross-cutting concern has exactly one owner.** Before writing anything that reads an
env var, formats a date, stores a value, logs, caches, validates, or picks a colour — find the
owner and use it. If there is no owner, create one, in the right folder, once.

The failure this prevents is not ugly code. It is the day someone changes the session TTL and
it changes in four of the five places it was written down.

---

## Where does this code go?

| It… | Goes in |
|---|---|
| reads `process.env` | `config/` — **only** place, lint-enforced |
| is a pure function with no I/O | `shared/utils/` |
| is a constant used by more than one file | `shared/constants/` |
| is a Zod schema used by more than one feature | `shared/validation/` |
| renders and is feature-agnostic | `shared/ui/` |
| is a cross-cutting capability (log, cache, auth, http…) | `core/<concern>/` |
| is a business rule | `features/<f>/domain/` |
| orchestrates business rules | `features/<f>/application/` |
| talks to a database, API or SDK | `features/<f>/infrastructure/` |
| renders a feature's UI or is its Server Action | `features/<f>/presentation/` |
| decides a URL | `app/` |
| binds an interface to an implementation | `server/bootstrap.ts` or a feature's `module.ts` |

When two answers seem right, pick the lower layer. Moving code down later is mechanical;
moving it up means finding everyone who depended on where it was.

---

## Imports

```
app → features/*/index → presentation → application → domain ← infrastructure → core → config
```

- Import a feature only through its `index.ts`. Never `@/features/x/application/...`.
- `domain/` imports **nothing** — not React, not Zod, not `core/`.
- `infrastructure/` is imported by that feature's `module.ts` and by nothing else.
- `core/` never imports `features/`. The framework does not know its users.
- Use `@/` paths. No `../../..`.
- Order: external → `@/config` → `@/core` → `@/shared` → `@/features` → relative. Type-only
  imports use `import type`.

All of the above is `no-restricted-imports` in `eslint.config.mjs`. To see it work, import
`@/features/document-analysis/infrastructure` from a page and run `npm run lint`.

---

## State: where does it go?

The most common architectural mistake in an RSC app is putting state in a client store that
was never client state. Check this table first.

| Kind of state | Owner | Not this |
|---|---|---|
| Data from the server | DAL + `use cache` | a client store, a fetch-on-mount effect |
| Anything shareable by URL — filters, tabs, page | `searchParams` | `useState` (breaks back button and links) |
| Form values + submission result | `useActionState` / `useFormStatus` | a form library, a store |
| Current user / session | `verifySession()` per request | a store hydrated at login |
| Open/closed, hovered, focused — one component | `useState` | a store |
| UI state several components share — toasts, drawers, theme | **Zustand**, via `shared/state/createStore` | Context (re-render storms), a store per component |

Zustand rules: one store per concern, selectors always (`useStore(s => s.x)`, never
`useStore()`), no server data, persist through the injected `StorageDriver` and never raw
`localStorage`, and every store gets a `reset()` so tests start clean.
[ADR 0006](adr/0006-state-management.md).

---

## Errors

- Data path returns `Result<T, AppError>`. Boundaries throw. Nothing in between.
- Never bare-`catch`. Use `attempt()`, `attemptSync()`, or `normalizeError()` — all of which
  rethrow `redirect()`/`notFound()`/`unauthorized()` first. A bare catch swallows them and the
  bug looks like "the redirect sometimes doesn't happen".
- New failure mode → add a code to `ERROR_CODES` with its category, severity, HTTP status,
  message key and `report` flag. Do not throw a bare `Error`.
- Never put user-facing prose in a `throw`. Throw a message **key**; it is resolved at the
  boundary. A sentence inside a `throw` is a sentence that cannot be translated.
- "Not yours" returns **404**, never 403. A 403 confirms the resource exists.

---

## Server Actions

```ts
'use server';
export const doThing = action('feature.doThing', async (formData: FormData) => { … });
```

`action()` supplies the boundary — logging, reporting, `Result`, message-key resolution. Inside
the callback, always in this order: **re-verify the session**, check the permission, rate-limit,
then Zod-parse. A page-level check does not cover an action; actions are POST-reachable
directly.

---

## Validation

- Compose from `shared/validation/primitives`. Do not write `z.string().email()` inline — that
  is how "email address" comes to mean eight slightly different things.
- Messages are **keys** (`'validation.tooShort'`), never sentences.
- Parse with `parse()` / `parseFormData()` from `shared/validation/parse` — they return
  `Result` with field errors already keyed by dotted path.
- Client-side validation is an optimisation. The server re-validates and its answer is the one
  that counts.
- Data from an upstream service uses `parseContract()`, not `parse()`. A bad response shape is
  an `UPSTREAM_CONTRACT_VIOLATION` worth reporting, not a red label under an input.

---

## UI

- **No hex codes** outside `app/tokens.css`. A unit test enforces this. If no token expresses
  what you need, add a token — that is the missing-token signal working.
- Variants are `cva`, not conditional class strings. Merge with `cn()`.
- Server Component by default. `'use client'` only for interactivity, and as far down the tree
  as possible.
- **Never pass a function to a Client Component from a Server Component.** Pass a template
  string and interpolate on the client. React throws "Functions cannot be passed directly to
  Client Components", and it is right: a label that needs formatting should have been data.
- Accessibility is not a follow-up: label every input, `aria-invalid` when a field errors,
  `role="alert"` on the error text, visible focus, real `<button>` elements.

---

## Testing

| Level | Tool | What it is for |
|---|---|---|
| Unit | Vitest | Pure logic: utils, `Result`, errors, domain rules, container |
| Contract | Vitest | One suite per port, run against **every** adapter of it |
| Component | RTL | Behaviour and a11y — never implementation details |
| E2E | Playwright | The seams between layers, through the production build |

- Test behaviour, not internals. `getByRole`, not `querySelector('.btn')`.
- A new adapter is finished when it passes its port's existing contract suite. That is what
  makes swappability a fact rather than a claim.
- Never mock what you own — inject a fake through the container.
- **`next build` type-checks test files; `vitest` does not.** A green test run does not mean a
  green build.
- Scope E2E locators. `getByRole('alert')` is always ambiguous — Next injects its own route
  announcer with that role into every page.

---

## Comments

Explain **why**, never what. The code says what.

Worth a comment: a non-obvious constraint, a trade-off that was made deliberately, a workaround
whose removal condition should be stated, an alternative that looks better than it is.

Not worth one: restating the line below it.

If a comment names an ADR, the ADR must exist. Three files reference ADRs by filename; that is
a load-bearing link, not a citation.

---

## Naming

| Thing | Convention |
|---|---|
| Files | `kebab-case.ts` |
| Components | `PascalCase` in `kebab-case.tsx` |
| Hooks | `useThing` |
| Types/interfaces | `PascalCase`, no `I` prefix |
| Constants | `SCREAMING_SNAKE` |
| DI tokens | `SCREAMING_SNAKE` |
| Ports | what the app needs — `AuthProvider`, not `SupabaseClient` |
| Fakes | `Fake*` / `InMemory*` — **never** `Default*` or `Simple*` |

That last row matters more than it looks. A name is the only warning a call site gets, and
`DefaultAuthProvider` reads like something you may ship.

---

## Commits

`type(scope): subject` — `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`.
Scope is the folder: `core/http`, `features/document-analysis`, `shared/ui`.

`npm run verify` (typecheck + lint + test + build) must pass before pushing.

---

## Things that will bite you (Next 16)

- `middleware.ts` is now **`proxy.ts`**.
- `export const dynamic` is a **hard build error** under `cacheComponents`.
- `error.tsx` receives `unstable_retry`, not `reset`.
- `revalidateTag(tag, profile)` requires the second argument.
- `updateTag()` works only inside Server Actions.
- `cookies()`, `headers()`, `params` and `searchParams` are **async**.
- `notFound()` inside a `<Suspense>` boundary cannot change a status line that has already
  been sent. Assert on content, not status.
- The login rate limiter is real: 10 attempts per 5 minutes per email. `--repeat-each` on an
  auth-heavy E2E run will trip it, and the failure looks like a bug in the app.
