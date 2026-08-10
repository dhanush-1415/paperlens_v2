/**
 * Date formatting.
 *
 * Two rules, both learned the expensive way.
 *
 * First, every formatter takes an explicit `now`. A function that reads the clock internally
 * cannot be tested without freezing time globally, and — worse under RSC — it renders a
 * different string on the server than on the client, which is a hydration mismatch that
 * appears as a console warning and a flash of replaced text.
 *
 * Second, dates cross the wire as ISO 8601 strings, never as `Date` objects. `Date` is not
 * serializable across the RSC boundary; it arrives as a string anyway, just with the type
 * system no longer telling you so.
 */

export type DateInput = Date | string | number;

export function toDate(value: DateInput): Date {
 return value instanceof Date ? value : new Date(value);
}

export function isValidDate(value: DateInput): boolean {
 return !Number.isNaN(toDate(value).getTime());
}

/** The wire format. Always UTC, always unambiguous. */
export function toIso(value: DateInput): string {
 return toDate(value).toISOString();
}

export function formatDate(
 value: DateInput,
 locale = 'en',
 options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
 return new Intl.DateTimeFormat(locale, options).format(toDate(value));
}

export function formatDateTime(value: DateInput, locale = 'en'): string {
 return new Intl.DateTimeFormat(locale, {
 dateStyle: 'medium',
 timeStyle: 'short',
 }).format(toDate(value));
}

const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
 ['year', 31_536_000_000],
 ['month', 2_592_000_000],
 ['week', 604_800_000],
 ['day', 86_400_000],
 ['hour', 3_600_000],
 ['minute', 60_000],
 ['second', 1_000],
];

/**
 * "3 days ago" / "in 2 hours", localized.
 *
 * `now` is required — see the note at the top of the file. Callers on the client pass
 * `Date.now()`; server-rendered relative times should generally be avoided entirely, since
 * they are stale the moment they are cached.
 */
export function formatRelative(value: DateInput, now: DateInput, locale = 'en'): string {
 const deltaMs = toDate(value).getTime() - toDate(now).getTime();
 const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

 for (const [unit, unitMs] of RELATIVE_UNITS) {
 if (Math.abs(deltaMs) >= unitMs || unit === 'second') {
 return formatter.format(Math.round(deltaMs / unitMs), unit);
 }
 }
 return formatter.format(0, 'second');
}

export function addDays(value: DateInput, days: number): Date {
 const date = toDate(value);
 return new Date(date.getTime() + days * 86_400_000);
}

export function addSeconds(value: DateInput, seconds: number): Date {
 return new Date(toDate(value).getTime() + seconds * 1_000);
}

export function isPast(value: DateInput, now: DateInput): boolean {
 return toDate(value).getTime() < toDate(now).getTime();
}

export function daysBetween(from: DateInput, to: DateInput): number {
 return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
}

/** `startOfDay` in UTC. Deliberately not local — used for bucketing usage by day. */
export function startOfUtcDay(value: DateInput): Date {
 const date = toDate(value);
 return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** `YYYY-MM` in UTC. The key monthly quotas are counted against. */
export function utcMonthKey(value: DateInput): string {
 const date = toDate(value);
 return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
