/**
 * Section — vertical rhythm.
 *
 * `Container` owns the horizontal measure; this owns the vertical one. Together they are the
 * page grid, and neither knows about the other:
 *
 * <Section spacing="lg">
 * <Container>…</Container>
 * </Section>
 *
 * ### Why it does not wrap its own container
 *
 * It would be shorter to give `Section` a `width` prop and have it render the `Container`
 * itself. It is not done, for the same reason `Card` is composed rather than configured: the
 * moment a full-bleed background needs to span the viewport while its content stays capped —
 * which is every alternating-background marketing page and every sticky table header — the
 * two have to be separate elements, and a component that fused them has to grow an escape
 * hatch. Two components that compose have no such case.
 *
 * ### Why the spacing scale is responsive
 *
 * 96px of vertical padding is generous on a desktop and absurd on a phone, where it costs a
 * third of the viewport before any content appears. Every step below scales with the
 * breakpoint, so "roomy" means the same thing on both and no page has to say it twice.
 */

import type { ElementType, HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';
import type { LayoutElement } from '../primitives/polymorphic';

const sectionVariants = cva('', {
  variants: {
    spacing: {
      none: '',
      /** Tight bands inside an app screen — a toolbar strip, a filter row. */
      sm: 'py-6 sm:py-8',
      /** The default for app screens: dashboards, settings, tables. */
      md: 'py-10 sm:py-14',
      /** Marketing sections and long-form pages. */
      lg: 'py-16 sm:py-20 lg:py-24',
      /** The first section on a marketing page, which carries the hero. */
      xl: 'py-20 sm:py-28 lg:py-36',
    },
    /**
     * Background.
     *
     * Only three values, all drawn from the surface tokens, because an alternating-band
     * layout needs exactly "the page", "one step up" and "the brand". Anything else is a
     * one-off and belongs in `className` where a reviewer will see it.
     */
    surface: {
      none: '',
      canvas: 'bg-canvas',
      raised: 'bg-surface-1',
      brand: 'bg-gradient-brand text-text-on-brand',
    },
    /**
     * A hairline above the section.
     *
     * On the border rather than a `<Separator>` element so that a section with a background
     * gets its divider *inside* its own box — a separate hairline element between two
     * coloured bands sits on top of one of them and reads as a seam.
     */
    divider: {
      true: 'border-t border-border-subtle',
      false: '',
    },
  },
  defaultVariants: {
    spacing: 'md',
    surface: 'none',
    divider: false,
  },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  /**
   * `section` by default. A `<section>` is only meaningful to assistive technology when it
   * is labelled, so pass `aria-labelledby` pointing at the section's `Heading`, or use
   * `as="div"` when the band is purely visual.
   */
  as?: LayoutElement;
}

export function Section({
  as = 'section',
  spacing,
  surface,
  divider,
  className,
  ...props
}: SectionProps) {
  // Widening annotation — see the note in primitives/polymorphic.ts.
  const Component: ElementType = as;
  return (
    <Component
      className={cn(sectionVariants({ spacing, surface, divider }), className)}
      {...props}
    />
  );
}

export { sectionVariants };
