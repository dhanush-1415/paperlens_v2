import { describe, expect, it } from 'vitest';

import { epochMillis, fixedClock, manualClock, offsetClock, systemClock } from './clock';

/**
 * The clock.
 *
 * Small enough that the tests could look like a formality, except that every timing-sensitive
 * test in the codebase — cache expiry, rate-limit windows, session validity, retry backoff —
 * is only as trustworthy as this file. A `manualClock` that shared a mutable `Date` between
 * reads would make those suites pass for the wrong reason.
 */

describe('systemClock', () => {
 it('returns the current time', () => {
 const before = new Date().getTime();
 const now = systemClock().getTime();

 expect(now).toBeGreaterThanOrEqual(before);
 });

 it('returns a fresh Date on every call', () => {
 const first = systemClock();
 first.setFullYear(1999);

 // `Date` is mutable. A shared instance would let one caller silently rewrite another's
 // timestamp — a bug that only shows up under concurrency.
 expect(systemClock().getFullYear()).not.toBe(1999);
 });
});

describe('fixedClock', () => {
 it('accepts a Date, an ISO string or epoch milliseconds', () => {
 const iso = '2026-01-15T10:30:00.000Z';

 expect(fixedClock(iso)().toISOString()).toBe(iso);
 expect(fixedClock(new Date(iso))().toISOString()).toBe(iso);
 expect(fixedClock(new Date(iso).getTime())().toISOString()).toBe(iso);
 });

 it('is stopped — every read is the same instant', () => {
 const clock = fixedClock('2026-01-15T10:30:00.000Z');

 expect(clock().getTime()).toBe(clock().getTime());
 });

 it('hands out an equal-but-distinct Date, so a mutating caller cannot corrupt it', () => {
 const clock = fixedClock('2026-01-15T10:30:00.000Z');
 const taken = clock();
 taken.setFullYear(1999);

 expect(clock().getFullYear()).toBe(2026);
 });

 it('rejects an invalid instant at construction rather than returning Invalid Date', () => {
 // Failing here names the mistake. Failing later produces `NaN` comparisons that
 // silently evaluate false and make an expiry check permanently pass.
 expect(() => fixedClock('not a date')).toThrow(TypeError);
 });
});

describe('manualClock', () => {
 it('starts at the epoch by default', () => {
 expect(manualClock().now().getTime()).toBe(0);
 });

 it('moves forward by the given amount', () => {
 const clock = manualClock('2026-01-15T10:30:00.000Z');
 clock.advance(60_000);

 expect(clock.now().toISOString()).toBe('2026-01-15T10:31:00.000Z');
 });

 it('accumulates successive advances', () => {
 const clock = manualClock(0);
 clock.advance(1_000);
 clock.advance(500);

 expect(clock.now().getTime()).toBe(1_500);
 });

 it('refuses to run backwards through advance()', () => {
 const clock = manualClock(1_000);

 // Time going backwards is almost always a test that meant `set()`. Silently allowing it
 // would let a rate-limit or expiry test assert something the production clock can never do.
 expect(() => clock.advance(-1)).toThrow(RangeError);
 });

 it('jumps in either direction through set()', () => {
 const clock = manualClock(10_000);
 clock.set(0);

 expect(clock.now().getTime()).toBe(0);
 });

 it('rejects an invalid instant in the constructor and in set()', () => {
 expect(() => manualClock('nope')).toThrow(TypeError);
 expect(() => manualClock(0).set('nope')).toThrow(TypeError);
 });
});

describe('offsetClock', () => {
 it('shifts a base clock forwards and backwards', () => {
 const base = fixedClock('2026-01-15T10:30:00.000Z');

 expect(offsetClock(base, 400)().toISOString()).toBe('2026-01-15T10:30:00.400Z');
 expect(offsetClock(base, -1_000)().toISOString()).toBe('2026-01-15T10:29:59.000Z');
 });

 it('tracks a moving base rather than snapshotting it', () => {
 const clock = manualClock(0);
 const skewed = offsetClock(clock.now, 100);
 clock.advance(1_000);

 expect(skewed().getTime()).toBe(1_100);
 });
});

describe('epochMillis', () => {
 it('adapts a Clock for the APIs that do arithmetic', () => {
 expect(epochMillis(fixedClock(1_700_000_000_000))()).toBe(1_700_000_000_000);
 });

 it('stays consistent with the clock it wraps', () => {
 // The point of wrapping rather than registering a second millisecond clock: two time
 // sources can disagree, and a test that froze one and not the other fails mysteriously.
 const clock = manualClock(0);
 const millis = epochMillis(clock.now);
 clock.advance(5_000);

 expect(millis()).toBe(clock.now().getTime());
 });
});
