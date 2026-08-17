/**
 * The error registry — every failure this application can name, in one table.
 *
 * Adding a code here is the only way to introduce a new failure mode. Each entry fixes,
 * in one place and forever:
 *
 * - `category` how the app groups it (drives which boundary handles it)
 * - `status` the HTTP status it maps to, so route handlers never guess
 * - `severity` the log level it is recorded at
 * - `retryable` whether retrying the same call could plausibly succeed
 * - `report` whether it reaches the crash reporter (expected failures must not)
 * - `messageKey` the i18n key for the message shown to a human
 *
 * Nothing else in the codebase decides any of these. Change the table, and the status
 * code, the log level, the alerting and the copy all move together.
 */

export const ERROR_CATEGORIES = [
  'validation',
  'authentication',
  'authorization',
  'not_found',
  'conflict',
  'rate_limit',
  'timeout',
  'network',
  'integration',
  'business',
  'internal',
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

export type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ErrorDefinition {
  readonly category: ErrorCategory;
  readonly status: number;
  readonly severity: ErrorSeverity;
  readonly retryable: boolean;
  readonly report: boolean;
  readonly messageKey: string;
}

export const ERROR_CODES = {
  // --- Validation -----------------------------------------------------------
  VALIDATION_FAILED: {
    category: 'validation',
    status: 422,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.validationFailed',
  },
  MALFORMED_REQUEST: {
    category: 'validation',
    status: 400,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.malformedRequest',
  },
  UNSUPPORTED_FILE_TYPE: {
    category: 'validation',
    status: 415,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.unsupportedFileType',
  },
  PAYLOAD_TOO_LARGE: {
    category: 'validation',
    status: 413,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.payloadTooLarge',
  },

  // --- Authentication -------------------------------------------------------
  UNAUTHENTICATED: {
    category: 'authentication',
    status: 401,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.unauthenticated',
  },
  SESSION_EXPIRED: {
    category: 'authentication',
    status: 401,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.sessionExpired',
  },
  INVALID_CREDENTIALS: {
    category: 'authentication',
    status: 401,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.invalidCredentials',
  },

  // --- Authorization --------------------------------------------------------
  FORBIDDEN: {
    category: 'authorization',
    status: 403,
    severity: 'warn',
    retryable: false,
    report: false,
    messageKey: 'errors.forbidden',
  },
  PLAN_LIMIT_REACHED: {
    category: 'authorization',
    status: 403,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.planLimitReached',
  },

  // --- Not found ------------------------------------------------------------
  NOT_FOUND: {
    category: 'not_found',
    status: 404,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.notFound',
  },

  // --- Conflict -------------------------------------------------------------
  CONFLICT: {
    category: 'conflict',
    status: 409,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.conflict',
  },
  ALREADY_EXISTS: {
    category: 'conflict',
    status: 409,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.alreadyExists',
  },

  // --- Throttling -----------------------------------------------------------
  RATE_LIMITED: {
    category: 'rate_limit',
    status: 429,
    severity: 'warn',
    retryable: true,
    report: false,
    messageKey: 'errors.rateLimited',
  },

  // --- Transport ------------------------------------------------------------
  TIMEOUT: {
    category: 'timeout',
    status: 504,
    severity: 'warn',
    retryable: true,
    report: true,
    messageKey: 'errors.timeout',
  },
  NETWORK_UNAVAILABLE: {
    category: 'network',
    status: 503,
    severity: 'warn',
    retryable: true,
    report: false,
    messageKey: 'errors.networkUnavailable',
  },
  OFFLINE: {
    category: 'network',
    status: 503,
    severity: 'info',
    retryable: true,
    report: false,
    messageKey: 'errors.offline',
  },

  // --- Upstream integrations ------------------------------------------------
  UPSTREAM_ERROR: {
    category: 'integration',
    status: 502,
    severity: 'error',
    retryable: true,
    report: true,
    messageKey: 'errors.upstreamError',
  },
  UPSTREAM_CONTRACT_VIOLATION: {
    category: 'integration',
    status: 502,
    severity: 'error',
    retryable: false,
    report: true,
    messageKey: 'errors.upstreamError',
  },
  SERVICE_UNAVAILABLE: {
    category: 'integration',
    status: 503,
    severity: 'error',
    retryable: true,
    report: true,
    messageKey: 'errors.serviceUnavailable',
  },

  // --- Business rules -------------------------------------------------------
  DOCUMENT_UNREADABLE: {
    category: 'business',
    status: 422,
    severity: 'info',
    retryable: false,
    report: false,
    messageKey: 'errors.documentUnreadable',
  },
  ANALYSIS_FAILED: {
    category: 'business',
    status: 422,
    severity: 'warn',
    retryable: true,
    report: true,
    messageKey: 'errors.analysisFailed',
  },

  // --- Internal -------------------------------------------------------------
  INTERNAL_ERROR: {
    category: 'internal',
    status: 500,
    severity: 'error',
    retryable: false,
    report: true,
    messageKey: 'errors.internal',
  },
  CONFIGURATION_ERROR: {
    category: 'internal',
    status: 500,
    severity: 'fatal',
    retryable: false,
    report: true,
    messageKey: 'errors.internal',
  },
  NOT_IMPLEMENTED: {
    category: 'internal',
    status: 501,
    severity: 'error',
    retryable: false,
    report: true,
    messageKey: 'errors.internal',
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof ERROR_CODES;

export function getErrorDefinition(code: ErrorCode): ErrorDefinition {
  return ERROR_CODES[code];
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && value in ERROR_CODES;
}
