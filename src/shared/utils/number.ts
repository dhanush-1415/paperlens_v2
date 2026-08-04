/**
 * Number formatting and arithmetic.
 *
 * Formatting goes through `Intl`, always. Hand-rolled thousands separators are wrong in
 * most of the world (`1.234,56` in Germany, `1,23,456` in India), and this app is built to
 * be localized. Every formatter takes a locale, defaulting to `en`, rather than reading a
 * global — that keeps this module pure and lets a server render a page in a locale that is
 * not the server's own.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Where `value` sits between `min` and `max`, as 0–1. Returns 0 for a zero-width range. */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatNumber(
  value: number,
  locale = 'en',
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** `12345` → `12.3K`. For dashboard counters where the exact figure is noise. */
export function formatCompact(value: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

/**
 * Money, from a minor-unit integer.
 *
 * Takes cents, not dollars, because floating-point currency is a rounding bug on a delay —
 * `0.1 + 0.2 !== 0.3` reaches an invoice eventually. Anything monetary is an integer of the
 * smallest unit everywhere in this codebase, converted only at the point of display.
 */
export function formatMoney(minorUnits: number, currency = 'USD', locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(minorUnits / 100);
}

export function formatPercent(fraction: number, locale = 'en', decimals = 0): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction);
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Human file size. Base 1024, because that is what an OS reports for the same file. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const exponent = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${roundTo(value, exponent === 0 ? 0 : decimals)} ${BYTE_UNITS[exponent]}`;
}

/**
 * Percentage of a quota consumed, as 0–1.
 *
 * `Infinity` is the unmetered sentinel used in `PLANS`, and it must read as 0% used rather
 * than `NaN` — which is what a naive division produces and what then renders as an empty
 * progress bar with no explanation.
 */
export function quotaUsage(used: number, limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return clamp(used / limit, 0, 1);
}

export function isBetween(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
