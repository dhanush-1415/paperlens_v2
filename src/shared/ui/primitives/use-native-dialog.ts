'use client';

/**
 * The `<dialog>` element, driven from React state.
 *
 * ### Why the platform element and not a div in a portal
 *
 * `showModal()` is not a nicer way to set `display: block`. It is the browser doing, for
 * free and correctly, every hard part of a modal:
 *
 *   · **Top layer.** The dialog renders above every stacking context on the page, so no
 *     z-index is needed and no `transform` on an ancestor can trap it. This is the one thing
 *     a portal-based implementation can never fully solve.
 *   · **Focus trap.** Tab cycles inside the dialog. Getting this right by hand means
 *     enumerating focusable elements, which means keeping a selector list in step with every
 *     new HTML element and every `contenteditable`, `tabindex`, `inert` and shadow-root edge
 *     case. Libraries exist because it is genuinely hard.
 *   · **Inert background.** Everything behind is non-interactive *and* hidden from the
 *     accessibility tree. A `aria-hidden` div sibling gets the second half wrong constantly.
 *   · **Focus restore** to the trigger on close.
 *   · **Esc to dismiss**, as a cancellable `cancel` event.
 *   · **`::backdrop`**, a real pseudo-element that participates in the top layer.
 *
 * That is a focus-trap dependency, a portal, a scroll manager and an `aria-hidden` sweeper
 * that this codebase does not have to own or keep working.
 *
 * ### What it does not do
 *
 * Background scroll lock. `showModal()` blocks interaction with the page but not the scroll
 * wheel, so the content behind still scrolls. That is handled here, with `overflow: hidden`
 * on `<html>` — and no width compensation, because `globals.css` reserves the scrollbar
 * gutter permanently for exactly this reason.
 *
 * ### Why the `open` prop is controlled
 *
 * The DOM already holds open/closed state, so a component with its own `useState` has two
 * copies that drift the moment the user presses Esc. Here React state is the single source
 * of truth and the effect below drives the element toward it; every route out of the open
 * state — Esc, backdrop click, the close button, a `<form method="dialog">` submit — funnels
 * through the element's own `close` event and back into `onClose`.
 */

import { useEffect, useRef, type RefObject } from 'react';

export interface UseNativeDialogOptions {
  open: boolean;
  /**
   * Called whenever the dialog closes, for any reason. The owner is expected to flip `open`
   * to `false` in response; until it does, the effect will reopen the element, which is the
   * correct behaviour for a modal the caller is refusing to let go of (an unsaved-changes
   * guard, for instance).
   */
  onClose: () => void;
  /**
   * Whether clicking the backdrop dismisses. Off for anything with unsaved input — a stray
   * click outside a half-filled form that discards it is a genuinely bad afternoon.
   */
  dismissOnBackdropClick?: boolean;
}

export interface NativeDialogHandles {
  ref: RefObject<HTMLDialogElement | null>;
  /** Spread onto the `<dialog>`. Handles backdrop clicks. */
  onClick: (event: React.MouseEvent<HTMLDialogElement>) => void;
}

export function useNativeDialog({
  open,
  onClose,
  dismissOnBackdropClick = true,
}: UseNativeDialogOptions): NativeDialogHandles {
  const ref = useRef<HTMLDialogElement>(null);

  /**
   * `onClose` in a ref so the subscription effect below does not re-run on every render of
   * a parent that passes an inline arrow function. Re-subscribing is cheap, but tearing down
   * and re-adding the listener mid-transition is the kind of thing that loses an event.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Drive the element toward the React state. Guarded on `el.open` so re-rendering while
  // already open does not call `showModal()` twice — the second call throws `InvalidStateError`.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  // Every close path arrives here, including Esc and `<form method="dialog">`.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => onCloseRef.current();
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, []);

  /**
   * Background scroll lock.
   *
   * Restores the previous value rather than clearing it, so two nested dialogs — a confirm
   * inside a drawer — do not have the inner one unlock the page when it closes.
   */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  /**
   * Backdrop click.
   *
   * `::backdrop` is not an element and cannot receive a listener, so the click lands on the
   * `<dialog>` itself. `event.target === ref.current` is what distinguishes "clicked the
   * dark area" from "clicked something inside the panel", because the panel's children are
   * descendants and would report themselves as the target.
   *
   * This is why the visible panel must be a child of the `<dialog>` and not the dialog's own
   * box: if the dialog *is* the panel, its padding is part of it and every click on the
   * padding closes the modal.
   */
  const onClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (!dismissOnBackdropClick) return;
    if (event.target === ref.current) ref.current?.close();
  };

  return { ref, onClick };
}
