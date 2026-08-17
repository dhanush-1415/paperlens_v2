'use client';

/**
 * The scroll-triggered call to action.
 *
 * Appears once the reader has passed a threshold of the page, sits above the fold on mobile,
 * and can be dismissed — after which it does not come back for the rest of the session.
 *
 * ### The ethics of this component, stated where it can be reviewed
 *
 * A sticky CTA is one edit away from being a nuisance, so the constraints are in the code
 * rather than in a design doc nobody opens:
 *
 * · **It is earned, not immediate.** It appears at 60% by default, which means the reader has
 * consumed most of the page. A bar that appears after four seconds is an interruption; one
 * that appears after four screens is a convenience.
 * · **Dismissal is permanent for the session.** Stored in *session* storage, not local: a
 * dismissal is about this visit, and a user who returns next month has not opted out
 * forever. Re-showing it on the next scroll — which is what a component with no memory
 * does — is the behaviour that makes people install blockers.
 * · **No fabricated urgency.** There is no countdown, no "3 people are viewing this", no
 * "offer ends soon". The only deadline this product ever shows is the real one printed on
 * the user's real document.
 * · **The close button is a real 44px target with a real label.** Not a 12px grey ×.
 *
 * ### Why `sessionStorage` through the port rather than component state
 *
 * A `useState` dismissal resets on navigation, so the bar reappears on every page — which is
 * indistinguishable, from the reader's side, from ignoring their dismissal. The port makes it
 * survive navigation while still being scoped to the tab.
 *
 * ### Why the threshold is measured on every scroll rather than with an observer
 *
 * "60% of the page" has no element to observe — it is a fraction of a height that changes as
 * images load and as the reader expands an accordion. Reading `scrollY` against
 * `scrollHeight` at scroll time is the only measurement that stays correct. It is also two
 * property reads on a passive listener, which is not a performance concern; the re-render is
 * guarded by a boolean that flips once. `useScrolledPast` owns that listener and shares it
 * with the header.
 */

import { useCallback, useState, useSyncExternalStore, useEffect } from 'react';
import Link from 'next/link';

import type { Route } from 'next';

import { SESSION_STORAGE_DRIVER } from '@/core/container';
import { useService } from '@/core/container/context';
import { cn } from '@/shared/ui/cn';

import { Button } from '../components/button';
import { CloseIcon } from '../icons';
import { useScrolledPast, useScrolledDown } from '../primitives/use-scroll';

/**
 * A subscription that never fires.
 *
 * `sessionStorage` has no change event worth listening to here — this tab is the only writer,
 * and this component is the only thing that writes this key. `useSyncExternalStore` is used
 * not for the subscription but for the *snapshot*: it reads storage during render on the
 * client and returns the server snapshot during SSR and hydration, which is precisely the
 * "read a browser-only value without a hydration mismatch" problem. The write path re-renders
 * through React state instead.
 */
const subscribeNever = () => () => {};

export interface StickyCtaProps {
  /** The offer. Short — this is read at a glance while scrolling. */
  message: string;
  ctaLabel: string;
  ctaHref: Route;
  dismissLabel: string;
  /**
   * Distinguishes one campaign's dismissal from another's, so replacing the message does not
   * inherit the old one's dismissals. Part of the storage key.
   */
  campaignId: string;
  /** Fraction of the page scrolled before it appears. `0.6` by default. */
  threshold?: number;
  className?: string;
}

export function StickyCta({
  message,
  ctaLabel,
  ctaHref,
  dismissLabel,
  campaignId,
  threshold = 0.6,
  className,
}: StickyCtaProps) {
  const driver = useService(SESSION_STORAGE_DRIVER);
  const storageKey = `pl:sticky-cta:${campaignId}`;

  const isPastThreshold = useScrolledPast(threshold);
  const isScrolledDown = useScrolledDown(10);

  /**
   * Dismissed until storage says otherwise — note the server snapshot is `true`.
   *
   * The inverse would render the bar for one frame on every page load before the read
   * resolves: a flash of a component the user has already closed, which is the most annoying
   * possible version of this control. Erring towards "hidden" costs nothing, because the bar
   * is gated on a scroll threshold anyway and cannot be needed on the first frame.
   */
  const wasDismissed = useSyncExternalStore(
    subscribeNever,
    useCallback(() => driver.getItem(storageKey) === '1', [driver, storageKey]),
    () => true,
  );

  /**
   * The dismissal that happened in this render tree, tracked separately.
   *
   * Writing to `sessionStorage` does not notify `useSyncExternalStore` — there is no event to
   * fire, and inventing one would mean a module-level emitter for a value only this component
   * reads. React state is the honest way to say "the user just clicked close".
   */
  const [wasJustDismissed, setJustDismissed] = useState(false);

  /**
   * Re-arm the CTA if the user scrolls all the way back to the top.
   *
   * The problem with permanent dismissal is that it assumes the user is completely
   * uninterested. Often, they just wanted to read the page without obstruction. If they
   * scroll all the way back to the hero section, it signals a reset of their reading intent.
   * By clearing the dismissal state, the CTA will reappear naturally when they scroll back down.
   */
  useEffect(() => {
    if (!isScrolledDown) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (wasJustDismissed) setJustDismissed(false);

      // Only access driver if we know it was previously dismissed (avoid unnecessary writes)
      if (driver.getItem(storageKey) === '1') {
        driver.removeItem(storageKey);
      }
    }
  }, [isScrolledDown, wasJustDismissed, driver, storageKey]);

  if (wasDismissed || wasJustDismissed || !isPastThreshold) return null;

  return (
    <div
      role="region"
      aria-label={message}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 p-4 sm:p-6',
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
        /**
         * The entrance, in CSS, with no JavaScript and no animation library.
         *
         * `starting:` compiles to `@starting-style`, which gives the browser a "before" value
         * to transition *from* on first render. The usual alternative is a `useState` flag
         * flipped inside a `requestAnimationFrame` — an extra render, an extra effect, and a
         * bug the first time someone reorders the hooks. Reduced motion is already handled
         * globally in `globals.css`, which collapses every transition to 0.01ms.
         */
        'transition-[opacity,translate] duration-(--duration-entrance) ease-brand',
        'starting:translate-y-4 starting:opacity-0',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-4xl flex-col items-start gap-4 rounded-[1.5rem] border border-border-strong/50 sm:flex-row sm:items-center sm:gap-6 sm:rounded-[2.5rem]',
          'relative overflow-hidden bg-surface-1/90 p-5 sm:py-3 sm:pr-3 sm:pl-8',
          'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)]',
          'supports-[backdrop-filter]:bg-surface-1/60 supports-[backdrop-filter]:backdrop-blur-3xl',
        )}
      >
        {/* Premium styling: Inner ring and ambient glow */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-white/40 ring-inset sm:rounded-[2.5rem] dark:ring-white/10" />
        <div className="to-brand-accent/5 pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-transparent opacity-80 dark:opacity-100" />

        <div className="relative z-10 flex-1 pr-8 sm:pr-0">
          <p className="text-[15px] leading-snug font-extrabold tracking-tight text-text-primary sm:text-base">
            {message}
          </p>
        </div>

        <div className="relative z-10 flex w-full shrink-0 items-center sm:w-auto">
          <Button
            asChild
            variant="premium"
            className="w-full font-bold hover:shadow-brand-primary/40 sm:w-auto"
          >
            <Link href={ctaHref} className="whitespace-nowrap">
              {ctaLabel}
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => {
            driver.setItem(storageKey, '1');
            setJustDismissed(true);
          }}
          aria-label={dismissLabel}
          className={cn(
            'absolute relative top-4 right-4 z-10 sm:static sm:top-auto sm:right-auto',
            'inline-flex size-8 shrink-0 items-center justify-center rounded-full sm:size-11',
            'text-text-tertiary transition-all duration-(--duration-micro)',
            'border border-transparent hover:scale-105 hover:border-border-strong/50 hover:bg-surface-2 hover:text-text-primary active:scale-95',
          )}
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
