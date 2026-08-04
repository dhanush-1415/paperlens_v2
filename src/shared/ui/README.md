# `src/shared/ui` — the design system

Every visual decision in the product lives here or in `app/tokens.css`. A feature composes
these; it does not restyle them.

## Layers

| Folder | What it is |
|---|---|
| `tokens/` | Token **names** in TypeScript. Values are in `app/tokens.css` |
| `theme/` | `ThemeProvider`, the no-flash bootstrap script, `useTheme` |
| `primitives/` | Unstyled behaviour and accessibility |
| `components/` | Styled, `cva`-variant components — Button, Input, Field, Alert… |
| `patterns/` | Multi-component compositions — RiskBadge, EmptyState, AppShell |
| `toast/` | The toast system |
| `icons/` | Inline SVG components. No icon-font, no runtime fetch |
| `fonts.ts` | `next/font` declarations — Instrument Serif, Geist Sans, Geist Mono |
| `cn.ts` | `clsx` + `tailwind-merge`. The only class-merging function |
| `tone.ts` | Semantic tone mapping (critical / caution / safe / info) |

## The no-hex rule

**No hex code may appear outside `app/tokens.css`.** A unit test scans `primitives/`,
`components/` and `patterns/` and fails on any hex literal.

If no token expresses what you need, that is a **missing token**, not a licence to inline one.
Add it to `tokens.css` and to the contract in `tokens/`, where a test proves the two lists never
drift apart.

This is what makes white-labeling possible: a tenant overrides a handful of custom properties
on `<html>` and the entire product re-skins, with no rebuild.
[ADR 0008](../../../docs/adr/0008-design-tokens-single-source.md).

## Risk colours are not brand colours

`--risk-critical`, `--risk-caution` and `--risk-safe` are grouped separately from brand tokens
on purpose. Brand is a preference; risk is a **safety signal** — this product's entire job is
telling someone a clause is dangerous. A tenant overriding brand colours is expected. A tenant
softening "critical" is a product decision that should be visible in review, and the grouping
makes it visible.

## Variants

`cva`, always:

```tsx
const button = cva('base…', { variants: { intent: { … }, size: { … } }, defaultVariants: { … } });
```

Not conditional class strings. A variant is a designed choice with a name; a ternary on
`className` is the same choice made privately and inconsistently.

Merge with `cn()` so a caller's `className` can override without specificity fights.

## Accessibility is not a follow-up

- Every input has a label. `<Field>` wires `aria-describedby` to both the description and the
  error, sets `aria-invalid` only when an error is actually shown, and puts `role="alert"` on
  the error text.
- Visible focus rings. Never `outline: none` without a replacement.
- Real `<button>` elements. A clickable `<div>` is not keyboard-reachable.
- `role="alert"` is assertive — it interrupts a screen reader. Use it for errors, not for
  informational text.

## The theme

`ThemeProvider` does not *decide* the theme on first load — the inline script in `theme/script.ts`
already did, before paint. The provider **adopts** that decision via `useSyncExternalStore`,
keeps it in sync with the OS while the preference is `'system'`, and is the only thing in the
codebase permitted to write `data-theme`.

`theme/` holds the codebase's single audited `dangerouslySetInnerHTML`; `eslint.config.mjs`
grants the exemption to this directory alone.
[ADR 0011](../../../docs/adr/0011-theme-ownership.md).

## Adding a component

1. Does a token exist for every value it needs? If not, add tokens first.
2. Server Component unless it needs interactivity.
3. Variants via `cva`; forward `className` through `cn()`.
4. Forward `ref` and spread the remaining native props — a component that swallows `aria-*` is
   a component someone will have to work around.
5. Test behaviour and accessibility with RTL, not implementation details.
