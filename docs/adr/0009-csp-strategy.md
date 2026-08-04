# 0009 — `compatible` CSP, so the static shell survives

**Status:** Accepted
**Revisit when:** Next.js can apply a nonce to a prerendered shell, or the app's threat model
changes such that PPR is no longer worth its cost.

## Context

A Content Security Policy is the single most effective mitigation against XSS. The strongest
practical form is a per-request nonce plus `'strict-dynamic'`: every legitimate script carries
a random token, and anything injected into the page does not.

Next.js supports this — `proxy.ts` generates a nonce, sets it on the CSP header and on the
request, and the framework stamps it onto the scripts it emits.

The problem is what "per-request" means to a renderer. A nonce is different on every request
by definition. A prerendered HTML shell is generated once, at build time, and served to
everyone. These cannot both be true of the same bytes. Next resolves the conflict by
**opting the route out of static rendering entirely** whenever a nonce is in play. From the
framework's own CSP guide: nonces can only be applied during dynamic rendering.

This project enabled `cacheComponents: true` and built around Partial Prerendering (ADR
[0004](0004-framework-native-caching.md)). The build output shows `/scan`, `/login` and
`/document/[id]` as `◐ Partial Prerender` — a static shell on the CDN, dynamic content
streamed into it. A strict-nonce CSP turns all three into `ƒ Dynamic`: every request waits for
the origin before the first byte, and the entire caching architecture stops doing anything.

## Decision

`CSP_STRATEGY = 'compatible'` in `src/core/security/headers.ts`.

The policy is nonce-less. `script-src` is `'self' 'unsafe-inline'`, which is what allows Next's
inlined RSC flight payload (`<script>self.__next_f.push(…)</script>`) to execute. Everything
else is locked down: `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
`frame-ancestors 'none'`, `frame-src 'none'`, and an explicit empty allowlist per directive so
adding a third-party origin is a deliberate edit in one place.

The alternative is implemented, not hypothetical. `buildContentSecurityPolicy()` accepts a
nonce and emits `'nonce-…' 'strict-dynamic'` when given one; `proxy.ts` generates one when the
strategy demands it. **Changing one constant changes the policy everywhere** — which is the
actual architectural requirement. The decision is which value that constant holds today.

`'unsafe-eval'` is added in development only, because React uses `eval` to reconstruct
server-side error stacks in the browser. It is never emitted in production.

## Alternatives considered

**`strict-nonce` everywhere.** Strictly stronger security. Rejected because it costs the
static shell on every route, which was an explicit architectural choice made one ADR earlier.
Trading a measured, universal latency cost for a mitigation that is redundant against this
app's actual injection surface is a bad trade — but it is a *trade*, not a non-option, which
is why it stays implemented.

**Per-route strategy — nonce on authenticated routes, compatible on marketing pages.** The
most defensible middle ground, and the likely eventual answer. Rejected for now because the
authenticated routes are exactly the ones PPR helps most, and because two CSP regimes in one
app is two things to get wrong. Revisit when there is real user-generated HTML.

**Hash-based `script-src`.** Works for genuinely static inline scripts; the theme script would
qualify. It does not work for the flight payload, whose contents differ per render, so it
solves the small half of the problem and none of the large half.

**No CSP.** Not considered seriously.

## Consequences

- `'unsafe-inline'` on `script-src` means a successful HTML injection could execute. What
  stands between that and reality:
  - React escapes all interpolated content by default. The bypass is
    `dangerouslySetInnerHTML`, which an ESLint rule bans outside `src/shared/ui/theme/` — the
    one place it is needed, for the no-flash script, with a string that contains no user input.
  - `sanitize.ts` in `core/security` for anything that must render as markup.
  - The document text users paste is rendered as *text*, never as HTML. That is the app's
    entire untrusted-input surface and it never becomes markup.
- `style-src` keeps `'unsafe-inline'` regardless of strategy: Next injects inline `<style>`
  for critical CSS and there is no safe alternative. The risk is materially smaller than on
  `script-src` — the attacks are exfiltration-by-selector, not code execution.
- The static shell is preserved. `/` is fully static; three routes are PPR.
- This is the one place in the architecture where a security control was consciously set below
  its maximum. It is written down here, with the flag that reverses it named, rather than
  discovered later by someone reading a header dump and assuming it was an oversight.

Related: [0004](0004-framework-native-caching.md) (the PPR decision this pays for).
