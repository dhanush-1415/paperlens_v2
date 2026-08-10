/**
 * Tooltip — a supplementary label on hover and focus.
 *
 * No `'use client'`. The whole thing is a `group` wrapper, a `group-hover`/`group-focus-within`
 * pair, and a `Slot` that attaches `aria-describedby` to the trigger. Zero JavaScript ships,
 * it works before hydration, and there is no positioning library.
 *
 * ### What this deliberately is not
 *
 * It is not a popover. There is no collision detection, so a tooltip on an element near the
 * viewport edge will overflow rather than flip. That is a real limitation and it is the
 * correct trade: flipping requires measuring the trigger and the viewport on every open,
 * which requires JavaScript, which turns every button that carries a hint into a client
 * boundary. When a surface genuinely needs to reposition — a dropdown menu, a date picker,
 * a command palette — it is a different component with its own client implementation, and it
 * should not be reached for by widening this one.
 *
 * ### Why the content must be redundant
 *
 * Tooltips do not exist on touch devices: there is no hover, and `:focus-within` only fires
 * after a tap that has already activated the control. Anything a tooltip says must therefore
 * also be available another way — as visible text, as an `aria-label`, or in an adjacent
 * description. A tooltip is an *accelerator* for pointer users, never the only copy of a
 * fact. `Field`'s `description` is where a hint belongs when the user must read it.
 *
 * ### Why `aria-describedby` and not `aria-label`
 *
 * A tooltip supplements a control that already has a name — `describedby` is additive, and
 * a screen reader reads the name first and the description after. `aria-label` would replace
 * the name, so "Export" with a tooltip explaining the format would be announced only as the
 * explanation.
 */

import { useId, type ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';

import { Slot } from '../primitives/slot';

const tooltipVariants = cva(
 [
 'pointer-events-none absolute z-(--z-tooltip)',
 'w-max max-w-56 rounded-control px-2.5 py-1.5',
 'bg-surface-raised text-2xs text-text-primary',
 'border border-border-strong shadow-card',
 // Invisible *and* removed from hit-testing when hidden. `opacity-0` alone would leave an
 // invisible box that swallows clicks on whatever sits behind it.
 'invisible opacity-0',
 'transition-[opacity,visibility,translate] duration-(--duration-micro) ease-brand',
 'group-hover:visible group-hover:opacity-100',
 'group-focus-within:visible group-focus-within:opacity-100',
 /**
 * A delay on the way in, none on the way out.
 *
 * Without the in-delay, sweeping the pointer across a toolbar strobes every tooltip in
 * turn. Without the *absence* of an out-delay, a tooltip lingers over whatever the user
 * moved to. Keyboard focus gets no delay at all — focus is deliberate, and a user who
 * tabbed here is already waiting.
 */
 'delay-0 group-hover:delay-300',
 ],
 {
 /**
 * The entering offset is per-placement rather than shared, because the centring
 * transform occupies one axis (`-translate-x-1/2` for top/bottom) and the motion has to
 * use the other. A single shared `translate` reset would cancel the centring and the
 * bubble would slide sideways as it appeared.
 */
 variants: {
 placement: {
 top: 'bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0',
 bottom:
 'top-full left-1/2 mt-2 -translate-x-1/2 -translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0',
 start:
 'end-full top-1/2 me-2 -translate-y-1/2 translate-x-1 group-hover:translate-x-0 group-focus-within:translate-x-0',
 end: 'start-full top-1/2 ms-2 -translate-y-1/2 -translate-x-1 group-hover:translate-x-0 group-focus-within:translate-x-0',
 },
 },
 defaultVariants: { placement: 'top' },
 },
);

export interface TooltipProps extends VariantProps<typeof tooltipVariants> {
 /** The tooltip text. Short — a sentence at most; anything longer belongs on the page. */
 content: ReactNode;
 /**
 * The trigger. Exactly one element, which receives `aria-describedby`. It must be
 * focusable — a `<button>`, a link, or an input — or keyboard users never see the tooltip.
 * Wrapping a plain `<span>` produces a pointer-only hint, which is a bug.
 */
 children: ReactNode;
 className?: string;
}

export function Tooltip({ content, children, placement, className }: TooltipProps) {
 const id = useId();

 return (
 // `inline-flex` rather than `block` so a tooltip around a button does not turn it into a
 // full-width row. `relative` anchors the absolutely-positioned bubble.
 <span className="group relative inline-flex">
 <Slot aria-describedby={id}>{children}</Slot>
 {/*
 `role="tooltip"` and rendered unconditionally. Assistive technology reads it through
 `aria-describedby` regardless of hover, which is what makes this work for a screen
 reader user who never triggers the visual state at all.
 */}
 <span id={id} role="tooltip" className={cn(tooltipVariants({ placement }), className)}>
 {content}
 </span>
 </span>
 );
}

export { tooltipVariants };
