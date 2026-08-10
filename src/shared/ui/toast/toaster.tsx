'use client';

/**
 * The toast viewport. Mounted exactly once, in `app/providers.tsx`.
 *
 * It is the only subscriber to the toast store — everything else in the product calls
 * `toast.success(…)` and never imports this file. That is what makes the store the seam: the
 * viewport can move, restyle, or gain an animation without a single call site changing.
 *
 * ### The announcement strategy, and why it is `polite` everywhere
 *
 * A live region has to exist in the DOM *before* content is inserted into it, or assistive
 * technology has nothing to observe and the first toast of a session is silently missed. So
 * the `<ol>` is always rendered, empty or not, and only its children come and go.
 *
 * There is no `role="alert"` and no `aria-live="assertive"`, even for errors. Assertive
 * interrupts whatever the screen reader is currently saying — mid-word — which for a user
 * part-way through a paragraph of their own document is hostile. The reason we can afford
 * `polite` is `DURATION_BY_TONE`: critical toasts never auto-dismiss, so an announcement that
 * queues behind the current utterance still arrives, and the message is still on screen when
 * it does. Urgency is bought with persistence rather than with interruption.
 *
 * ### Pause on hover and focus
 *
 * A toast that vanishes while being read is a WCAG 2.2.1 problem and, more simply, rude. The
 * viewport suspends every countdown while the pointer is over the stack or focus is inside it.
 * `onFocus`/`onBlur` rather than `onFocusCapture` — React's versions of these already bubble,
 * so focus reaching the dismiss button inside a toast pauses the stack.
 *
 * ### There is no exit animation
 *
 * Toasts enter with `@starting-style` and leave instantly. An exit transition requires keeping
 * the element mounted for the duration of its own animation, which means a timer in JavaScript
 * that has to agree with a duration in CSS — two sources of truth for one number, and a
 * flicker whenever they drift. `Dialog` escapes this with `transition-discrete`, which works
 * because the element is *hidden* rather than removed; here it is genuinely removed. The
 * honest version is the one that does not lie about timing.
 */

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';
import { TONE_ICON, TONE_SOLID, TONE_TEXT } from '@/shared/ui/tone';

import { Button } from '../components/button';
import { CloseIcon } from '../icons';

import { useToastStore, type Toast } from './store';

const viewportVariants = cva(
 [
 'fixed z-(--z-toast) flex flex-col gap-2 p-4',
 // The container spans the edge so the stack can be centred on mobile, but it must not
 // swallow clicks on the page behind it. Each toast opts itself back in.
 'pointer-events-none',
 ],
 {
 variants: {
 position: {
 'bottom-end': 'inset-x-0 bottom-0 items-center sm:inset-x-auto sm:end-0 sm:items-end',
 'bottom-center': 'inset-x-0 bottom-0 items-center',
 'top-end': 'inset-x-0 top-0 items-center sm:inset-x-auto sm:end-0 sm:items-end',
 'top-center': 'inset-x-0 top-0 items-center',
 },
 },
 defaultVariants: { position: 'bottom-end' },
 },
);

export interface ToasterProps extends VariantProps<typeof viewportVariants> {
 className?: string;
}

export function Toaster({ position, className }: ToasterProps) {
 const toasts = useToastStore((state) => state.toasts);
 const dismiss = useToastStore((state) => state.dismiss);
 const pauseAll = useToastStore((state) => state.pauseAll);
 const resumeAll = useToastStore((state) => state.resumeAll);

 return (
 /**
 * An `<ol>`, named with `aria-label`, and not a `<div role="region">` wrapping one.
 *
 * The landmark would be marginally nicer to navigate to, but `role` replaces the implicit
 * role rather than adding to it, and wrapping means an extra box between the positioning
 * and the list. Naming the list directly keeps "Notifications, list, 2 items" — the count
 * is the part a screen-reader user actually wants — at the cost of a landmark nobody
 * navigates to deliberately for something this ephemeral.
 */
 <ol
 aria-label="Notifications"
 aria-live="polite"
 // `false` — announce only the toast that changed, not the whole stack again. With
 // `atomic`, adding a second toast re-reads the first one.
 aria-atomic="false"
 onPointerEnter={pauseAll}
 onPointerLeave={resumeAll}
 onFocus={pauseAll}
 onBlur={resumeAll}
 className={cn(viewportVariants({ position }), className)}
 >
 {toasts.map((toast) => (
 <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
 ))}
 </ol>
 );
}

interface ToastCardProps {
 toast: Toast;
 onDismiss: () => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
 const Icon = TONE_ICON[toast.tone];

 return (
 <li
 className={cn(
 'pointer-events-auto relative w-full max-w-sm overflow-hidden',
 'flex items-start gap-3 py-3 pe-2 ps-4',
 /**
 * The surface is the same in every tone.
 *
 * A tinted background would be wrong here in a way it is not wrong for `Alert`: a
 * toast floats over arbitrary content, so a red-tinted critical toast lands on top of
 * the red risk card it is reporting on and the two blur into one shape. An opaque
 * overlay surface keeps the toast legible over anything, and the tone is carried by
 * the accent bar and the icon — both of which survive greyscale.
 */
 'rounded-card border border-border-subtle bg-surface-overlay',
 'shadow-card inset-shadow-highlight',
 // Entry only. The element is new on this frame, so `@starting-style` supplies the
 // "before" values and the transition runs from them without any JavaScript.
 'transition-[opacity,translate,scale] duration-(--duration-standard) ease-brand',
 'starting:translate-y-2 starting:scale-[0.98] starting:opacity-0',
 )}
 >
 <span
 aria-hidden
 className={cn('absolute inset-y-0 start-0 w-1', TONE_SOLID[toast.tone])}
 />

 <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', TONE_TEXT[toast.tone])} />

 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium text-balance text-text-primary">{toast.title}</p>
 {toast.description ? (
 <p className="mt-1 text-2xs text-text-secondary">{toast.description}</p>
 ) : null}
 {toast.action ? (
 <Button
 type="button"
 variant="tertiary"
 size="sm"
 // Acting on a toast dismisses it. Leaving it up after the user has responded turns
 // a notification into a stale control they can click twice.
 onClick={() => {
 toast.action?.onClick();
 onDismiss();
 }}
 className="-ms-3 mt-1"
 >
 {toast.action.label}
 </Button>
 ) : null}
 </div>

 <Button
 type="button"
 variant="ghost"
 size="sm"
 iconOnly
 // Named, not just an ×: with several toasts open, "Dismiss notification" repeated is
 // still better than "button" repeated, and the toast's own text is read first.
 aria-label="Dismiss notification"
 onClick={onDismiss}
 className="-mt-1 shrink-0"
 >
 <CloseIcon className="size-4" />
 </Button>
 </li>
 );
}

export { viewportVariants as toastViewportVariants };
