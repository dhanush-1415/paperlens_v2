# 0010 — React Compiler off, one flag away

**Status:** Accepted
**Revisit when:** there is a real bundle, a real user, and a profile showing where time goes.

## Context

The React Compiler is stable and supported in Next 16. It memoizes automatically, which
removes most hand-written `useMemo`, `useCallback` and `React.memo` — code that is tedious to
write, easy to get subtly wrong, and a common source of stale-closure bugs.

Turning it on is a one-line change in `next.config.ts`. The question is whether to ship it on
by default in a foundation.

## Decision

**Off.** `reactCompiler` is absent from `next.config.ts`, and this record says why so nobody
has to guess whether it was considered.

The reasoning is that the compiler is a **performance optimization**, and this codebase has no
performance measurement to optimize against. There is one client-heavy component in the whole
application (`AnalysisForm`), because the architecture pushes work to the server: pages are
Server Components, data comes from the DAL, mutations are Server Actions, and the client state
that remains is deliberately small (ADR [0006](0006-state-management.md)).

Applying an automatic memoizer to a tree that barely re-renders buys close to nothing and
costs build time on every compile, for every developer, forever. The right moment to enable it
is when a profile shows a re-render problem — at which point the change is one line and the
benefit is measurable rather than assumed.

There is a second reason, smaller but real: a compiler that rewrites component semantics is a
new class of "why is this value stale" bug. Debugging that while simultaneously bringing up
an unfamiliar architecture is two unknowns at once. Adding it later isolates the variable.

## Alternatives considered

**On by default.** The forward-looking choice, and probably correct for an app with a large
interactive surface. Rejected here because "probably correct for a different app" is not
evidence, and because the cost is paid on every build starting immediately while the benefit
is theoretical until something is slow.

**On, with `compilationMode: 'annotation'`** — opt in per component with `'use memo'`. This is
genuinely attractive: no blanket cost, available where it helps. Rejected only because with
one client-heavy component the annotation would go in one file, and a build-tool dependency
serving one file is not worth its configuration. This is the first thing to try when the
client surface grows.

**Hand-written memoization now.** Rejected on the same evidence: `useMemo` without a profile
is cargo cult. It has a real cost — every dependency array is a chance to be wrong, and a
wrong one is a bug that only appears in one state transition. The codebase has almost none,
on purpose.

## Consequences

- Builds stay fast. `npm run build` completes in well under a minute.
- Component code is plain React with no memoization ceremony, which is easier to read and
  easier to be right about.
- If a re-render problem appears, the fix is `experimental.reactCompiler: true` plus
  `babel-plugin-react-compiler`, and this file is the record that the option was known about
  rather than missed.
- **The risk of being wrong:** if the client surface grows a lot before anyone profiles, there
  will be a period of unnecessary re-renders. Acceptable — that period ends the first time
  someone looks, and looking is cheap.

Related: [0006](0006-state-management.md) (why the client surface is small in the first place).
