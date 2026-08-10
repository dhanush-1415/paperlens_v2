import { appConfig, isDevelopment } from '@/config';
import { createConsoleTransport, createLogger } from '@/core/logging';
import { createLoggerErrorReporter } from '@/core/monitoring';
import { systemClock } from '@/core/time';

/**
 * Client instrumentation (requirements 5, 17, 28).
 *
 * Runs after the HTML document loads and **before React hydrates** — which is precisely why
 * it exists. Anything that fails between those two moments happens with no error boundary
 * mounted, no provider tree, and no container: a chunk that 404s after a deploy, a script
 * blocked by an extension, a hydration mismatch that throws. Those failures are invisible to
 * `error.tsx`, and this file is the only thing watching for them.
 *
 * The module has no required exports. Code at module scope simply runs.
 *
 * ### Why it does not use the DI container
 *
 * This is a deliberate, documented exception to "resolve everything from the container", and
 * it rests on two facts:
 *
 * 1. **The container does not exist yet.** `app/providers.tsx` builds it during React's first
 * render, which has not happened. A file whose job is to catch pre-hydration failures
 * cannot depend on something that only exists post-hydration.
 * 2. **Next warns when this file takes longer than 16ms.** Importing the composition root
 * would pull the HTTP client, the flag service, the analytics facade and their transitive
 * graph into the critical path, to log an error that may never occur.
 *
 * So it builds its own logger from the same factory the container uses. That is a second
 * *instance*, not a second owner — `core/logging` still defines what a log record is, how it
 * is redacted and where it goes. Reporting from here is intentionally not deduplicated
 * against `app/error.tsx`: the two catch disjoint sets of failures.
 */

const logger = createLogger({
 scope: 'client.instrumentation',
 level: isDevelopment ? 'debug' : 'warn',
 transports: [createConsoleTransport({ colour: false })],
 bindings: { environment: appConfig.environment, commit: appConfig.commitSha, phase: 'pre-hydration' },
 now: systemClock,
});

const reporter = createLoggerErrorReporter(logger);

/**
 * Every listener is individually guarded.
 *
 * If one tracker throws during setup, the others must still be installed — an unguarded
 * initialiser is how a single analytics failure takes out crash reporting, which is the one
 * thing that would have told you about it.
 */
function safely(label: string, install: () => void): void {
 try {
 install();
 } catch (error) {
 logger.warn(`Instrumentation "${label}" failed to install`, { error: String(error) });
 }
}

safely('window.error', () => {
 /**
 * Errors React never sees.
 *
 * Error boundaries catch failures during *render*. A throw inside a `click` handler, a
 * `setTimeout`, or a promise chain unwinds to the global handler instead — which is why an
 * app with error boundaries on every route can still have an entire class of failures
 * nobody hears about.
 */
 window.addEventListener('error', (event) => {
 reporter.report(event.error ?? event.message, {
 boundary: 'client-runtime',
 route: window.location.pathname,
 extra: { source: event.filename, line: event.lineno, column: event.colno },
 });
 });
});

safely('unhandledrejection', () => {
 window.addEventListener('unhandledrejection', (event) => {
 reporter.report(event.reason, {
 boundary: 'client-runtime',
 route: window.location.pathname,
 extra: { kind: 'unhandled-rejection' },
 });
 });
});

/**
 * Navigation breadcrumbs.
 *
 * Fires as a client-side transition *starts*. Analytics is not reachable from here (the
 * container is not built), and that is the right outcome anyway — page-view tracking is
 * consent-gated and belongs behind the analytics facade. What this adds is a trail entry, so
 * that when an error is reported later the report says which route the user came from.
 *
 * `performance.mark` is the second half: it puts the transition on the browser's own
 * timeline, where it lines up with paint and long-task entries in devtools without any
 * additional tooling.
 */
export function onRouterTransitionStart(
 url: string,
 navigationType: 'push' | 'replace' | 'traverse',
): void {
 reporter.addTrail({
 category: 'navigation',
 message: url,
 level: 'info',
 data: { navigationType, from: window.location.pathname },
 });

 performance.mark(`route:${navigationType}`, { detail: url });
}
