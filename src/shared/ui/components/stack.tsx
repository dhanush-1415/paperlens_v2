/**
 * Stack — one-dimensional layout.
 *
 * The overwhelming majority of layout in a product like this is "some things in a row or a
 * column with a consistent gap between them". `Stack` is that, and nothing else. It does not
 * do grids: a grid has a second axis, different vocabulary (`grid-cols`, `col-span`,
 * `auto-rows`) and no useful defaults, so it stays as Tailwind utilities on the one or two
 * screens that need it rather than becoming a second half-generic component here.
 *
 * ### Why gaps are named
 *
 * `gap-4` is a number; `gap="md"` is a decision. When the spacing rhythm is retuned — and it
 * always is, once — the named version is one edit in this file and the numeric version is a
 * search across every screen for which `gap-4`s were "the standard one" and which were
 * deliberate. The scale below is deliberately short: seven steps, each visibly different
 * from its neighbours. A scale with eleven steps produces `gap-3` vs `gap-3.5` arguments in
 * code review and no visible difference on screen.
 *
 * ### `row-responsive`
 *
 * A row that stays a row on a 375px phone is a row of squashed columns. `row-responsive`
 * stacks below `sm` and rows above it, which is what almost every "label on the left, value
 * on the right" pair actually wants. It is a distinct direction rather than a boolean so
 * that the two-axis nonsense of `direction="row" responsive` cannot be written.
 */

import type { ElementType, HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';
import type { LayoutElement } from '../primitives/polymorphic';

const stackVariants = cva('flex', {
  variants: {
    direction: {
      column: 'flex-col',
      row: 'flex-row',
      'row-responsive': 'flex-col sm:flex-row',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
    /**
     * `min-w-0` on the stack itself.
     *
     * A flex child defaults to `min-width: auto`, which means it refuses to shrink below its
     * content — so one long unbroken string (a filename, a URL, a document title) pushes the
     * row wider than its parent and the whole page gains a horizontal scrollbar. This is the
     * single most common layout bug in a flexbox codebase, and it is invisible until real
     * data arrives. On by default; turn it off only for a stack whose intrinsic width is the
     * point.
     */
    shrink: {
      true: 'min-w-0',
      false: '',
    },
  },
  defaultVariants: {
    direction: 'column',
    gap: 'md',
    align: 'stretch',
    justify: 'start',
    wrap: false,
    shrink: true,
  },
});

export interface StackProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof stackVariants> {
  /**
   * Semantic tag. Use `ul`/`ol` when the children are genuinely a list — a stack of cards
   * rendered as `div`s tells a screen reader nothing about how many there are.
   */
  as?: LayoutElement;
}

export function Stack({
  as = 'div',
  direction,
  gap,
  align,
  justify,
  wrap,
  shrink,
  className,
  ...props
}: StackProps) {
  // Widening annotation — see the note in primitives/polymorphic.ts.
  const Component: ElementType = as;
  return (
    <Component
      className={cn(
        stackVariants({ direction, gap, align, justify, wrap, shrink }),
        // `list-none` so `as="ul"` does not need the caller to remember it. Harmless on
        // every other tag.
        as === 'ul' || as === 'ol' ? 'list-none' : null,
        className,
      )}
      {...props}
    />
  );
}

export { stackVariants };
