/**
 * Heading — where document structure and visual size stop being the same decision.
 *
 * `<h1>`…`<h6>` are an outline. Screen-reader users navigate by them, and skipping a level
 * or restarting the count mid-page makes the outline wrong. But the outline and the type
 * scale disagree constantly: a card title deep in a dashboard is an `<h3>` by structure and
 * 16px by design, while a marketing hero is an `<h1>` at 60px. A component that ties the two
 * together forces every page to choose which one to get right.
 *
 * So `level` is required and sets the tag; `size` is optional and sets the appearance. The
 * default mapping below is the common case, and overriding it is a one-word change that does
 * not touch the outline.
 *
 * ### The display sizes are one variant, not two
 *
 * `display-*` sizes bundle the serif face with its tracking and leading, because those three
 * are not independently useful: Instrument Serif at default `-0.011em` tracking and 1.5
 * leading looks like a bug, not a variation. Exposing `` as a separate boolean
 * would make that combination writable, and someone would write it.
 *
 * ### `text-balance`
 *
 * On by default. A two-line heading that breaks after the eleventh word and leaves one
 * orphan is the most common typographic defect in a shipped product, and `text-wrap: balance`
 * fixes it for free. The browser caps the algorithm at a few lines, so it costs nothing on
 * short headings and is ignored on long ones.
 */

import type { HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';

const headingVariants = cva('text-text-primary', {
 variants: {
 size: {
 /* Serif display. Marketing heroes and empty-state headlines. */
 'display-xl':
 ' font-normal tracking-display leading-display text-5xl sm:text-6xl lg:text-7xl',
 'display-lg':
 ' font-normal tracking-display leading-display text-4xl sm:text-5xl',
 'display-md': ' font-normal tracking-display leading-display text-3xl sm:text-4xl',

 /* Sans UI headings. Page titles, panel titles, card titles. */
 lg: 'text-2xl font-semibold leading-tight tracking-tight',
 md: 'text-xl font-semibold leading-snug tracking-tight',
 sm: 'text-base font-semibold leading-snug',

 /**
 * The eyebrow. A group label above a set of fields or a table section — small, upper
 * case, wide-tracked, secondary. It is a heading because it labels a region, and it is
 * `text-2xs` because it must not compete with the content it labels.
 */
 eyebrow: 'text-2xs font-semibold uppercase tracking-wider text-text-secondary',
 },
 balance: {
 true: 'text-balance',
 false: '',
 },
 },
 defaultVariants: {
 balance: true,
 },
});

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The default appearance for each outline level.
 *
 * Levels 5 and 6 are rare enough in this product that they share level 4's treatment rather
 * than inventing two more sizes nobody would be able to tell apart.
 */
const SIZE_FOR_LEVEL = {
 1: 'display-lg',
 2: 'lg',
 3: 'md',
 4: 'sm',
 5: 'sm',
 6: 'eyebrow',
} as const satisfies Record<HeadingLevel, NonNullable<VariantProps<typeof headingVariants>['size']>>;

export interface HeadingProps
 extends HTMLAttributes<HTMLHeadingElement>,
 Omit<VariantProps<typeof headingVariants>, 'size'> {
 /**
 * The outline level. Required, and deliberately not defaulted — a default would let a
 * page ship an `<h2>` it never thought about, which is how outlines end up with four
 * level-2s and no level-1.
 */
 level: HeadingLevel;
 /** Visual size. Defaults to the level's usual treatment; override freely. */
 size?: VariantProps<typeof headingVariants>['size'];
}

export function Heading({ level, size, balance, className, ...props }: HeadingProps) {
 const Component = `h${level}` as const;
 return (
 <Component
 className={cn(headingVariants({ size: size ?? SIZE_FOR_LEVEL[level], balance }), className)}
 {...props}
 />
 );
}

export { headingVariants, SIZE_FOR_LEVEL };
