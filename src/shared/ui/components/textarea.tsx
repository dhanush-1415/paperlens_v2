/**
 * Multi-line text input.
 *
 * The primary input surface of this product: pasting a contract, a policy or a set of terms
 * happens here. It is therefore sized generously by default and set in the mono stack when
 * `variant="document"`, because text quoted from a user's document is rendered as evidence
 * everywhere else in the interface and the field they paste it into should match.
 */

import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

import { controlVariants } from './control';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
 /**
 * `'default'` — ordinary prose: a note, a message, a description.
 * `'document'` — pasted source text. Mono, tighter tracking, taller.
 */
 variant?: 'default' | 'document';
}

export function Textarea({ className, variant = 'default', rows, ...props }: TextareaProps) {
 return (
 <textarea
 rows={rows ?? (variant === 'document' ? 12 : 4)}
 className={cn(
 // `size` is omitted: the shared variant's fixed heights are meaningless here, and
 // the padding is re-stated because a textarea's is vertical as well as horizontal.
 controlVariants({ size: 'md' }),
 'h-auto min-h-24 py-3 leading-relaxed',
 // Vertical resize only. Horizontal resize lets a user drag the field out of the
 // layout, and on a grid it drags the neighbouring column with it.
 'resize-y',
 variant === 'document' ? 'min-h-64 text-2xs tracking-tight' : undefined,
 className,
 )}
 {...props}
 />
 );
}
