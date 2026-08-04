/**
 * Result — failure as a value, not a control-flow jump.
 *
 * Every function that can fail for an *expected* reason returns `Result<T, E>` instead
 * of throwing. The reason is that TypeScript does not type exceptions: a `Promise<User>`
 * signature is a lie if the function can also reject with four different errors, and the
 * compiler will not tell you when you forget one.
 *
 * The rule in this codebase:
 * - Expected failure (not found, invalid input, rate limited, upstream 503) → `Result`.
 * - Programmer error and unrecoverable state (bad config, impossible branch) → throw.
 * - Framework control flow (`redirect()`, `notFound()`, `unauthorized()`) → throw, and
 *   never catch it. See `@/core/errors/rethrow`.
 *
 * `Result` is a discriminated union of plain objects, so it crosses the RSC boundary
 * intact — a class instance would not serialize.
 */

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/** Transform the success value, leaving a failure untouched. */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/** Transform the error, leaving a success untouched. */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

/** Chain another fallible step. The first failure short-circuits the rest. */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

/** Async `andThen`, for chaining awaited steps. */
export async function andThenAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> {
  return result.ok ? fn(result.value) : result;
}

/** Read the value, substituting a default on failure. */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/** Read the value, computing a default from the error on failure. */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.ok ? result.value : fn(result.error);
}

/**
 * Read the value or throw. Use only at a boundary that has already decided the failure
 * is unrecoverable — never as a shortcut to avoid handling the error case.
 */
export function unwrapOrThrow<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}

/** Exhaustively handle both branches. Preferred over `if (result.ok)` chains in UI code. */
export function match<T, E, R>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => R; err: (error: E) => R },
): R {
  return result.ok ? handlers.ok(result.value) : handlers.err(result.error);
}

/**
 * Collect many results into one. Returns the first failure, or all values in order.
 * Use when every part is required; use `partition` when partial success is acceptable.
 */
export function all<T, E>(results: ReadonlyArray<Result<T, E>>): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
}

/** Split results into successes and failures, discarding neither. */
export function partition<T, E>(
  results: ReadonlyArray<Result<T, E>>,
): { values: T[]; errors: E[] } {
  const values: T[] = [];
  const errors: E[] = [];
  for (const result of results) {
    if (result.ok) values.push(result.value);
    else errors.push(result.error);
  }
  return { values, errors };
}
