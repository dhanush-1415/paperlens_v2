/**
 * Spinner.
 *
 * Used sparingly and deliberately. The design system's default loading affordance is a
 * `<Skeleton>`, because a skeleton communicates *what* is arriving and its shape, while a
 * spinner communicates only "wait". Reach for this when the wait has no shape — a button
 * submitting, a file uploading, an inline retry.
 *
 * Built from a bordered circle rather than an SVG arc so it costs one element, inherits
 * `currentColor`, and scales with the `size-*` utility rather than a viewBox.
 */

import { cn } from '@/shared/ui/cn';

export interface SpinnerProps {
 className?: string;
 /**
 * Accessible label, e.g. `t('common.loading')`.
 *
 * Omit when the spinner sits inside a control that already announces its own busy state
 * (a `<Button loading>` sets `aria-busy` on itself). Two announcements for one wait is
 * noise, and the second one usually interrupts the first.
 */
 label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
 return (
 <span
 role={label === undefined ? undefined : 'status'}
 aria-hidden={label === undefined ? true : undefined}
 className={cn('inline-flex items-center', className)}
 >
 <span
 className={cn(
 'size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
 // `motion-reduce` rather than relying on the global `prefers-reduced-motion` rule:
 // that rule collapses the duration to 0.01ms, which on an infinite spin renders as
 // a strobing blur. Here the correct reduced-motion behaviour is to stop entirely.
 'motion-reduce:animate-none motion-reduce:border-t-current motion-reduce:opacity-60',
 )}
 />
 {label === undefined ? null : <span className="sr-only">{label}</span>}
 </span>
 );
}
