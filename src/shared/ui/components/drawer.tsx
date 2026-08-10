'use client';

/**
 * Drawer — a modal panel anchored to an edge of the viewport.
 *
 * The same `<dialog>` and the same `useNativeDialog` as `Dialog`. Only the geometry differs:
 * a drawer fills one edge and slides, a dialog centres and scales. Sharing the hook is what
 * guarantees the two behave identically in every way that is not visual — focus trap, scroll
 * lock, Esc, backdrop click, focus restore — and that a fix to one is a fix to both.
 *
 * ### When to use which
 *
 * `Dialog` interrupts: it asks a question and expects an answer before anything else
 * happens. `Drawer` extends: filters, a detail panel, the mobile navigation — content that
 * belongs to the page underneath and is set aside for space rather than for attention.
 *
 * The distinction matters because it is the difference between a user who feels informed and
 * one who feels blocked. A filter panel that arrives as a centred modal reads as an error.
 *
 * ### Sides are logical, not physical
 *
 * `start` and `end` follow the writing direction, so a navigation drawer opens from the
 * leading edge in both English and Arabic without either locale special-casing it. The flex
 * alignment is already logical; the slide transform is not — CSS `translate` has no logical
 * form — so each side carries an explicit `rtl:` counterpart below. This is the entire cost
 * of RTL support in this component, paid once, before the first RTL locale exists rather
 * than during the release that adds one.
 */

import type { ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';

import { CloseIcon } from '../icons';
import { useNativeDialog } from '../primitives/use-native-dialog';
import { Button } from './button';
import { Heading } from './heading';
import { Text } from './text';

const drawerHostVariants = cva(
 [
 /*
 * `hidden open:flex`, for the reason spelled out in `dialog.tsx`: an author `display`
 * beats the UA's `dialog:not([open]) { display: none }` on cascade origin, so a host that
 * declares `flex` unconditionally is a transparent full-viewport click shield over every
 * page that mounts one — including the marketing shell, whose header mounts a drawer at
 * every breakpoint. `display` and `overlay` transition here so the panel's exit animation
 * survives the close.
 */
 'group fixed inset-0 m-0 hidden h-dvh max-h-dvh w-dvw max-w-dvw bg-transparent p-0 open:flex',
 'transition-[display,overlay] transition-discrete duration-(--duration-standard)',
 'backdrop:bg-(--overlay-scrim)',
 'backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
 'backdrop:transition-opacity backdrop:duration-(--duration-standard) backdrop:ease-brand',
 ],
 {
 variants: {
 side: {
 start: 'justify-start',
 end: 'justify-end',
 bottom: 'items-end',
 },
 },
 defaultVariants: { side: 'end' },
 },
);

const drawerPanelVariants = cva(
 [
 'flex flex-col overflow-hidden bg-surface-overlay text-left',
 'border-border-subtle shadow-card',
 // `group-open:`, not `open:` — the panel is a `<div>` and never carries `[open]`, so an
 // `open:` class here would match nothing and leave the panel translated off-screen at
 // `opacity-0` permanently. See the longer note in `dialog.tsx`.
 'transition-[translate,opacity] duration-(--duration-standard) ease-brand',
 'group-open:translate-x-0 group-open:translate-y-0 group-open:opacity-100',
 ],
 {
 variants: {
 side: {
 /* Leading edge. Navigation. */
 start: [
 'h-full w-full max-w-sm border-e',
 '-translate-x-full opacity-0 rtl:translate-x-full',
 'starting:group-open:-translate-x-full starting:group-open:opacity-0 starting:group-open:rtl:translate-x-full',
 ],
 /* Trailing edge. Filters, detail panels — the default. */
 end: [
 'h-full w-full max-w-md border-s',
 'translate-x-full opacity-0 rtl:-translate-x-full',
 'starting:group-open:translate-x-full starting:group-open:opacity-0 starting:group-open:rtl:-translate-x-full',
 ],
 /*
 * Bottom sheet. `max-h-[85dvh]` rather than a fixed height so it grows with its
 * content and still leaves a strip of the page visible — the visible strip is what
 * tells a touch user this is a sheet over the page and not a new screen.
 */
 bottom: [
 'max-h-[85dvh] w-full rounded-t-panel border-t',
 'translate-y-full opacity-0',
 'starting:group-open:translate-y-full starting:group-open:opacity-0',
 ],
 },
 },
 defaultVariants: { side: 'end' },
 },
);

export interface DrawerProps extends VariantProps<typeof drawerPanelVariants> {
 open: boolean;
 onClose: () => void;
 /** The accessible name. Required, for the reason given in `dialog.tsx`. */
 title: string;
 description?: string;
 footer?: ReactNode;
 children?: ReactNode;
 dismissOnBackdropClick?: boolean;
 className?: string;
}

export function Drawer({
 open,
 onClose,
 title,
 description,
 footer,
 children,
 side,
 dismissOnBackdropClick = true,
 className,
}: DrawerProps) {
 const { ref, onClick } = useNativeDialog({ open, onClose, dismissOnBackdropClick });

 const titleId = 'drawer-title';
 const descriptionId = 'drawer-description';

 return (
 <dialog
 ref={ref}
 onClick={onClick}
 aria-labelledby={titleId}
 aria-describedby={description ? descriptionId : undefined}
 className={cn(drawerHostVariants({ side }))}
 >
 <div className={cn(drawerPanelVariants({ side }), className)}>
 <header className="flex items-start gap-4 border-b border-border-subtle px-5 py-4">
 <div className="min-w-0 flex-1">
 <Heading level={2} size="sm" id={titleId}>
 {title}
 </Heading>
 {description ? (
 <Text id={descriptionId} size="xs" className="mt-0.5">
 {description}
 </Text>
 ) : null}
 </div>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 iconOnly
 aria-label="Close panel"
 onClick={onClose}
 className="-me-2 shrink-0"
 >
 <CloseIcon className="size-4" />
 </Button>
 </header>

 <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>

 {footer ? (
 <footer className="flex flex-col-reverse gap-2 border-t border-border-subtle px-5 py-4 sm:flex-row sm:justify-end">
 {footer}
 </footer>
 ) : null}
 </div>
 </dialog>
 );
}

export { drawerHostVariants, drawerPanelVariants };
