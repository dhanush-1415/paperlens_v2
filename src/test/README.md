# `src/test` — shared test infrastructure

Fixtures, fakes, and the port contract suites. Unit tests live next to the code they test
(`*.test.ts`); this folder holds what more than one of them needs.

## Contents

| Path | Job |
|---|---|
| `contracts/` | **Port contract suites** — the important thing in this folder |
| `fakes.ts` | Shared fakes: fixed clock, memory storage, capturing logger |
| `stubs/` | Fixture data |
| `setup.ts` | Vitest setup — `jest-dom` matchers, global cleanup |

## Contract suites

A contract suite is one set of assertions, exported as a function, run against **every** adapter
of a port:

```ts
// src/test/contracts/storage-driver.contract.ts
export function describeStorageDriver(name: string, create: () => StorageDriver) { … }

// consumed by each adapter's own test file
describeStorageDriver('memory', () => createMemoryStorageDriver());
describeStorageDriver('local',  () => createLocalStorageDriver());
```

This is what makes adapters interchangeable **in fact** rather than in claim. Ports and
dependency injection let you swap an implementation; only a shared suite tells you the
replacement actually behaves the same. Without it, "implements the interface" means the types
line up — and types do not encode that `setItem` must be readable by `getItem`, or that a
`null` return means absent rather than error.

Suites exist for `AuthProvider`, `SessionStore`, `StorageDriver` and
`DocumentAnalysisRepository`.

**Write the suite before the second adapter, ideally before the first.** A suite written after
an adapter describes that adapter. One written before describes the port.

### It has already earned its keep

The storage suite caught a noop driver whose `setItem` returned successfully and stored
nothing — a lie that would have surfaced as "my preference doesn't save, sometimes, on some
browsers" and taken a day to find.

## Fakes vs mocks

Prefer a **fake**: a real implementation with a simpler substrate (memory instead of a
database). It runs the contract suite, so it is known to behave correctly.

Avoid mocks that assert on call sequences. They test how the code is written rather than what
it does, and they fail on every refactor that changes nothing.

Never mock something you own — inject a fake through the container instead:

```ts
container.override(AUTH_PROVIDER, fakeAuthProvider);
```

## Running

```bash
npm run test            # watch
npm run test -- --run   # once
npm run test:coverage   # thresholds enforced
```

## Two things that will catch you out

- **`next build` type-checks test files; `vitest` does not.** A green test run is not a green
  build. `npm run verify` runs both.
- **E2E locators must be scoped.** Next injects `<div role="alert" id="__next-route-announcer__">`
  into every page, so a bare `getByRole('alert')` is always ambiguous. Scope to the form or
  container you mean.
