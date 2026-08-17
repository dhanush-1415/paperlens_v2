/**
 * The stacking contract.
 *
 * Every element that leaves the document flow picks a layer from this list. Nothing in the
 * codebase is permitted to write a numeric `z-index` — that is how a product ends up with
 * `z-index: 99999` on a tooltip and a dropdown that renders behind a modal in one specific
 * flow nobody can reproduce.
 *
 * The order encodes real precedence rules, each of which has a reason:
 *
 * sticky < drawer a drawer covers the sticky header, or the header floats over its own
 * backdrop and the drawer looks broken.
 * overlay < modal the scrim is *under* the thing it is dimming, by definition.
 * modal < popover a select inside a modal must open above it, not clip inside it.
 * popover < toast a toast is an interruption and outranks anything transient.
 * toast < tooltip the tooltip is always the topmost thing on screen; it is attached to
 * the pointer and never obscures a decision.
 *
 * Gaps of 100 leave room to slot a new layer between two existing ones without renumbering
 * everything below it. Mirrored as `--z-*` in `src/app/tokens.css`; the drift test proves
 * the two agree.
 */

export const LAYERS = {
  base: 0,
  /** Cards and panels that lift on hover. */
  raised: 100,
  /** The app header and any sticky table header. */
  sticky: 200,
  drawer: 300,
  /** The scrim behind a modal or drawer. */
  overlay: 400,
  modal: 500,
  /** Selects, dropdowns, command palette results — anything anchored to a trigger. */
  popover: 600,
  toast: 700,
  tooltip: 800,
} as const;

export type LayerName = keyof typeof LAYERS;

/**
 * `layer('modal')` → `500`.
 *
 * Prefer the Tailwind utility (`z-[500]` is not it — use `style={{ zIndex: layer('modal') }}`
 * or the `var(--z-modal)` custom property) so the value stays traceable to this file.
 */
export function layer(name: LayerName): number {
  return LAYERS[name];
}
