'use client';

/**
 * Dialog — a modal built on the platform's `<dialog>`.
 *
 * The mechanics (top layer, focus trap, inert background, focus restore, Esc, scroll lock)
 * all live in `useNativeDialog`; read that file for why none of it is hand-written. This file
 * is the shape and the accessibility contract.
 *
 * ### Why `title` is a prop and not a `<DialogTitle>` child
 *
 * `Card` is composed — `CardHeader`, `CardTitle`, `CardContent` — because every part of a
 * card is optional and the combinations are the point. A dialog is different: it *must* have
 * an accessible name, or a screen reader announces "dialog" and nothing else, and the user
 * has no idea what just took over the page. With composition, omitting the title is a valid
 * program that produces an unusable modal, and the reviewer who would catch it is looking at
 * a call site three files away. As a required prop, it is a compile error.
 *
 * The same argument does not apply to the body or the footer, which are `children` and a
 * `footer` slot and can be anything.
 *
 * ### Enter and exit animation without JavaScript
 *
 * A `<dialog>` toggles `display`, which is not animatable — historically this is why every
 * modal library keeps a `isExiting` state and a `setTimeout` matched to the CSS duration,
 * and why closing one during a route change leaves it on screen forever.
 *
 * `transition-discrete` (`transition-behavior: allow-discrete`) makes `display` and `overlay`
 * animatable, and `starting:` (`@starting-style`) supplies the from-state for an element that
 * did not exist a frame ago. The result is a real enter *and* exit transition driven entirely
 * by CSS: no exit state, no timer, no chance of the two disagreeing. The global
 * `prefers-reduced-motion` rule in `globals.css` collapses it for anyone who asked.
 */

import type { ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';

import { CloseIcon } from '../icons';
import { useNativeDialog } from '../primitives/use-native-dialog';
import { Button } from './button';
import { Heading } from './heading';
import { Text } from './text';

/**
 * The `<dialog>` element itself is only the backdrop host and the centring box. It is
 * transparent, has no padding and no border — see the backdrop-click note in
 * `useNativeDialog` for why the visible panel has to be a separate child.
 */
const dialogVariants = cva(
  [
    'm-0 max-h-dvh w-dvw max-w-dvw bg-transparent p-0',
    'fixed inset-0 grid place-items-center',
    // The backdrop, and its own fade. `::backdrop` inherits custom properties from its
    // originating element, so the theme-reactive `--overlay-scrim` resolves correctly here.
    'backdrop:bg-(--overlay-scrim)',
    'backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
    'backdrop:transition-opacity backdrop:duration-(--duration-standard) backdrop:ease-brand',
  ],
  {
    variants: {
      // Padding on the host, so the panel never touches the viewport edge on a phone while
      // the backdrop still covers everything.
      inset: {
        true: 'p-4 sm:p-6',
        false: '',
      },
    },
    defaultVariants: { inset: true },
  },
);

const panelVariants = cva(
  [
    'flex w-full flex-col overflow-hidden text-left',
    'rounded-modal border border-border-subtle bg-surface-overlay',
    'shadow-card inset-shadow-highlight',
    'max-h-[min(48rem,calc(100dvh-4rem))]',
    // Enter/exit. `overlay` must be in the transition list or the element leaves the top
    // layer on the first frame of the exit and the panel vanishes while still fading.
    'transition-[opacity,translate,scale,display,overlay] transition-discrete',
    'duration-(--duration-standard) ease-brand',
    'opacity-0 translate-y-2 scale-[0.98]',
    'open:opacity-100 open:translate-y-0 open:scale-100',
    'starting:open:opacity-0 starting:open:translate-y-2 starting:open:scale-[0.98]',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface DialogProps extends VariantProps<typeof panelVariants> {
  open: boolean;
  /** Called on every close path. The owner flips `open` to `false` in response. */
  onClose: () => void;
  /** The accessible name. Required — see the file header. */
  title: string;
  /** Optional supporting line, wired to `aria-describedby`. */
  description?: string;
  /** The actions row. Primary action last, matching platform convention on the web. */
  footer?: ReactNode;
  children?: ReactNode;
  /**
   * Off for a destructive confirm or a form with unsaved input, where a misplaced click
   * should not discard work. Esc still closes; that is a deliberate keystroke.
   */
  dismissOnBackdropClick?: boolean;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size,
  dismissOnBackdropClick = true,
  className,
}: DialogProps) {
  const { ref, onClick } = useNativeDialog({ open, onClose, dismissOnBackdropClick });

  // Derived from `title` rather than `useId` so the ids are stable across a re-render that
  // changes the title, and readable in the accessibility inspector.
  const titleId = 'dialog-title';
  const descriptionId = 'dialog-description';

  return (
    <dialog
      ref={ref}
      onClick={onClick}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(dialogVariants())}
    >
      {/* `onClick` stops here so a click inside the panel is never mistaken for the backdrop
          by an ancestor handler. The dialog's own handler already checks `event.target`, but
          this makes the boundary explicit for anything added later. */}
      <div className={cn(panelVariants({ size }), className)}>
        <header className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div className="min-w-0 flex-1">
            <Heading level={2} size="md" id={titleId}>
              {title}
            </Heading>
            {description ? (
              <Text id={descriptionId} size="sm" className="mt-1">
                {description}
              </Text>
            ) : null}
          </div>
          {/*
            A real close button, not just Esc. Esc is invisible, unavailable on touch, and
            the first thing a keyboard-only user tries is Tab — which lands here.
          */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close dialog"
            onClick={onClose}
            className="-me-2 -mt-2 shrink-0"
          >
            <CloseIcon className="size-4" />
          </Button>
        </header>

        {/*
          The only scrolling region. `overscroll-contain` stops a flick at the bottom of a
          long dialog from chaining to the page behind it — which `overflow: hidden` on
          `<html>` mostly prevents, but not on iOS.
        */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">{children}</div>

        {footer ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-border-subtle px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        ) : (
          <div className="pb-6" />
        )}
      </div>
    </dialog>
  );
}

export { dialogVariants, panelVariants };
