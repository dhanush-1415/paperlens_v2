/**
 * The shared style contract for text-entry controls.
 *
 * `Input`, `Textarea` and `Select` are three different elements that must look like one
 * family: same height, same well, same border, same invalid treatment. Repeating the class
 * list in each of them is how families drift — one gets a new focus treatment, the other two
 * are found six months later. It lives here once and each control composes it.
 *
 * Note what is *not* here: the focus ring (global, `globals.css`) and the placeholder colour
 * (global, `::placeholder`). Anything true of every focusable element in the product belongs
 * in the stylesheet, not in a variant.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const controlVariants = cva(
  [
    'w-full rounded-control border border-border-strong bg-surface-2 text-text-primary',
    'transition-[border-color,background-color] duration-(--duration-micro) ease-brand',
    // The well lifts to the panel colour on hover — the only affordance an input needs to
    // read as interactive before it is focused.
    'hover:bg-surface-1',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'read-only:bg-surface-2 read-only:text-text-secondary',
    /**
     * Invalid styling is driven by `aria-invalid`, not by an `error` prop.
     *
     * One attribute then does both jobs: assistive technology announces the field as invalid
     * *and* the border turns red, so the two can never disagree. A separate `error` boolean
     * would let a control look invalid to sighted users while announcing as valid — which is
     * the exact failure mode this system exists to make impossible.
     */
    'aria-invalid:border-risk-critical aria-invalid:hover:bg-surface-2',
  ],
  {
    variants: {
      size: {
        /** Dense tables and filter bars. Under 44px — not for a primary touch target. */
        sm: 'h-9 px-3 text-2xs',
        md: 'h-11 px-3.5 text-sm',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type ControlVariantProps = VariantProps<typeof controlVariants>;
