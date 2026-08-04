import 'server-only';

import { cache } from 'react';

import type { Container } from './container';

/**
 * Per-request container scope.
 *
 * React's `cache()` memoizes per server request, which is exactly the lifetime a request
 * scope needs — and it costs nothing to maintain, unlike an `AsyncLocalStorage` scope that
 * has to be entered and exited by hand at every entry point.
 *
 * Caveat worth knowing: `cache()` is *isolated* inside a `use cache` scope. A cached
 * function that called `getRequestScope()` would get a fresh, empty scope rather than the
 * request's. That is not a bug to work around — a `use cache` function cannot read
 * `cookies()` or `headers()` either, so it has no business holding request-scoped state.
 * Cached data sources take their inputs as arguments; that is the whole contract.
 */
export function createRequestScopeAccessor(resolveRoot: () => Container): () => Container {
  /**
   * The root is passed as a thunk, not a value. A `Container` argument would have to be
   * built at module-evaluation time by whichever module calls this — defeating the lazy
   * singleton the composition root goes to some trouble to be, and validating the
   * environment during the build rather than at boot.
   */
  return cache(() => resolveRoot().createScope('request'));
}
