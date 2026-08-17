/**
 * Card — the product's primary container.
 *
 * Exported as a small family (`Card`, `CardHeader`, `CardTitle`, `CardDescription`,
 * `CardContent`, `CardFooter`) rather than as one component with `title`, `description`,
 * `footer` and `action` props.
 *
 * The props version looks tidier for the first three call sites and then loses: the day
 * someone needs a badge between the title and the description, the only options are a new
 * prop, a `ReactNode` prop that defeats the typing, or a second component. Composition has
 * no such ceiling, and it reads in the same order it renders.
 *
 * Sub-components are plain wrappers with no coupling to `Card`, so a `CardHeader` can be used
 * inside a dialog and a `Card` can hold nothing but a chart.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

const cardVariants = cva(
  [
    'rounded-card border border-border-subtle bg-surface-1',
    // Both depth tokens are applied unconditionally and the theme decides which renders:
    // dark sets the shadow to `none` and lights the inset highlight, light does the reverse.
    // See the depth section of tokens.css.
    'shadow-card inset-shadow-highlight',
  ],
  {
    variants: {
      /** Padding is a variant, not a prop, so "our cards are 24px" stays one edit. */
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      /**
       * Interactive cards are links or buttons in disguise. The variant adds the affordance;
       * the caller is still responsible for making the whole card reachable by keyboard —
       * usually by wrapping the title in a link and stretching its hit area, never by putting
       * `onClick` on the div.
       */
      interactive: {
        true: [
          'transition-[border-color,background-color,transform] duration-(--duration-micro) ease-brand',
          'hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-2',
          'focus-within:border-border-strong',
        ],
        false: '',
      },
    },
    defaultVariants: {
      padding: 'md',
      interactive: false,
    },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, padding, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ padding, interactive }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

/**
 * Renders an `<h3>` by default.
 *
 * Heading level is a document-outline decision that belongs to the page, not to the card, so
 * `as` is available — but the default is `h3` because a card almost always sits under a
 * section heading, and a page whose only headings are `h3` still outlines correctly.
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ className, as: Component = 'h3', ...props }: CardTitleProps) {
  return (
    <Component className={cn('text-base font-semibold text-text-primary', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-2xs text-text-secondary', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm text-text-secondary', className)} {...props} />;
}

/** Actions live here. Separated by a hairline so the card reads as content-then-decision. */
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 border-t border-border-subtle pt-4', className)}
      {...props}
    />
  );
}

export { cardVariants };
