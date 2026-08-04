# 0011 — Our own `ThemeProvider`, not `next-themes`

**Status:** Accepted

## Context

The product needs three themes — light, dark, and follow-the-OS — persisted across reloads,
synchronised across tabs, and applied **before first paint**. That last requirement is the
hard one: the server cannot know the user's theme (it lives in `localStorage`, and `'system'`
resolves against an OS setting no server has seen), so a naive implementation streams HTML
with the default theme, hydrates, reads storage in an effect, and *then* changes colour. That
is a full-screen flash on every hard load for every user not on the default.

`next-themes` solves exactly this, is widely used, and is about 3 kB. Writing it again is
usually the wrong instinct.

## Decision

Own it: `src/shared/ui/theme/` — `script.ts`, `theme-provider.tsx`, `theme-toggle.tsx`,
`types.ts`. Roughly 120 lines of provider plus a one-line bootstrap script.

Three requirements, none of which `next-themes` can satisfy without wrapping it anyway:

1. **It must read through the DI container's `StorageDriver`.** Every other persisted value in
   the app goes through that port — namespaced `pl:`, versioned, TTL-aware, swappable for a
   memory driver in tests. `next-themes` talks to `localStorage` directly. Wrapping it means
   the theme is the one thing in the product that persists differently from everything else,
   and the one thing a test cannot swap.
2. **It must compose with the tenant token overlay.** `config/tenant.ts` overrides design
   tokens on `<html>` for white-labeling. Theme resolution and tenant overlay both write to
   the same element and must agree on order. Two libraries owning one element's attributes is
   a race waiting to be discovered in production.
3. **It must share the storage envelope with the no-flash script.** The script cannot import
   anything — it is a string that runs before the bundle exists — so it re-implements the
   read. Both sides derive the key and version from the same constants, and `script.test.ts`
   *executes the script string* against a real `StorageEntry` write to prove they agree. That
   test is only possible because we own both halves.

Two implementation choices worth recording:

**`useSyncExternalStore`, not `useState` + a mount effect.** The obvious shape — default,
then adopt storage in `useEffect` — renders a value it already knows is wrong and corrects it,
which React 19's `react-hooks/set-state-in-effect` rule flags as a cascading render. It also
describes the situation inaccurately: `localStorage` and `matchMedia` *are* external stores,
and React has a hook for subscribing to one without breaking hydration. Cross-tab sync comes
free.

**Three separate `try`/`catch` blocks in the bootstrap script, not one.** `localStorage`
throws outright in Safari private mode, `JSON.parse` throws on a value half-written by a
killed tab, and `matchMedia` is absent in some embedded browsers. One wrapper around the whole
body means any single failure aborts before `data-theme` is written — so a light-preferring
user in a private window gets the dark base. Scoping each catch keeps the script *total*:
every path ends with a concrete theme on `<html>`, degrading preference by preference rather
than all at once. This was found by a test, not by reasoning.

## Alternatives considered

**`next-themes` as-is.** Rejected on requirements 1–3 above. It would leave a second owner for
"what theme is this", which is the specific failure mode this architecture exists to prevent.

**`next-themes` wrapped in an adapter that satisfies 1–3.** Seriously considered. The wrapper
turns out to be most of the implementation — you still need your own storage read, your own
script (its script does not know about the `pl:` envelope), and your own attribute-ordering
discipline. At that point the dependency contributes the `useSyncExternalStore` subscription
and nothing else.

**CSS-only, `@media (prefers-color-scheme)` with no JS.** Zero flash, zero code, and no way to
let a user pick a theme independent of the OS — which is the actual product requirement. Note
the architecture still degrades to exactly this when JS is unavailable: dark is the
unconditional base in `tokens.css`, so there is always a complete theme.

**Server-side theme via a cookie.** Genuinely eliminates the flash with no inline script, and
is the strongest alternative. Rejected because reading a cookie during render opts the route
out of static rendering, which costs the PPR shell for every page — the same trade rejected in
ADR [0009](0009-csp-strategy.md), for the same reason. A blocking 400-byte inline script is
cheaper than losing the static shell on every route.

## Consequences

- No flash, in either direction, on hard reload — asserted by an E2E test that checks the
  script is inline, in `<head>`, and carries neither `src` nor `defer`/`async`, then checks the
  resulting DOM state. Asserting on properties rather than on a rendered colour is what keeps
  that test meaningful.
- One inline `<script>` in every page's `<head>`, ~400 bytes, hand-minified. It is the single
  audited `dangerouslySetInnerHTML` in the codebase; `eslint.config.mjs` grants the exemption
  to this directory alone, and the string contains no user input by construction.
- `'unsafe-inline'` in `script-src` is required for it — already the case under ADR
  [0009](0009-csp-strategy.md), so this costs nothing additional. Under `strict-nonce` the
  script would need the nonce, which is why the two ADRs are linked.
- ~120 lines to maintain that a dependency could have maintained. Accepted deliberately: they
  are lines that would otherwise have been a wrapper of similar size with a dependency
  underneath it.

Related: [0008](0008-design-tokens-single-source.md) (what a theme actually switches),
[0009](0009-csp-strategy.md) (why an inline script is affordable),
[0012](0012-no-realtime-transports.md) (the same "one owner" reasoning applied elsewhere).
