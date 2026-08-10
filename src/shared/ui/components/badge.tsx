/**
 * Badge — a small, non-interactive status chip.
 *
 * If it can be clicked it is a `Button`, and if it can be dismissed it is a filter chip with
 * its own component. A badge that grew an `onClick` is a button that a keyboard user cannot
 * reach and a screen reader announces as text.
 *
 * Tone classes come from `shared/ui/tone.ts`, so a badge and an alert of the same severity
 * are the same colour by construction rather than by review.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { TONE_SOFT, TONE_SOLID, type Tone } from '../tone';

const badgeVariants = cva(
 [
 'inline-flex items-center gap-1.5 rounded-full border',
 'font-medium whitespace-nowrap',
 ],
 {
 variants: {
 tone: TONE_SOFT,
 size: {
 sm: 'px-2 py-0.5 text-2xs',
 md: 'px-2.5 py-1 text-sm',
 },
 },
 defaultVariants: {
 tone: 'neutral',
 size: 'sm',
 },
 },
);

export interface BadgeProps
 extends HTMLAttributes<HTMLSpanElement>,
 VariantProps<typeof badgeVariants> {
 /**
 * Renders a solid dot in the tone colour before the label.
 *
 * A dot is decoration, not a signal: it does not distinguish tones without colour. Any
 * badge that communicates *risk* must use `RiskBadge` instead, which carries the tone's
 * icon and is the only component permitted to render the reserved palette on its own.
 */
 dot?: boolean;
 children: ReactNode;
}

export function Badge({ className, tone, size, dot = false, children, ...props }: BadgeProps) {
 return (
 <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
 {dot ? (
 <span
 aria-hidden
 className={cn('size-1.5 shrink-0 rounded-full', TONE_SOLID[(tone ?? 'neutral') as Tone])}
 />
 ) : null}
 {children}
 </span>
 );
}

export { badgeVariants };
