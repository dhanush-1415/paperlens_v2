/**
 * Text — body copy, labels, captions and metadata.
 *
 * ### Why `tone` here is a hierarchy and not a severity
 *
 * `tone.ts` owns six semantic tones — `critical`, `caution`, `safe` and friends — and this
 * component deliberately does not accept them. Body copy has a *hierarchy* (this line
 * matters more than that one), not a severity. A paragraph rendered in critical red is not
 * red text: it is a callout, and callouts are `Alert`, which renders the icon and the border
 * and the live region that make the severity readable to someone who cannot see the colour.
 *
 * Allowing `<Text tone="critical">` would make the accessible version and the inaccessible
 * version equally easy to write, and the inaccessible one is shorter. So it is not offered.
 *
 * ### `measure`
 *
 * Long-form text without a width cap runs to the full width of a desktop container, which is
 * 130-odd characters per line — roughly double the point at which the eye reliably finds the
 * start of the next line. `measure` caps it at 68ch. It is off by default because most text
 * in a product UI is a label inside a component that already constrains it, and a stray
 * `max-width` there causes a wrap nobody asked for.
 */

import type { ElementType, HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';
import type { TextElement } from '../primitives/polymorphic';

const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-2xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    /** The reading hierarchy. See the file header for why the risk tones are absent. */
    tone: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      tertiary: 'text-text-tertiary',
      /** For text on a brand-filled or image surface, where the canvas is inverted. */
      inverse: 'text-text-inverse',
      /** Inherit from the parent — for a run of text inside an already-toned component. */
      inherit: '',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
    /**
     * Mono. Not a decoration: in this product monospace means "this is quoted from the
     * user's document", which is how the interface separates evidence from our own prose.
     * See the `code`/`kbd`/`samp`/`pre` rule in `globals.css` — this is the same signal for
     * text that has no matching element.
     */
    mono: {
      true: 'tracking-tight',
      false: '',
    },
    /** 1.6 line height. Paragraphs of prose only, never a UI label. */
    editorial: {
      true: 'leading-editorial',
      false: '',
    },
    measure: {
      true: 'max-w-measure',
      false: '',
    },
    /**
     * Single-line truncation with an ellipsis.
     *
     * Pairs with `Stack`'s `shrink` default: truncation only works if some ancestor is
     * allowed to be narrower than this text, which is exactly what `min-w-0` grants.
     */
    truncate: {
      true: 'truncate',
      false: '',
    },
  },
  defaultVariants: {
    size: 'sm',
    tone: 'secondary',
    weight: 'normal',
    mono: false,
    editorial: false,
    measure: false,
    truncate: false,
  },
});

export interface TextProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  /**
   * Semantic tag. `p` by default — which is why a `Text` inside a paragraph must be
   * `as="span"`, since a `<p>` inside a `<p>` is invalid HTML the browser silently rewrites.
   */
  as?: TextElement;
}

export function Text({
  as = 'p',
  size,
  tone,
  weight,
  mono,
  editorial,
  measure,
  truncate,
  className,
  ...props
}: TextProps) {
  // Widening annotation — see the note in primitives/polymorphic.ts.
  const Component: ElementType = as;
  return (
    <Component
      className={cn(
        textVariants({ size, tone, weight, mono, editorial, measure, truncate }),
        className,
      )}
      {...props}
    />
  );
}

export { textVariants };
