/**
 * Separator.
 *
 * A hairline, or a hairline with a label in the middle ("or", "12 more"). Renders `<hr>` for
 * the plain case — it is the element that means this, it is announced as a separator, and it
 * needs no ARIA. The labelled case cannot use `<hr>` (it may not have children), so it is a
 * `<div role="separator">` with the label marked presentational.
 */

import type { ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

export interface SeparatorProps {
 orientation?: 'horizontal' | 'vertical';
 /** Centred text. Horizontal only — a vertical separator with a label is a layout, not a rule. */
 label?: ReactNode;
 className?: string;
}

export function Separator({ orientation = 'horizontal', label, className }: SeparatorProps) {
 if (orientation === 'vertical') {
 return (
 // `aria-orientation` is required: the default for `role="separator"` is horizontal, so
 // without it a vertical rule is announced as the wrong shape.
 <div
 role="separator"
 aria-orientation="vertical"
 className={cn('w-px self-stretch bg-border-subtle', className)}
 />
 );
 }

 if (!label) {
 return <hr className={cn('border-t border-border-subtle', className)} />;
 }

 return (
 <div
 role="separator"
 className={cn('flex items-center gap-3 text-2xs text-text-tertiary', className)}
 >
 <span aria-hidden className="h-px flex-1 bg-border-subtle" />
 {label}
 <span aria-hidden className="h-px flex-1 bg-border-subtle" />
 </div>
 );
}
