/**
 * Utilities — public API (requirement 21).
 *
 * Everything here is a **pure function**. ESLint enforces it: this directory may not import
 * `react`, `next`, `@/core/**` or `@/shared/ui/**`.
 *
 * The constraint is what keeps this folder from becoming the junk drawer every codebase
 * eventually grows. A "utility" that reaches for the current user, the router or a logger is
 * not a utility — it is a service that has not been given a home yet, and it belongs in
 * `core/` behind a port. The lint rule makes that decision for you at the moment you write
 * the import, which is the only moment anyone is thinking about it.
 */

/**
 * `cn` is not here. It composes Tailwind class names, which makes it a design-system
 * concern rather than a general-purpose one, and the lint rule above is what said so: it
 * needs the token registry from `shared/ui`, and this folder may not import that. It lives
 * at `@/shared/ui/cn`.
 */
export { assert, assertDefined, assertNever, required } from './assert';
export { correlationId, randomToken, slugId, uuid } from './id';

export {
  capitalize,
  initials,
  mask,
  normalizeParagraphs,
  normalizeWhitespace,
  pluralize,
  readingTimeMinutes,
  slugify,
  titleCaseFromKey,
  truncate,
  truncateWords,
} from './string';

export {
  clamp,
  formatBytes,
  formatCompact,
  formatMoney,
  formatNumber,
  formatPercent,
  isBetween,
  normalize,
  quotaUsage,
  roundTo,
} from './number';

export {
  addDays,
  addSeconds,
  daysBetween,
  formatDate,
  formatDateTime,
  formatRelative,
  isPast,
  isValidDate,
  startOfUtcDay,
  toDate,
  toIso,
  utcMonthKey,
  type DateInput,
} from './date';

export {
  chunk,
  compact,
  first,
  groupBy,
  indexBy,
  last,
  partition,
  range,
  sortBy,
  sum,
  toggle,
  unique,
  uniqueBy,
} from './array';

export {
  compactObject,
  deepMerge,
  entriesOf,
  isEmpty,
  isPlainObject,
  keysOf,
  omit,
  pick,
  shallowEqual,
} from './object';

export {
  absoluteUrl,
  buildQueryString,
  displayHost,
  isSafeUrl,
  isSameOrigin,
  joinPath,
  withQuery,
} from './url';

export {
  backoffDelay,
  dedupe,
  retry,
  sleep,
  withTimeout,
  type BackoffOptions,
  type RetryOptions,
} from './async';

export {
  debounce,
  identity,
  noop,
  once,
  throttle,
  type Cancellable,
} from './function';
