export {
  ERROR_CATEGORIES,
  ERROR_CODES,
  getErrorDefinition,
  isErrorCode,
  type ErrorCategory,
  type ErrorCode,
  type ErrorDefinition,
  type ErrorSeverity,
} from './codes';

export {
  AppError,
  configurationError,
  forbiddenError,
  internalError,
  isAppError,
  isSerializedAppError,
  notFoundError,
  rateLimitError,
  timeoutError,
  unauthenticatedError,
  upstreamError,
  validationError,
  type AppErrorOptions,
  type SerializedAppError,
} from './app-error';

export { normalizeError, toFieldErrors } from './normalize';
export { rethrowIfFrameworkError } from './rethrow';

export {
  attempt,
  attemptSync,
  handleError,
  withActionErrors,
  withRouteErrors,
  type ActionResult,
  type BoundaryDeps,
} from './boundaries';
