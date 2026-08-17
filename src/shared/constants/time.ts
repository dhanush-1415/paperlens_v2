/**
 * Durations (requirement 19).
 *
 * `60 * 60 * 24 * 7` appears in a codebase in three subtly different forms within a year,
 * one of which is wrong. Naming them removes the arithmetic from the call site and makes
 * the unit part of the name — `SECONDS.day` and `MS.day` are never confused, whereas a bare
 * `DAY` is.
 */

export const MS = {
  millisecond: 1,
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
} as const;

export const SECONDS = {
  second: 1,
  minute: 60,
  hour: 3_600,
  day: 86_400,
  week: 604_800,
  month: 2_592_000,
  year: 31_536_000,
} as const;

/**
 * Interaction timings.
 *
 * These are UX decisions, not implementation details, so they live beside the other
 * constants rather than being invented per component. Motion durations belong to the design
 * system (`shared/ui/tokens/motion`) — these are the behavioural ones.
 */
export const TIMING = {
  /** Typing pause before a search fires. Below ~200ms it fires mid-word. */
  searchDebounceMs: 300,
  /** Scroll/resize throttle. One frame at 60fps is 16ms; 100ms is imperceptible and cheap. */
  scrollThrottleMs: 100,
  /** Delay before a tooltip opens, so a cursor crossing the trigger does not flash it. */
  tooltipDelayMs: 400,
  /** Minimum time a loading state stays visible, to avoid a flicker on a fast response. */
  minimumSpinnerMs: 400,
  /** How long a "copied!" style confirmation stays. */
  transientFeedbackMs: 2_000,
  /** Warn this long before an idle session is dropped. */
  sessionWarningMs: 2 * MS.minute,
} as const;

/** Cookie and token lifetimes, in seconds — the unit `Set-Cookie` and JWT `exp` both use. */
export const LIFETIME_SECONDS = {
  session: SECONDS.day * 7,
  rememberMe: SECONDS.day * 30,
  csrfToken: SECONDS.hour * 2,
  emailVerification: SECONDS.day,
  passwordReset: SECONDS.hour,
  shareLink: SECONDS.day * 7,
  /** Theme hint for the server. A setting, not a session — re-asking annually is generous. */
  themePreference: SECONDS.year,
} as const;
