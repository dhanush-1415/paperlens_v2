/**
 * Async control-flow primitives.
 *
 * Pure and dependency-free by design — `core/http` composes these into its retry policy
 * rather than reimplementing them, and a test can exercise the backoff maths without a
 * network stack.
 */

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason as Error);
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      clearTimeout(timer);
      reject(signal?.reason as Error);
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface BackoffOptions {
  /** Delay before the first retry. Subsequent delays double. */
  baseMs?: number;
  /** Ceiling, so attempt 8 does not wait four minutes. */
  maxMs?: number;
  /**
   * Jitter as a fraction of the computed delay, 0–1.
   *
   * Not optional in spirit: without jitter, every client that failed during an outage
   * retries at the same instant and re-creates the outage the moment the service recovers.
   * This is the thundering-herd problem, and it is the single most common way a retry
   * policy makes an incident worse.
   */
  jitter?: number;
  /** Injected so the backoff curve is testable without stubbing globals. */
  random?: () => number;
}

export function backoffDelay(attempt: number, options: BackoffOptions = {}): number {
  const { baseMs = 300, maxMs = 10_000, jitter = 0.3, random = () => defaultRandom() } = options;

  const exponential = Math.min(baseMs * 2 ** Math.max(0, attempt - 1), maxMs);
  const spread = exponential * jitter;
  return Math.round(exponential - spread / 2 + random() * spread);
}

/**
 * `Math.random` is banned across `src/**`; this is the one sanctioned exception, isolated
 * here and used only for timing jitter — never for anything an attacker could exploit.
 * `crypto` would work too, but a syscall per retry to smear a delay is not a good trade.
 */
function defaultRandom(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (bytes[0] as number) / 0xffffffff;
}

export interface RetryOptions extends BackoffOptions {
  /** Total attempts, including the first. `retries: 3` means at most two retries. */
  attempts?: number;
  /** Return false to stop retrying — a 400 will not become a 200 no matter how often you ask. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}

export async function retry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { attempts = 3, shouldRetry = () => true, onRetry, signal, ...backoff } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !shouldRetry(error, attempt)) break;

      const delayMs = backoffDelay(attempt, backoff);
      onRetry?.(error, attempt, delayMs);
      await sleep(delayMs, signal);
    }
  }

  throw lastError;
}

/**
 * Reject if `promise` has not settled within `ms`.
 *
 * Note this does not *cancel* the underlying work — nothing in JavaScript can, short of an
 * `AbortSignal` the operation itself honours. Prefer `AbortSignal.timeout()` for fetch;
 * this is for operations that take no signal.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error as Error);
      },
    );
  });
}

/**
 * Collapse concurrent identical calls into one in-flight promise.
 *
 * Prevents the "five components mount and each fetches the same thing" stampede. Note this
 * is *request* deduplication, not caching: the entry is dropped as soon as it settles.
 */
export function dedupe<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyOf: (...args: TArgs) => string = (...args) => JSON.stringify(args),
): (...args: TArgs) => Promise<TResult> {
  const inFlight = new Map<string, Promise<TResult>>();

  return (...args: TArgs): Promise<TResult> => {
    const key = keyOf(...args);
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = fn(...args).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}
