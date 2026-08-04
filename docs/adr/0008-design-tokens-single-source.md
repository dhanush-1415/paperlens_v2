# 0008 — `tokens.css` owns every design value

**Status:** Accepted

## Context

A design system fails in one specific way: the same value gets written down twice. A hex code
lives in `tailwind.config`, a slightly different one in a component's `style` prop, a third in
a Figma file nobody exports. Six months later "make the brand blue slightly darker" is a
codebase-wide search, and the search misses one.

The requirement here is stronger than usual, because `config/tenant.ts` supports
white-labeling: a tenant must be able to re-skin the entire product by overriding a small set
of values. That is only possible if there *is* a small set of values, and if nothing bypasses
them.

Tailwind v4 changes the shape of this problem. There is no `tailwind.config.js` anymore —
theme configuration is CSS, via `@theme`, and Tailwind resolves utilities from CSS custom
properties. So the question is not "which JS object owns the tokens" but "should tokens live
in CSS at all, or in TypeScript with a codegen step".

## Decision

**`src/app/tokens.css` declares every colour, shadow, radius, duration and z-index exactly
once, as CSS custom properties.** `globals.css` imports it and maps it into Tailwind's
namespaces with `@theme`. Components use Tailwind utilities. Nothing else in the product
contains a hex code — enforced by a unit test that scans `primitives/`, `components/` and
`patterns/` and fails on any hex literal.

`src/shared/ui/tokens/` declares the token **names** in TypeScript — `contract.ts`,
`motion.ts`, `layers.ts`, `breakpoints.ts` — with no values. This exists so that
`TenantConfig.tokenOverrides` is typed (a tenant may restyle the system, not invent new slots
in it) and so a theming UI can enumerate tokens without parsing CSS at runtime.

`tokens.test.ts` parses the stylesheet and asserts the two lists are identical in both
directions: every name in the contract exists in CSS, and every custom property in CSS
appears in the contract. Neither can grow a member the other lacks.

Dark is the unconditional base; light is an override block. See the file header for why —
briefly, CSS cannot share one declaration block between `[data-theme="dark"]` and
`@media (prefers-color-scheme: dark)`, so one theme must be the base, and making it the
product's default look means the duplication disappears rather than moves.

## Alternatives considered

**TypeScript tokens + codegen to CSS.** The conventional answer, and the one Style Dictionary
implements. Rejected: it puts a generated artifact in the repo, adds a script that must be run
and can be forgotten, and creates a failure mode where the source and the generated CSS
disagree — which is precisely the duplication the whole exercise is meant to eliminate.
Declaring values where they are consumed removes the class of bug entirely.

**Tailwind's `@theme` as the only home, no separate `tokens.css`.** Simpler by one file, but
`@theme` values are Tailwind's vocabulary, not the product's. Runtime theming needs plain
custom properties on `:root` that a tenant can override from a `<style>` tag; `@theme` is
resolved at build time. Keeping the raw properties separate is what makes white-labeling
possible without a rebuild.

**A CSS-in-JS system (vanilla-extract, Panda).** Type-safe tokens with zero-runtime output —
genuinely good. Rejected because it is a third styling system alongside Tailwind and plain
CSS, and because RSC support in that space is still moving. Tailwind v4 with custom properties
gets ~90% of the benefit with one fewer dependency and no compile step of its own.

**Values in the TS contract as well as CSS, "for convenience".** This is the trap. It is one
`const BRAND = '#5b8cff'` away, and the moment it exists the two can disagree. The contract
file says, in a comment, that a hex code in it would be the second source of truth this
arrangement exists to prevent.

## Consequences

- Rebranding is editing one file. White-labeling is a tenant overriding a subset of the same
  custom properties on `<html>`, with no rebuild and no code change.
- The no-hex rule is a **test**, not a review convention, so it holds when nobody is looking.
  Test files are excluded from the scan — a `#` in prose is not a colour, and widening the
  regex to tell them apart would make the guard subtler and easier to slip past.
- Risk colours (`--risk-critical`, `--risk-caution`, `--risk-safe`) are grouped separately
  from brand colours, deliberately. Brand is a preference; risk is a safety signal. A tenant
  overriding brand is expected. A tenant overriding "critical" to look friendlier is a product
  decision that should be visible in review, and the grouping makes it visible.
- **Cost:** no autocomplete on token *values* in TypeScript, and a designer changing a colour
  edits a `.css` file rather than a `.ts` one. Both were judged smaller than a codegen step.

Related: [0011](0011-theme-ownership.md) (how a theme is selected and applied),
[0001](0001-clean-architecture-feature-modules.md) (why `shared/ui` has exactly one owner).
