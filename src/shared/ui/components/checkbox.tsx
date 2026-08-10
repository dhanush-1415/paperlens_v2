/**
 * Checkbox.
 *
 * A real `<input type="checkbox">` with `appearance-none`, overlaid with the design system's
 * own `CheckIcon`. Not a `<div role="checkbox">`.
 *
 * The custom-element version has to re-implement, correctly, everything the native input
 * already does: space-to-toggle, form participation and `FormData` serialisation, the
 * `:checked` state that CSS can see, label click-through, browser autofill and restore, and
 * every assistive-technology behaviour on every platform. All of it exists to change the
 * shape of a tick.
 *
 * `appearance-none` plus a sibling icon keeps every one of those and costs one extra span.
 *
 * Not supported: the indeterminate state. `HTMLInputElement.indeterminate` is a DOM property
 * with no attribute, so it can only be set through a ref effect, which would make this a
 * Client Component for a state nothing in the product currently uses. When a tri-state
 * "select all" header appears, it gets its own `'use client'` component next to this one.
 */

import type { InputHTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

import { CheckIcon } from '../icons';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;

export function Checkbox({ className, ...props }: CheckboxProps) {
 return (
 <span className="relative inline-flex shrink-0 items-center justify-center">
 <input
 type="checkbox"
 className={cn(
 'peer size-5 cursor-pointer appearance-none rounded-selection',
 'border border-border-strong bg-surface-2',
 'transition-[background-color,border-color] duration-(--duration-micro) ease-brand',
 'hover:border-brand-primary',
 // `brand-solid` for the fill, because the tick drawn on it is `text-on-brand`.
 'checked:border-brand-solid checked:bg-brand-solid',
 'disabled:cursor-not-allowed disabled:opacity-50',
 'aria-invalid:border-risk-critical',
 className,
 )}
 {...props}
 />
 {/* `pointer-events-none` so clicks fall through to the input underneath — without it
 the tick swallows the second click and the box cannot be unchecked. */}
 <CheckIcon
 className={cn(
 'pointer-events-none absolute size-3.5 text-text-on-brand',
 'opacity-0 peer-checked:opacity-100',
 )}
 strokeWidth={3}
 />
 </span>
 );
}
