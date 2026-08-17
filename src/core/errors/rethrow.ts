import { unstable_rethrow } from 'next/navigation';

/**
 * Framework control-flow guard.
 *
 * `redirect()`, `permanentRedirect()`, `notFound()`, `unauthorized()` and `forbidden()`
 * work by throwing. A `catch` that swallows those turns a redirect into a silent no-op
 * and a 404 into a blank page — a bug that never surfaces in tests because nothing
 * *errors*, it just quietly does the wrong thing.
 *
 * Under `cacheComponents`, request APIs (`cookies()`, `headers()`, `searchParams`) also
 * throw to signal that a segment must render dynamically. Catching those breaks
 * prerendering in ways that only appear in a production build.
 *
 * Rule: every `catch` in this codebase starts with this call, or with `normalizeError`,
 * which calls it for you.
 *
 * Wrapped here rather than imported directly so the `unstable_` prefix has exactly one
 * occurrence to update when the API stabilizes.
 */
export function rethrowIfFrameworkError(error: unknown): void {
  unstable_rethrow(error);
}
