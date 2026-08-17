/**
 * Function decorators.
 *
 * Kept out of `async.ts` because these are about *rate*, not about failure: they shape how
 * often something runs, and both return a `cancel` so a React effect can clean up. A
 * debounce without a cancel path is a setState-after-unmount warning waiting to happen.
 */

export interface Cancellable {
  cancel(): void;
  flush(): void;
}

/**
 * Run `fn` only after `waitMs` has passed with no further calls.
 *
 * For search-as-you-type: the user pauses, then one request goes out. `TIMING.searchDebounceMs`
 * is the shared value — do not invent a new one per input.
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  waitMs: number,
): ((...args: TArgs) => void) & Cancellable {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: TArgs | undefined;

  const debounced = (...args: TArgs): void => {
    pending = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      const call = pending;
      pending = undefined;
      if (call) fn(...call);
    }, waitMs);
  };

  debounced.cancel = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  debounced.flush = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const call = pending;
    pending = undefined;
    if (call) fn(...call);
  };

  return debounced;
}

/**
 * Run `fn` at most once per `intervalMs`, leading edge.
 *
 * For scroll and resize handlers, where debounce would mean nothing happens until the user
 * stops — which is the opposite of what a sticky header needs.
 */
export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  intervalMs: number,
): ((...args: TArgs) => void) & Cancellable {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: TArgs | undefined;

  const invoke = (args: TArgs, at: number): void => {
    lastRun = at;
    fn(...args);
  };

  const throttled = (...args: TArgs): void => {
    const now = performance.now();
    const elapsed = now - lastRun;

    if (elapsed >= intervalMs) {
      invoke(args, now);
      return;
    }

    // Trailing call, so the final position after a fast scroll is not dropped.
    pending = args;
    if (timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      const call = pending;
      pending = undefined;
      if (call) invoke(call, performance.now());
    }, intervalMs - elapsed);
  };

  throttled.cancel = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  throttled.flush = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const call = pending;
    pending = undefined;
    if (call) invoke(call, performance.now());
  };

  return throttled;
}

/** Run at most once, ever. Returns the first result on every subsequent call. */
export function once<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  let called = false;
  let result: TResult;

  return (...args: TArgs): TResult => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

/** The identity function. Useful as a default transform. */
export function identity<T>(value: T): T {
  return value;
}

/** An explicit no-op, so an empty arrow does not read like a mistake. */
export function noop(): void {}
