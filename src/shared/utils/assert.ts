/**
 * Invariants.
 *
 * These are for *programmer* errors — states that cannot happen if the code is correct.
 * That is a different thing from an expected failure, which is a `Result`. Getting this
 * distinction wrong in either direction is expensive: an invariant used for user input
 * crashes on bad data, and a `Result` used for an impossible state buries a real bug in a
 * branch nobody reads.
 *
 * Deliberately throws a plain `Error` rather than an `AppError`: an invariant violation has
 * no meaningful user-facing message, no HTTP status and no retry story. It is a bug, and it
 * should read like one in the log.
 */

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invariant failed: ${message}`);
}

export function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(
      `Invariant failed: ${message} (received ${value === null ? 'null' : 'undefined'})`,
    );
  }
}

/** Narrow and return in one expression, for use inside an expression position. */
export function required<T>(value: T | null | undefined, message: string): T {
  assertDefined(value, message);
  return value;
}

/**
 * Exhaustiveness check.
 *
 * Put this in the `default` of a switch over a union. Adding a member to the union then
 * becomes a *compile* error at every switch that does not handle it — which is the entire
 * reason the union is typed in the first place.
 *
 * ```ts
 * switch (severity) {
 * case 'low': return …
 * case 'high': return …
 * default: return assertNever(severity)
 * }
 * ```
 */
export function assertNever(value: never, message = 'Unhandled case'): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}
