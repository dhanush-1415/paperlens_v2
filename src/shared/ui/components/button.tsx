/**
 * Button (requirement 22).
 *
 * The reference implementation for every component in this system. The pattern:
 *
 * 1. `cva` owns the class matrix. Variants are enumerable and type-checked, so
 * `variant="primry"` is a compile error and "what buttons exist?" is answerable by
 * reading one object rather than grepping for `className`.
 * 2. Props extend the real DOM props, so `type`, `form`, `aria-*`, `data-*` and every
 * event handler work without being individually forwarded.
 * 3. `className` is merged last through `cn`, so a caller can override a utility without
 * fighting source order. It is an escape hatch, and a `className` doing anything more
 * than nudging spacing is a missing variant.
 * 4. `asChild` renders as a link or any other element rather than nesting one inside a
 * button — see `primitives/slot.tsx`.
 *
 * No component in this system takes a `style` prop, and none reads a token value in JS.
 * Every visual decision is a Tailwind utility resolving to a custom property, which is what
 * makes the theme switch and the tenant overlay work without touching a single component.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { Slot, Slottable } from '../primitives/slot';
import { Spinner } from './spinner';

const buttonVariants = cva(
 // Base: everything true of every button, in every variant and size.
 [
 'relative inline-flex items-center justify-center gap-2',
 'font-medium whitespace-nowrap select-none',
 'rounded-control',
 // Only the properties that actually change are transitioned. `transition-all` would
 // also animate width and height, so a button that grows when its label changes slides
 // instead of snapping — and it makes every layout change a paint.
 'transition-[background-color,border-color,color,box-shadow,transform]',
 'duration-(--duration-micro) ease-brand',
 // A 1px lift on press. Subtle enough to read as mechanical rather than playful, and it
 // is the only transform in the system's interaction vocabulary.
 'active:translate-y-px',
 // Disabled is `pointer-events-none` *and* dimmed: without the first, hover styles still
 // fire on a disabled control and it looks clickable.
 'disabled:pointer-events-none disabled:opacity-50',
 ],
 {
 variants: {
 variant: {
 /** The one action on the screen that matters. At most one per view. */
 primary: [
 // `brand-solid`, not `brand-primary`: this is the one element in the product that
 // puts white text on the brand, and the identity blue only reaches 3.16:1 under it.
 'bg-brand-solid text-text-on-brand',
 'hover:bg-brand-solid-hover',
 'inset-shadow-highlight',
 ],
 /** Premium high-fidelity button with sliding gradient, used primarily on the marketing site. */
 premium: [
 'bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-[length:200%_auto] text-text-on-brand shadow-xl shadow-brand-primary/30',
 'hover:bg-[position:right_center]',
 'inset-shadow-highlight',
 ],
 /** Everything else with real weight. Bordered, reads as an object. */
 secondary: [
 'border border-border-strong bg-surface-1 text-text-primary',
 'hover:border-border-strong hover:bg-surface-2',
 'inset-shadow-highlight',
 ],
 /** Inline, text-like, usually with a trailing arrow. Navigational. */
 tertiary: [
 'text-text-secondary underline-offset-4',
 'hover:text-text-primary hover:underline',
 ],
 /** Icon buttons and toolbar actions — no chrome until hovered. */
 ghost: ['text-text-secondary', 'hover:bg-surface-2 hover:text-text-primary'],
 /**
 * Irreversible actions only: delete, revoke, cancel a subscription.
 *
 * Uses the risk palette, which is otherwise reserved for document risk. This is the
 * one sanctioned exception, and it is sanctioned because it is the same message —
 * "this one is dangerous" — rendered in the same language the user already learned
 * on their document.
 */
 destructive: ['bg-risk-critical text-text-on-brand', 'hover:brightness-110'],
 },
 size: {
 /** Dense desktop toolbars. Never the only target on a touch surface — 36px is under
 * the 44px the design system commits to for primary tap targets. */
 sm: 'h-9 px-3 text-2xs',
 md: 'h-11 px-4 text-sm',
 lg: 'h-12 px-6 text-base',
 },
 /** Square, for a lone icon. Pairs with `size` to stay on the same height rhythm. */
 iconOnly: {
 true: 'aspect-square px-0',
 false: '',
 },
 fullWidth: {
 true: 'w-full',
 false: '',
 },
 },
 defaultVariants: {
 variant: 'secondary',
 size: 'md',
 iconOnly: false,
 fullWidth: false,
 },
 },
);

export interface ButtonProps
 extends
 Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
 VariantProps<typeof buttonVariants> {
 children?: ReactNode;
 /**
 * Renders as the child element instead of a `<button>`, keeping the styles.
 * `<Button asChild><Link href="/pricing">Pricing</Link></Button>`
 */
 asChild?: boolean;
 /**
 * Shows a spinner and blocks interaction.
 *
 * Separate from `disabled` because they mean different things to assistive technology:
 * `disabled` says "you cannot do this", `aria-busy` says "this is happening". A form that
 * marks its submit button `disabled` while saving tells a screen-reader user the action is
 * unavailable, which is wrong and unrecoverable if the request fails silently.
 */
 loading?: boolean;
 /** Icon before the label. Hidden while loading — the spinner takes its place. */
 startIcon?: ReactNode;
 /** Icon after the label. The arrow on a `tertiary` button lives here. */
 endIcon?: ReactNode;
}

export function Button({
 className,
 variant,
 size,
 iconOnly,
 fullWidth,
 asChild = false,
 loading = false,
 disabled,
 startIcon,
 endIcon,
 children,
 type,
 ...props
}: ButtonProps) {
 const Component = asChild ? Slot : 'button';

 return (
 <Component
 // `type="button"` by default. HTML's default is `submit`, which means every
 // unannotated button inside a form submits it — the single most common cause of a
 // form posting when the user clicked something else entirely.
 type={asChild ? undefined : (type ?? 'button')}
 disabled={asChild ? undefined : (disabled ?? loading)}
 aria-busy={loading || undefined}
 className={cn(buttonVariants({ variant, size, iconOnly, fullWidth }), className)}
 {...props}
 >
 {loading ? <Spinner className="size-4" /> : startIcon}
 {/*
 * Marked, so `Slot` knows which of these three is the element to render as. Without
 * it the spinner and the icons are indistinguishable from the caller's child, and
 * `Children.only` throws — see `primitives/slot.tsx`.
 */}
 {asChild ? <Slottable>{children}</Slottable> : children}
 {loading ? null : endIcon}
 </Component>
 );
}

export { buttonVariants };
