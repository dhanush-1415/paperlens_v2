/**
 * Constants — public API (requirement 19).
 *
 * Namespaced re-exports rather than a flat spread: `REGEX.SLUG` reads better than a bare
 * `SLUG` at a call site three files away, and a flat barrel of seven modules is a name
 * collision waiting to happen.
 */

export * as REGEX from './regex';

export {
  DEFAULT_AUTHENTICATED_ROUTE,
  DEFAULT_UNAUTHENTICATED_ROUTE,
  ROUTES,
  ROUTE_ACCESS,
  isAuthOnlyPath,
  isProtectedPath,
} from './routes';

export { COOKIE_NAMES, STORAGE_KEYS, type StorageKey } from './storage-keys';

export {
  CONTENT_TYPES,
  HTTP_HEADERS,
  HTTP_METHODS,
  HTTP_STATUS,
  IDEMPOTENT_METHODS,
  RETRYABLE_STATUS,
  type HttpMethod,
} from './http';

export { LIFETIME_SECONDS, MS, SECONDS, TIMING } from './time';

export {
  CAPABILITIES,
  DEFAULT_PLAN,
  INPUT_LIMITS,
  PAGINATION,
  PLANS,
  PLAN_TIERS,
  RATE_LIMITS,
  VAULT_GRACE_PERIOD_DAYS,
  can,
  planOf,
  quotaOf,
  type Capability,
  type PlanDefinition,
  type PlanTier,
  type RateLimitScope,
} from './limits';

export {
  QUERY_PARAMS,
  SORT_ORDERS,
  sanitizeRedirectTo,
  type SortOrder,
} from './query-params';
