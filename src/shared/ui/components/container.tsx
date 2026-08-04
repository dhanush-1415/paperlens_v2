/**
 * Container — horizontal measure and page gutters.
 *
 * Every screen in the product is one of four widths, and this is where those four live. A
 * page that writes `max-w-7xl mx-auto px-6` inline has forked the layout: when the shell
 * grows a sidebar and the content column has to narrow, that page will not narrow with it.
 *
 * The gutters are responsive by default (`20px → 24px → 32px`) because a fixed gutter is
 * either too tight on a phone or too loose on a desktop, and the choice is not a per-page
 * decision.
 *
 * `width` is named for the *role* of the column, not its number of pixels:
 *
 *   · `content` — the default. Page bodies, dashboards, forms.
 *   · `shell`   — wider. The top nav rail and the footer, which frame `content` and must not
 *                 line up flush with it or the header stops reading as a separate layer.
 *   · `measure` — 68 characters. Long-form prose only: legal copy, changelogs, docs. Set in
 *                 `ch` so it tracks the font rather than a guess about the font.
 *   · `full`    — no cap. For a surface that genuinely bleeds edge to edge; still gutters.
 */

import type { ElementType, HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';
import type { LayoutElement } from '../primitives/polymorphic';

const containerVariants = cva('mx-auto w-full', {
  variants: {
    width: {
      content: 'max-w-content',
      shell: 'max-w-shell',
      measure: 'max-w-measure',
      full: 'max-w-none',
    },
    /**
     * Off for a container nested inside another container — otherwise the gutters compound
     * and the inner column is inset twice for no reason anyone can see in the markup.
     */
    gutter: {
      true: 'px-5 sm:px-6 lg:px-8',
      false: '',
    },
  },
  defaultVariants: {
    width: 'content',
    gutter: true,
  },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof containerVariants> {
  /** Semantic tag. `div` by default; `main`, `header`, `footer` and `nav` are the usual ones. */
  as?: LayoutElement;
}

export function Container({ as = 'div', width, gutter, className, ...props }: ContainerProps) {
  // Widening annotation — see the note in primitives/polymorphic.ts.
  const Component: ElementType = as;
  return <Component className={cn(containerVariants({ width, gutter }), className)} {...props} />;
}

export { containerVariants };
