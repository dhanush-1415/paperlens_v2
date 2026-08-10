import type { Logger } from '../logging/types';
import type { ErrorBoundaryKind, ErrorReporter } from '../monitoring/types';
import { err, ok, type Result } from '../result/result';

import type { AppError, SerializedAppError } from './app-error';
import { normalizeError } from './normalize';

/**
 * Boundary wrappers (requirements 4 and 5).
 *
 * Three things must happen at every server entry point, in this order, every time:
 * rethrow framework control flow, normalize the failure, then log and report it once. Doing
 * that by hand in each Server Action is how you end up with twelve slightly different
 * `catch` blocks and one that swallows a redirect.
 *
 * Dependencies arrive as arguments rather than being resolved from the container inside, so
 * these stay pure functions that a test can exercise with a memory logger and no bootstrap.
 * The composition root binds them once and exports the bound versions.
 */

export interface BoundaryDeps {
 readonly logger: Logger;
 readonly reporter: ErrorReporter;
 /**
 * Turns a message key into text, for the one boundary whose output a human reads.
 *
 * A `SerializedAppError` carries keys, not sentences — that is what keeps the error
 * envelope translatable and what stops copy from being written inside a `throw`. But a
 * Server Action's `Result` is rendered directly by a form, and a Client Component cannot
 * hold a dictionary without shipping every string in it to the browser. So the key becomes
 * text here, at the last point that is still on the server and still knows the request's
 * locale.
 *
 * Optional, and deliberately absent from `withRouteErrors`: a JSON API's consumer wants the
 * stable key, not this server's guess at its language.
 */
 readonly translate?: (key: string) => string;
}

/**
 * Resolve every message key in a serialized error, leaving the codes alone.
 *
 * Field errors are translated too. They are the errors a user actually sees most often —
 * `validation.document.tooShort` rendered under an input is the single most common way a
 * half-wired i18n layer becomes visible in production.
 */
function localize(error: SerializedAppError, translate: (key: string) => string) {
 const fieldErrors = error.fieldErrors
 ? Object.fromEntries(
 Object.entries(error.fieldErrors).map(([field, messages]) => [
 field,
 messages.map(translate),
 ]),
 )
 : undefined;

 return {
 ...error,
 messageKey: translate(error.messageKey),
 ...(fieldErrors ? { fieldErrors } : {}),
 };
}

interface BoundaryOptions {
 /** Appears in the log line and the report. Use the action or route name. */
 readonly operation: string;
 readonly boundary: ErrorBoundaryKind;
}

/**
 * The single handling step: normalize, log at the severity the error declares, report if
 * the error registry says it is worth reporting.
 *
 * `report` is a property of the error *code*, not a decision at the call site — that is why
 * a 404 does not page anyone and a `CONFIGURATION_ERROR` does.
 */
export function handleError(
 error: unknown,
 { operation, boundary }: BoundaryOptions,
 { logger, reporter }: BoundaryDeps,
): AppError {
 const appError = normalizeError(error);

 const context = { operation, boundary, code: appError.code, category: appError.category };

 if (appError.severity === 'fatal' || appError.severity === 'error') {
 logger.error(`${operation} failed`, appError, context);
 } else if (appError.severity === 'warn') {
 logger.warn(`${operation} failed`, context);
 } else {
 logger.info(`${operation} failed`, context);
 }

 if (appError.report) {
 reporter.report(appError, {
 boundary,
 severity: appError.severity,
 ...(appError.correlationId ? { correlationId: appError.correlationId } : {}),
 tags: { code: appError.code, operation },
 });
 }

 return appError;
}

/** What a wrapped Server Action returns. Serializable by construction. */
export type ActionResult<T> = Result<T, SerializedAppError>;

/**
 * Wrap a Server Action.
 *
 * Returns `Result` rather than throwing, because a thrown error in an action reaches the
 * client as an opaque digest with no field errors and no message — useless for a form.
 * `AppError.toClient()` strips everything an attacker could learn from, so what crosses the
 * wire is a code, a message *key*, and field errors.
 *
 * ```ts
 * export const submitDocument = withActionErrors('document.submit', async (input) => { … })
 * ```
 */
export function withActionErrors<TArgs extends unknown[], TResult>(
 operation: string,
 action: (...args: TArgs) => Promise<TResult>,
 deps: BoundaryDeps,
): (...args: TArgs) => Promise<ActionResult<TResult>> {
 return async (...args: TArgs): Promise<ActionResult<TResult>> => {
 try {
 return ok(await action(...args));
 } catch (error) {
 // normalizeError rethrows redirect()/notFound()/dynamic-render signals first, so a
 // `redirect()` inside an action still redirects instead of becoming an `err`.
 const serialized = handleError(error, { operation, boundary: 'server-action' }, deps)
 .toClient();

 return err(deps.translate ? localize(serialized, deps.translate) : serialized);
 }
 };
}

/**
 * Wrap a Route Handler.
 *
 * Throwing is *correct* here — the framework turns it into a 500 — but the response body
 * would then be Next's, not ours. This produces the application's own error envelope with
 * the status the error code declares, plus `Retry-After` when the error carries one.
 */
export function withRouteErrors<TArgs extends unknown[]>(
 operation: string,
 handler: (...args: TArgs) => Promise<Response>,
 deps: BoundaryDeps,
): (...args: TArgs) => Promise<Response> {
 return async (...args: TArgs): Promise<Response> => {
 try {
 return await handler(...args);
 } catch (error) {
 const appError = handleError(error, { operation, boundary: 'route-handler' }, deps);

 const headers = new Headers({ 'content-type': 'application/json' });
 if (appError.retryAfterSeconds !== undefined) {
 headers.set('retry-after', String(appError.retryAfterSeconds));
 }

 return new Response(JSON.stringify({ error: appError.toClient() }), {
 status: appError.status,
 headers,
 });
 }
 };
}

/**
 * Run a fallible operation and get a `Result` instead of an exception.
 *
 * This is the data-path counterpart to the wrappers above: repositories and use cases use
 * it so that an expected failure (upstream 503, validation) is a value the caller must
 * handle, visible in the type, rather than an exception that may or may not be caught.
 */
export async function attempt<T>(operation: () => Promise<T>): Promise<Result<T, AppError>> {
 try {
 return ok(await operation());
 } catch (error) {
 return err(normalizeError(error));
 }
}

/** Synchronous `attempt`. */
export function attemptSync<T>(operation: () => T): Result<T, AppError> {
 try {
 return ok(operation());
 } catch (error) {
 return err(normalizeError(error));
 }
}
