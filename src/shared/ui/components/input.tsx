/**
 * Text input.
 *
 * A thin, honest wrapper: it adds styling and nothing else. No internal state, no `value`
 * management, no debounce, no formatting. Those belong to whoever owns the data — a Server
 * Action's form, a `useActionState` result, a controlled client form — and an input that
 * quietly held its own copy would fight all three.
 *
 * There is no `error` prop. Pass `aria-invalid` (usually via `<Field>`, which computes it
 * from the presence of an error message) and the invalid styling follows. See `control.ts`.
 */

import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { controlVariants, type ControlVariantProps } from './control';

export interface InputProps
 extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
 ControlVariantProps {
 /**
 * Decoration rendered inside the control on the leading edge — a search glyph, a currency
 * symbol. Purely visual: it is `aria-hidden` and adds left padding to the input so text
 * never runs underneath it.
 */
 startAdornment?: ReactNode;
 /** Trailing decoration. A unit, a character counter, a "copied" tick. */
 endAdornment?: ReactNode;
}

export function Input({ className, size, startAdornment, endAdornment, ...props }: InputProps) {
 const control = (
 <input
 className={cn(
 controlVariants({ size }),
 startAdornment ? 'ps-10' : undefined,
 endAdornment ? 'pe-10' : undefined,
 className,
 )}
 {...props}
 />
 );

 if (!startAdornment && !endAdornment) {
 return control;
 }

 return (
 /**
 * The wrapper is `relative` and the adornments are absolutely positioned *over* the
 * input rather than being flex siblings inside a bordered box.
 *
 * The flex-box alternative means the border lives on the wrapper, which means the
 * wrapper has to reproduce focus, hover, disabled and invalid styling for a child it
 * does not control — four states, hand-mirrored, in a container. Overlaying keeps every
 * one of those on the real `<input>`, where the browser already handles them.
 */
 <span className="relative flex w-full items-center">
 {startAdornment ? (
 <span
 aria-hidden
 className="pointer-events-none absolute start-3 flex items-center text-text-tertiary"
 >
 {startAdornment}
 </span>
 ) : null}
 {control}
 {endAdornment ? (
 <span
 className="absolute end-3 flex items-center text-text-tertiary"
 >
 {endAdornment}
 </span>
 ) : null}
 </span>
 );
}
