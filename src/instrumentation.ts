import type { Instrumentation } from 'next';

import { runtime } from '@/config/runtime';

/**
 * Server instrumentation — the global error funnel (requirements 5, 6, 17).
 *
 * Two hooks, one job each.
 *
 * ### `register()`
 *
 * Called **once per server instance**, and guaranteed to complete before the server handles
 * its first request. That guarantee is what makes it the right place to force the container
 * to exist: environment validation, service registration and any flag whose default is
 * wrong all fail here, at boot, rather than inside a user's request at 3am.
 *
 * ### `onRequestError()`
 *
 * The catch-all for every server-side failure — a Server Component that throws, a Server
 * Action, a Route Handler, the proxy. It fires *in addition to* `error.tsx`, not instead of
 * it: the boundary renders the UI, this reports the incident. Without it, an error caught by
 * a boundary would be shown to the user and never recorded.
 *
 * ### Why the container is imported dynamically
 *
 * `@/server/bootstrap` pulls in `core/logging/context`, which imports `node:async_hooks`.
 * That module does not exist in the edge runtime, and a static import would make this file
 * fail to compile for an edge deployment. The dynamic import inside a runtime check keeps
 * one instrumentation file working on both.
 *
 * `process.env.NEXT_RUNTIME` is the documented way to detect the runtime, but ESLint confines
 * `process.env` to `src/config/` — so the check reads `runtime`, which is that variable,
 * parsed once, in the one module allowed to touch it.
 */

export async function register(): Promise<void> {
 if (runtime !== 'nodejs') return;

 const { bootstrapServer } = await import('@/server/bootstrap');
 bootstrapServer();
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
 if (runtime !== 'nodejs') return;

 const { getServerContainer } = await import('@/server/bootstrap');
 const { ERROR_REPORTER, LOGGER } = await import('@/core/container');
 const { normalizeError } = await import('@/core/errors');
 const { HTTP_HEADERS } = await import('@/shared/constants');

 const container = getServerContainer();
 const appError = normalizeError(error);

 /**
 * The correlation ID minted by the proxy, so this report joins the same trace as every
 * log line the request produced. Read from the request headers rather than from
 * `AsyncLocalStorage`: this hook runs after the request context has been torn down.
 */
 const correlation =
 (request.headers as Record<string, string | undefined>)[HTTP_HEADERS.correlationId] ??
 appError.correlationId;

 /**
 * `routeType` maps onto the reporter's boundary vocabulary. Worth keeping distinct rather
 * than collapsing to "server": a spike in `action` failures is a broken mutation, a spike
 * in `render` is a broken page, and they page different people.
 */
 const boundary =
 context.routeType === 'action'
 ? 'server-action'
 : context.routeType === 'route'
 ? 'route-handler'
 : 'server-request';

 container.resolve(LOGGER).child('instrumentation').error('Unhandled server error', error, {
 route: context.routePath,
 routeType: context.routeType,
 routerKind: context.routerKind,
 renderSource: context.renderSource,
 revalidateReason: context.revalidateReason,
 method: request.method,
 path: request.path,
 correlationId: correlation,
 });

 container.resolve(ERROR_REPORTER).report(error, {
 boundary,
 route: context.routePath,
 correlationId: correlation,
 severity: appError.severity,
 /**
 * React may wrap or replace the thrown value before it reaches here, so the object is
 * not necessarily the one the application threw — Next's docs say so explicitly and
 * point at `digest` as the stable identifier. It is what `error.tsx` and
 * `global-error.tsx` show the user, which makes it the join key between a screenshot
 * and a log line.
 */
 digest: typeof error === 'object' && error !== null && 'digest' in error
 ? String((error as { digest?: unknown }).digest)
 : undefined,
 tags: { method: request.method, routeType: context.routeType },
 });
};
