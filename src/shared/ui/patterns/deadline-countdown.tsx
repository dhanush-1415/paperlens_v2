'use client';

/**
 * DeadlineCountdown — time left before a response window closes.
 *
 * Contracts have deadlines: a notice period, an opt-out window, an auto-renewal date. The
 * number the user needs is "how long have I got", and the only honest way to render that is
 * to compute it on their clock, in their timezone, right now.
 *
 * ### Why it is not just `{formatDistance(deadline, new Date())}`
 *
 * Because that renders on the server too, and the server's "now" is not the user's "now".
 * The value would be computed at request time, cached by `cacheComponents`, and then served
 * unchanged for as long as the cache lives — a countdown frozen at whatever it read when the
 * page was generated. Users would see "2 hours remaining" on a deadline that passed
 * yesterday. Any time-until value is client state by construction.
 *
 * So the server renders the *date* — a fact, and cacheable forever — and the client swaps in
 * the live remainder once it hydrates. `getServerSnapshot` returning `null` is what selects
 * between the two, and it is the supported way to say "this value does not exist on the
 * server" without a `useEffect` and a mount flag.
 *
 * The SSR fallback is `deadline.slice(0, 10)` — string surgery on the ISO input, not
 * `Intl.DateTimeFormat`. A formatter would resolve a different timezone and locale on the
 * server than in the browser, and the two renders would disagree during hydration. This is a
 * case where the boring output is the only correct one.
 *
 * ### It is deliberately not a live region
 *
 * No `aria-live`. A polite live region that changes every second announces every second, and
 * the user never hears anything else. The remaining time is available on demand — it is
 * ordinary text inside a `<time>` — and the *state changes worth announcing* (crossing into
 * the last 24 hours, passing the deadline) belong to whatever owns the page, as a toast or an
 * alert, once.
 */

import { useSyncExternalStore } from 'react';

import { cn } from '@/shared/ui/cn';

import { ClockIcon } from '../icons';
import { TONE_TEXT, type RiskTone } from '../tone';

/** Inside a day: this is now urgent. */
const CRITICAL_WITHIN_SECONDS = 24 * 60 * 60;
/** Inside three days: worth planning around. */
const CAUTION_WITHIN_SECONDS = 3 * 24 * 60 * 60;

const TICK_MS = 1000;

/**
 * A single shared clock for every countdown on the page.
 *
 * One interval, however many components subscribe — twelve rows in a table would otherwise
 * be twelve timers firing at twelve slightly different offsets, which is both wasteful and
 * visibly ragged when they tick out of step. The interval is created on the first subscriber
 * and cleared on the last, so a page with no countdowns has no timer at all.
 */
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;
let snapshot = 0;

function currentSecond(): number {
  return Math.floor(Date.now() / TICK_MS);
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Refreshed here so the first post-hydration read is current rather than a second stale.
  // React calls `getSnapshot` again immediately after subscribing, which picks this up.
  snapshot = currentSecond();

  interval ??= setInterval(() => {
    snapshot = currentSecond();
    for (const listener of listeners) listener();
  }, TICK_MS);

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  };
}

/** Seconds since the epoch, quantised to the tick so the value is stable within a render. */
function getSnapshot(): number | null {
  return snapshot;
}

/** `null` means "the server has no opinion about now" — see the header. */
function getServerSnapshot(): number | null {
  return null;
}

/**
 * `3d 04:12:09`, or `04:12:09` inside the last day.
 *
 * Hand-rolled rather than `Intl.RelativeTimeFormat`, which rounds to a single unit —
 * "in 2 days" is exactly the resolution a deadline countdown must not have, because the
 * difference between 2 days and 2 days minus five minutes is the whole point of showing it.
 */
function formatRemaining(seconds: number): string {
  const total = Math.abs(seconds);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const pad = (value: number) => String(value).padStart(2, '0');
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(total % 60)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

function levelFor(remaining: number): RiskTone {
  if (remaining <= CRITICAL_WITHIN_SECONDS) return 'critical';
  if (remaining <= CAUTION_WITHIN_SECONDS) return 'caution';
  return 'safe';
}

export interface DeadlineCountdownProps {
  /** ISO 8601, with an offset or `Z`. A bare `YYYY-MM-DD` is parsed as UTC midnight. */
  deadline: string;
  /** What the deadline is for — "Opt-out window closes". Rendered before the time. */
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function DeadlineCountdown({
  deadline,
  label,
  size = 'sm',
  className,
}: DeadlineCountdownProps) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const targetMs = Date.parse(deadline);
  // A malformed date renders as the raw input rather than "NaN:NaN:NaN" or nothing at all.
  // Silently dropping it would hide a data bug behind an empty cell.
  if (Number.isNaN(targetMs)) {
    return (
      <span className={cn('text-2xs text-text-tertiary', className)}>
        {label ? `${label} ` : ''}
        {deadline}
      </span>
    );
  }

  const remaining = now === null ? null : Math.floor(targetMs / TICK_MS) - now;
  const overdue = remaining !== null && remaining < 0;
  const level: RiskTone = remaining === null ? 'safe' : levelFor(remaining);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium tabular-nums',
        size === 'md' ? 'text-sm' : 'text-2xs',
        // Before hydration there is no remainder, so there is no urgency to signal and the
        // date renders in the neutral colour. Colouring it critical on the server would be a
        // guess, and a guess about severity is worse than silence.
        remaining === null ? 'text-text-tertiary' : TONE_TEXT[level],
        className,
      )}
    >
      <ClockIcon aria-hidden className={size === 'md' ? 'size-4' : 'size-3.5'} />
      {label ? <span className="font-normal text-text-tertiary">{label}</span> : null}
      <time dateTime={deadline}>
        {remaining === null
          ? deadline.slice(0, 10)
          : overdue
            ? `Overdue by ${formatRemaining(remaining)}`
            : formatRemaining(remaining)}
      </time>
    </span>
  );
}
