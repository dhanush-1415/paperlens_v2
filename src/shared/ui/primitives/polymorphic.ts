/**
 * Constrained polymorphism.
 *
 * Layout and typography components need to render different tags — a `Stack` that is
 * sometimes a `<ul>`, a `Text` that is sometimes a `<dd>`. There are three ways to allow it,
 * and this is the third.
 *
 * 1. **Fully generic `as`** (`<Stack as="a" href="…">`, with props inferred from the tag).
 * Correct, and the type machinery costs ~40 lines of conditional types per component,
 * produces error messages that are genuinely hard to read, and slows the language server
 * down measurably once a few hundred call sites reference it.
 * 2. **`asChild` + `Slot`**, which the interactive components use. Right when the caller
 * supplies a complete element that should *become* the component (a `Button` that is
 * really a `Link`). Wrong here: a `Stack` exists to produce a wrapper, so making the
 * caller hand one in inverts the whole point.
 * 3. **A closed union of tags**, below. The component's props stay a single flat interface
 * (`HTMLAttributes<HTMLElement>`), and the `as` prop only chooses semantics.
 *
 * The trade-off is explicit: you cannot say `<Stack as="a" href="…">`, because `href` is not
 * in `HTMLAttributes`. That is the intended limit — a layout box that takes an `href` is a
 * link, and links are `Button asChild` or a plain `<Link>`. Every tag in the unions below is
 * one whose *only* meaningful attributes are the global ones.
 */

/**
 * ### Rendering one of these
 *
 * A *union* of intrinsic tag names cannot be used directly as a JSX tag: TypeScript
 * intersects the props of every member, and `HTMLAttributes<HTMLLIElement>` and
 * `HTMLAttributes<HTMLUListElement>` do not intersect to anything a caller can satisfy. Each
 * consumer therefore widens it on the way in:
 *
 * const Component: ElementType = as;
 * return <Component className={…} {...props} />;
 *
 * A widening *annotation*, not a cast and not a helper function. `as ElementType` would be a
 * cast where none is needed — the assignment is legal — and a `toElementType(as)` helper
 * reads as component creation to `react-hooks/static-components`, which flags any call whose
 * result is used as a JSX tag. Nothing is lost: the component's exported props interface is
 * what callers are type-checked against, and `ElementType` only affects the internal tag.
 */

/** Tags a layout box may be. All block-level, all semantic, none with unique attributes. */
export const LAYOUT_ELEMENTS = [
 'div',
 'section',
 'article',
 'aside',
 'header',
 'footer',
 'main',
 'nav',
 'ul',
 'ol',
 'li',
 'dl',
 'figure',
] as const;

export type LayoutElement = (typeof LAYOUT_ELEMENTS)[number];

/** Tags a run of text may be. `strong`/`em` carry meaning; the rest are containers. */
export const TEXT_ELEMENTS = [
 'p',
 'span',
 'div',
 'strong',
 'em',
 'li',
 'dd',
 'dt',
 'figcaption',
 'address',
 'blockquote',
 'legend',
] as const;

export type TextElement = (typeof TEXT_ELEMENTS)[number];
