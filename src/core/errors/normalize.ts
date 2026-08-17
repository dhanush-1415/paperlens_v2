import { z } from 'zod';

import { encodeMessageRef } from '@/shared/utils/string';

import { AppError, isAppError, isSerializedAppError, validationError } from './app-error';
import { isErrorCode } from './codes';
import { rethrowIfFrameworkError } from './rethrow';

/**
 * The single funnel every failure passes through.
 *
 * `catch (e)` gives you `unknown`, and in practice that `unknown` is one of about six
 * things. Normalising them in one place means the rest of the codebase only ever handles
 * `AppError`, and no boundary has to re-guess what a rejected fetch or a Zod failure means.
 *
 * Calls `rethrowIfFrameworkError` first, so using this instead of a bare `catch` makes it
 * structurally impossible to swallow a `redirect()`.
 */
export function normalizeError(error: unknown): AppError {
  rethrowIfFrameworkError(error);

  if (isAppError(error)) return error;

  // An AppError that has crossed a serialization boundary and lost its prototype.
  if (isSerializedAppError(error)) {
    const code = isErrorCode(error.code) ? error.code : 'INTERNAL_ERROR';
    return new AppError(code, {
      message: `Deserialized: ${error.code}`,
      ...(error.correlationId ? { correlationId: error.correlationId } : {}),
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      ...(error.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: error.retryAfterSeconds }
        : {}),
    });
  }

  if (error instanceof z.ZodError) {
    return validationError(toFieldErrors(error), { cause: error });
  }

  // Both names, and by name rather than by `instanceof`.
  //
  // Two separate traps. First, `controller.abort()` produces an `AbortError` but
  // `AbortSignal.timeout()` — which is how the HTTP client enforces its own budget —
  // produces a `TimeoutError`; matching only the first classifies every timed-out request as
  // `INTERNAL_ERROR`, which is neither retryable nor honest to whoever reads the crash
  // report. Second, `instanceof DOMException` is a *realm* check: the exception undici
  // attaches to an aborted signal is constructed in a different realm from the ambient
  // `DOMException` binding, so the test is false even though the constructor's name is
  // `DOMException`. Verified — not theoretical. The `name` property is the portable signal.
  if (isErrorNamed(error, 'AbortError') || isErrorNamed(error, 'TimeoutError')) {
    return new AppError('TIMEOUT', { message: 'Request aborted', cause: error });
  }

  if (error instanceof Error) {
    // Node and undici surface a dead connection as a plain TypeError.
    if (error.name === 'TypeError' && /fetch failed|network|ECONN|ENOTFOUND/i.test(error.message)) {
      return new AppError('NETWORK_UNAVAILABLE', { message: error.message, cause: error });
    }
    return new AppError('INTERNAL_ERROR', { message: error.message, cause: error });
  }

  return new AppError('INTERNAL_ERROR', {
    message: `Non-Error thrown: ${safeStringify(error)}`,
    cause: error,
  });
}

/**
 * Match an error by its `name` rather than its constructor.
 *
 * Every `instanceof` in this file is a bet that the value was constructed in the same realm
 * as the class we are comparing against. For errors that cross a runtime boundary — an abort
 * reason from undici, anything thrown inside a worker — that bet loses silently and the error
 * falls through to `INTERNAL_ERROR`. Where the name is part of the platform contract, use it.
 */
function isErrorNamed(error: unknown, name: string): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === name;
}

/**
 * Flatten Zod issues into `{ 'document.text': ['validation.document.tooShort?min=200'] }`.
 *
 * The dotted path is what `useActionState` consumers and the `FormField` component both
 * key off, so field errors survive the round trip from server action to input.
 *
 * The value is a message *ref*, not a sentence: the key the schema declared, plus whichever
 * bound the issue violated. `'Must be at least {min} characters.'` needs a number that only
 * the schema knows, and `.min(200, { message: 'validation.tooShort' })` cannot put it in the
 * message without hard-coding English into a Zod call. The issue carries it, so it is read
 * from there — see `encodeMessageRef` for why it travels as part of the string.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_form';
    (fieldErrors[path] ??= []).push(encodeMessageRef(issue.message, issueParams(issue)));
  }

  return fieldErrors;
}

/**
 * The numbers a bound-violation issue carries, named as the dictionary names them.
 *
 * Only length and range bounds have parameters worth surfacing; a failed regex or a bad
 * enum value has nothing a user could act on beyond the message itself. `minimum` and
 * `maximum` are `number | bigint` in Zod 4 — coerced, because a `bigint` stringifies with an
 * `n` suffix and "at least 200n characters" is not a sentence.
 */
function issueParams(issue: z.core.$ZodIssue): Record<string, number> | undefined {
  if (issue.code === 'too_small') return { min: Number(issue.minimum) };
  if (issue.code === 'too_big') return { max: Number(issue.maximum) };
  return undefined;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
