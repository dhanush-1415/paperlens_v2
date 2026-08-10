/**
 * The clock (requirements 8, 21, 27).
 *
 * "What time is it" is a dependency, not a language feature. Code that calls `new Date()`
 * directly cannot be tested without freezing global time — which is a process-wide mutation
 * that leaks between parallel test files and makes a suite order-dependent. Code that calls
 * an injected `Clock` is tested by passing a different function.
 *
 * That is why `eslint.config.mjs` makes `Date.now()` and argument-less `new Date()` errors
 * inside `features/`, `app/` and `server/`, and why this file — in `core/`, the one layer
 * exempted — is where the real implementation lives. The exemption is not a loophole: this
 * module is the *reason* for it. Every other layer resolves `CLOCK` from the container and
 * gets `systemClock` in production and `fixedClock` in tests, with no call-site change.
 *
 * ### Why `() => Date` and not a class
 *
 * A `Clock` interface with a `now()` method would be one more type to import, mock and
 * assert against, and every consumer would only ever call the single method. A bare
 * function is structurally identical, trivially inlined by a test (`() => new Date(0)`),
 * and needs no adapter. Composition over inheritance, applied to the smallest possible
 * dependency.
 *
 * ### Dates, not epoch milliseconds
 *
 * The canonical shape is `Date` because that is what expiry checks, formatting and the
 * session layer all speak. Consumers that genuinely want a number (analytics timestamps,
 * HTTP timing budgets) wrap the clock in {@link epochMillis} rather than each holding a
 * second, separately-injectable millisecond clock.
 */

/**
 * The current time, injected.
 *
 * Always resolve this from the container's `CLOCK` token. Importing `systemClock` directly
 * outside a composition root re-creates the untestable coupling this module exists to
 * remove.
 */
export type Clock = () => Date;

/** Milliseconds since the Unix epoch, for the APIs that want a number. */
export type EpochClock = () => number;

/**
 * Real wall-clock time. The production binding for `CLOCK`.
 *
 * A fresh `Date` on every call, deliberately: `Date` is mutable (`setHours` and friends),
 * so returning a shared instance would let one caller silently rewrite another's timestamp.
 */
export const systemClock: Clock = () => new Date();

/**
 * A clock stopped at an instant.
 *
 * The default test binding. Every read returns an equal-but-distinct `Date`, so a test that
 * mutates the value it received cannot corrupt subsequent reads.
 *
 * ```ts
 * container.registerValue(CLOCK, fixedClock('2026-01-01T00:00:00Z'));
 * ```
 */
export function fixedClock(instant: Date | string | number): Clock {
 const frozen = new Date(instant).getTime();

 if (Number.isNaN(frozen)) {
 throw new TypeError(`fixedClock: not a valid instant: ${String(instant)}`);
 }

 return () => new Date(frozen);
}

/**
 * A clock a test can wind forward.
 *
 * For the cases `fixedClock` cannot express — cache expiry, rate-limit windows, retry
 * backoff — where the assertion *is* that time passed. Preferred over `vi.useFakeTimers()`
 * when only the clock needs to move: fake timers also intercept `setTimeout`, which changes
 * how the code under test schedules work and turns a timing test into a scheduling test.
 *
 * ```ts
 * const clock = manualClock('2026-01-01T00:00:00Z');
 * const limiter = createMemoryRateLimiter({ now: clock.now });
 * clock.advance(60_000);
 * ```
 */
export interface ManualClock {
 /** Pass this to whatever takes a `Clock`. */
 readonly now: Clock;
 /** Move forward. Negative values are rejected — time does not run backwards. */
 advance(milliseconds: number): void;
 /** Jump to an absolute instant, forwards or backwards. */
 set(instant: Date | string | number): void;
}

export function manualClock(start: Date | string | number = 0): ManualClock {
 let current = new Date(start).getTime();

 if (Number.isNaN(current)) {
 throw new TypeError(`manualClock: not a valid instant: ${String(start)}`);
 }

 return {
 now: () => new Date(current),

 advance(milliseconds) {
 if (milliseconds < 0) {
 throw new RangeError('manualClock.advance: use set() to move backwards');
 }
 current += milliseconds;
 },

 set(instant) {
 const next = new Date(instant).getTime();
 if (Number.isNaN(next)) {
 throw new TypeError(`manualClock.set: not a valid instant: ${String(instant)}`);
 }
 current = next;
 },
 };
}

/**
 * A clock shifted by a fixed amount.
 *
 * The intended use is server clock-skew correction: if a response's `Date` header says the
 * upstream is 400ms ahead, wrapping the clock keeps every expiry comparison consistent with
 * the authority rather than with this process. Also the cheapest way to test "what does this
 * look like tomorrow" without restating the whole instant.
 */
export function offsetClock(base: Clock, offsetMilliseconds: number): Clock {
 return () => new Date(base().getTime() + offsetMilliseconds);
}

/**
 * Adapt a `Clock` for the APIs that measure in milliseconds.
 *
 * `createAnalytics`, `createHttpClient` and `createMemoryRateLimiter` all take `() => number`
 * because they do arithmetic, not calendars. Wrapping here means there is still exactly one
 * injected clock per container — two separately-registered time sources could disagree, and
 * a test that froze one and not the other would fail in a way nobody enjoys debugging.
 */
export function epochMillis(clock: Clock): EpochClock {
 return () => clock().getTime();
}
