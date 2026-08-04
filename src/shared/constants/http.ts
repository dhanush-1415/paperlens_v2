/**
 * HTTP vocabulary (requirement 19).
 *
 * Header names and status codes are typo-prone in a way the type checker cannot help with:
 * `'x-corelation-id'` compiles, ships, and quietly breaks tracing. Naming them once fixes
 * that, and gives one place to answer "what headers do we speak?".
 */

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

/** Methods safe to retry: no side effects, so a duplicate is harmless. */
export const IDEMPOTENT_METHODS: ReadonlySet<HttpMethod> = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
  'PUT',
  'DELETE',
]);

export const HTTP_HEADERS = {
  accept: 'accept',
  contentType: 'content-type',
  authorization: 'authorization',
  cacheControl: 'cache-control',
  retryAfter: 'retry-after',
  userAgent: 'user-agent',
  /** Ties a client action to its server logs. Generated once per request, propagated down. */
  correlationId: 'x-correlation-id',
  requestId: 'x-request-id',
  /** Deduplicates a retried mutation upstream. */
  idempotencyKey: 'x-idempotency-key',
  tenantId: 'x-tenant-id',
  locale: 'accept-language',
  csrfToken: 'x-csrf-token',
  /** Read for cross-site request rejection. Never trusted for identity. */
  origin: 'origin',
  host: 'host',
  forwardedFor: 'x-forwarded-for',
  /** Set by the proxy so route handlers can read the resolved pathname. */
  pathname: 'x-pathname',
} as const;

export const CONTENT_TYPES = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data',
  text: 'text/plain',
  pdf: 'application/pdf',
  octetStream: 'application/octet-stream',
} as const;

export const HTTP_STATUS = {
  ok: 200,
  created: 201,
  accepted: 202,
  noContent: 204,
  notModified: 304,
  badRequest: 400,
  unauthorized: 401,
  paymentRequired: 402,
  forbidden: 403,
  notFound: 404,
  methodNotAllowed: 405,
  conflict: 409,
  gone: 410,
  payloadTooLarge: 413,
  unsupportedMediaType: 415,
  unprocessableEntity: 422,
  tooManyRequests: 429,
  internalServerError: 500,
  notImplemented: 501,
  badGateway: 502,
  serviceUnavailable: 503,
  gatewayTimeout: 504,
} as const;

/**
 * Statuses worth retrying.
 *
 * 408, 429 and the 5xx family are transient by definition. 4xx otherwise means the request
 * itself is wrong, and retrying it just sends the same wrong request again — the classic
 * way a client turns its own bug into an outage for the upstream.
 */
export const RETRYABLE_STATUS: ReadonlySet<number> = new Set([
  408,
  425,
  429,
  HTTP_STATUS.internalServerError,
  HTTP_STATUS.badGateway,
  HTTP_STATUS.serviceUnavailable,
  HTTP_STATUS.gatewayTimeout,
]);
