/**
 * Accordion — `<details>` and `<summary>`, styled.
 *
 * No `'use client'`, no state, no JavaScript at all. This is the one disclosure pattern the
 * platform implements completely, and the implementation is better than a hand-rolled one:
 * it works before hydration, it works with JavaScript disabled, the browser's find-in-page
 * opens a closed section to reveal a match inside it, and `Ctrl+P` prints the expanded
 * content. A `useState` version gets none of those, and the third one — find-in-page — is the
 * single most common way anyone actually navigates a long FAQ or a terms page.
 *
 * ### Exclusivity
 *
 * Passing the same `group` to several items makes them mutually exclusive: opening one closes
 * the rest, handled by the browser via the `name` attribute. It is an explicit string on each
 * item rather than a prop on `Accordion` because propagating it would require either React
 * context — unavailable in Server Components, and making this client-only would forfeit
 * everything above — or `cloneElement`, which breaks the moment an item is wrapped in a
 * `.map()` or a fragment.
 *
 * Leave it off and every section opens independently, which is the right default for an FAQ.
 *
 * ### Animation
 *
 * `::details-content` is the pseudo-element wrapping everything after the `<summary>`, and
 * with `interpolate-size: allow-keywords` its `block-size` can transition from `0` to `auto`.
 * That is the whole animation — no measuring `scrollHeight`, no `ResizeObserver`, no
 * max-height guess that clips long content. Browsers without it simply snap open, which is
 * exactly what a `<details>` does anyway.
 */

import type { HTMLAttributes, ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';

import { ChevronDownIcon } from '../icons';

const accordionVariants = cva('', {
  variants: {
    variant: {
      /** Hairline-separated rows. For FAQs and long-form disclosure. */
      plain: 'divide-y divide-border-subtle border-y border-border-subtle',
      /** Individually bordered cards with a gap. For settings groups. */
      separated: 'flex flex-col gap-2',
    },
  },
  defaultVariants: { variant: 'plain' },
});

export interface AccordionProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof accordionVariants> {}

export function Accordion({ variant, className, ...props }: AccordionProps) {
  return <div className={cn(accordionVariants({ variant }), className)} {...props} />;
}

const itemVariants = cva('group overflow-hidden', {
  variants: {
    variant: {
      plain: '',
      separated: 'rounded-card border border-border-subtle bg-surface-1',
    },
  },
  defaultVariants: { variant: 'plain' },
});

export interface AccordionItemProps
  extends Omit<HTMLAttributes<HTMLDetailsElement>, 'title'>, VariantProps<typeof itemVariants> {
  /** The always-visible row. A string in almost every case; a node when it needs a badge. */
  title: ReactNode;
  /**
   * Shared name. Items with the same value are mutually exclusive — the browser closes the
   * others when one opens. Must match the sibling items exactly; a typo silently produces an
   * independent section, which is why it should come from a constant and not a literal.
   */
  group?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
}

export function AccordionItem({
  title,
  group,
  defaultOpen,
  variant,
  className,
  children,
  ...props
}: AccordionItemProps) {
  return (
    <details
      name={group}
      open={defaultOpen}
      className={cn(
        itemVariants({ variant }),
        // The height transition. `interpolate-size` is set globally in `globals.css`; without
        // it `height: auto` is not an interpolable value and this rule is inert rather than
        // broken.
        '[&::details-content]:h-0 [&::details-content]:overflow-hidden',
        '[&::details-content]:transition-[height,content-visibility] [&::details-content]:transition-discrete',
        '[&::details-content]:duration-(--duration-standard) [&::details-content]:ease-brand',
        'open:[&::details-content]:h-auto',
        className,
      )}
      {...props}
    >
      {/*
 `list-none` and the `::-webkit-details-marker` reset remove the browser's default
 triangle, which cannot be styled and points the wrong way in half of them. The
 replacement chevron below rotates on open, giving the same affordance under our own
 control.

 `<summary>` is focusable and Enter/Space-activatable natively, and browsers expose it
 as a button with `aria-expanded` — none of which needs to be added here.
 */}
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-4',
          'px-4 py-4 text-sm font-medium text-text-primary select-none',
          'transition-colors duration-(--duration-micro) ease-brand',
          'hover:bg-surface-2',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <span className="min-w-0">{title}</span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            'size-4 shrink-0 text-text-tertiary',
            'transition-transform duration-(--duration-standard) ease-brand',
            'group-open:rotate-180',
          )}
        />
      </summary>
      {/* The padding lives on an inner element rather than on `::details-content`, because a
 transition from `height: 0` on a box that also has padding animates from 32px, not
 from nothing, and the section visibly jumps at the start of every open. */}
      <div className="px-4 pb-4 text-sm text-text-secondary">{children}</div>
    </details>
  );
}

export { accordionVariants, itemVariants as accordionItemVariants };
