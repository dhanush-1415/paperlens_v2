import { ERROR_CODES, type ErrorCategory, type ErrorCode, type ErrorSeverity } from './codes';

/**
 * The only error type this application raises deliberately.
 *
 * Two audiences, never conflated:
 * - `message` is for engineers. It may contain identifiers, upstream detail, anything
 * useful in a log. It is never rendered to a user.
 * - `messageKey` is for humans. It resolves through i18n to copy someone wrote on purpose.
 *
 * Everything else (status, severity, retryability, whether to page someone) is looked up
 * from the registry in `codes.ts` rather than passed in, so two throws of the same code
 * can never disagree.
 */

export interface AppErrorOptions {
  /** Engineer-facing detail. Defaults to the code. Never shown to users. */
  message?: string;
  /** The underlying failure, preserved for the log. */
  cause?: unknown;
  /** Structured detail for the log. Redacted by the logger before it is written. */
  context?: Record<string, unknown>;
  /** Ties this error to one request across proxy, server, logs and the reporter. */
  correlationId?: string;
  /** Field-level messages, keyed by form field path. Only meaningful for validation. */
  fieldErrors?: Record<string, string[]>;
  /** Seconds to wait before retrying. Set by rate limiters and upstream 503s. */
  retryAfterSeconds?: number;
}

/** The wire form of an AppError. Plain data, so it crosses the RSC boundary intact. */
export interface SerializedAppError {
  readonly name: 'AppError';
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly status: number;
  readonly severity: ErrorSeverity;
  readonly retryable: boolean;
  readonly messageKey: string;
  readonly correlationId?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly retryAfterSeconds?: number;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly status: number;
  readonly severity: ErrorSeverity;
  readonly retryable: boolean;
  readonly report: boolean;
  readonly messageKey: string;
  readonly context: Record<string, unknown>;
  readonly correlationId?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly retryAfterSeconds?: number;

  constructor(code: ErrorCode, options: AppErrorOptions = {}) {
    const definition = ERROR_CODES[code];
    super(options.message ?? code, { cause: options.cause });

    this.name = 'AppError';
    this.code = code;
    this.category = definition.category;
    this.status = definition.status;
    this.severity = definition.severity;
    this.retryable = definition.retryable;
    this.report = definition.report;
    this.messageKey = definition.messageKey;
    this.context = options.context ?? {};
    this.correlationId = options.correlationId;
    this.fieldErrors = options.fieldErrors;
    this.retryAfterSeconds = options.retryAfterSeconds;

    // Without this the stack starts at the AppError constructor rather than the throw site.
    if (Error.captureStackTrace) Error.captureStackTrace(this, AppError);
  }

  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  isCategory(category: ErrorCategory): boolean {
    return this.category === category;
  }

  /** A copy with extra log context merged in. Errors themselves stay immutable. */
  withContext(context: Record<string, unknown>): AppError {
    return new AppError(this.code, {
      message: this.message,
      cause: this.cause,
      context: { ...this.context, ...context },
      correlationId: this.correlationId,
      fieldErrors: this.fieldErrors,
      retryAfterSeconds: this.retryAfterSeconds,
    });
  }

  withCorrelationId(correlationId: string): AppError {
    return new AppError(this.code, {
      message: this.message,
      cause: this.cause,
      context: this.context,
      correlationId,
      fieldErrors: this.fieldErrors,
      retryAfterSeconds: this.retryAfterSeconds,
    });
  }

  /**
   * The client-safe projection.
   *
   * Deliberately omits `message`, `context`, `cause` and the stack: those may contain
   * identifiers, upstream payloads or file contents. What crosses the boundary is a code
   * the UI can branch on and a key it can translate.
   */
  toClient(): SerializedAppError {
    return {
      name: 'AppError',
      code: this.code,
      category: this.category,
      status: this.status,
      severity: this.severity,
      retryable: this.retryable,
      messageKey: this.messageKey,
      ...(this.correlationId ? { correlationId: this.correlationId } : {}),
      ...(this.fieldErrors ? { fieldErrors: this.fieldErrors } : {}),
      ...(this.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: this.retryAfterSeconds }
        : {}),
    };
  }

  /** The full log projection. Server-side only — never send this to a client. */
  toLog(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      status: this.status,
      severity: this.severity,
      message: this.message,
      correlationId: this.correlationId,
      context: this.context,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? { name: this.cause.name, message: this.cause.message, stack: this.cause.stack }
          : this.cause,
    };
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * Recognise an AppError that has already crossed a serialization boundary — it arrives
 * as a plain object and `instanceof` no longer holds.
 */
export function isSerializedAppError(value: unknown): value is SerializedAppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { name?: unknown }).name === 'AppError' &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

// ---------------------------------------------------------------------------
// Constructors for the common cases.
//
// These exist so call sites read as intent ("this document does not exist") rather than
// as bookkeeping, and so the matching code is impossible to get wrong.
// ---------------------------------------------------------------------------

export function validationError(
  fieldErrors: Record<string, string[]>,
  options: Omit<AppErrorOptions, 'fieldErrors'> = {},
): AppError {
  return new AppError('VALIDATION_FAILED', {
    message: `Validation failed for: ${Object.keys(fieldErrors).join(', ')}`,
    ...options,
    fieldErrors,
  });
}

export function notFoundError(resource: string, id?: string): AppError {
  return new AppError('NOT_FOUND', {
    message: id ? `${resource} "${id}" not found` : `${resource} not found`,
    context: { resource, ...(id ? { id } : {}) },
  });
}

export function unauthenticatedError(reason?: string): AppError {
  return new AppError('UNAUTHENTICATED', {
    message: reason ?? 'No valid session',
  });
}

export function forbiddenError(permission: string, subjectId?: string): AppError {
  return new AppError('FORBIDDEN', {
    message: `Missing permission "${permission}"`,
    context: { permission, ...(subjectId ? { subjectId } : {}) },
  });
}

export function rateLimitError(retryAfterSeconds: number, scope: string): AppError {
  return new AppError('RATE_LIMITED', {
    message: `Rate limit exceeded for "${scope}"`,
    context: { scope },
    retryAfterSeconds,
  });
}

export function timeoutError(operation: string, timeoutMs: number): AppError {
  return new AppError('TIMEOUT', {
    message: `"${operation}" exceeded ${timeoutMs}ms`,
    context: { operation, timeoutMs },
  });
}

export function upstreamError(service: string, options: AppErrorOptions = {}): AppError {
  return new AppError('UPSTREAM_ERROR', {
    message: `Upstream "${service}" failed`,
    ...options,
    context: { service, ...options.context },
  });
}

export function internalError(message: string, cause?: unknown): AppError {
  return new AppError('INTERNAL_ERROR', { message, cause });
}

export function configurationError(message: string): AppError {
  return new AppError('CONFIGURATION_ERROR', { message });
}
