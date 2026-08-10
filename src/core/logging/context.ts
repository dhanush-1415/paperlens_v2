import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request ambient context.
 *
 * A correlation ID is only useful if it appears on *every* line a request produces —
 * including lines written six layers down in a repository that has no idea a request
 * exists. Threading it through every signature would poison every interface in the
 * codebase, so it lives in `AsyncLocalStorage` instead.
 *
 * `server-only` is load-bearing: `AsyncLocalStorage` does not exist in the browser, and
 * importing this from a client component must fail at build time, not at runtime.
 *
 * Next runs `proxy.ts` and route handlers on the Node.js runtime in v16, so this is
 * available across the whole server request path.
 */
export interface RequestContext {
 /** Propagated from the `x-correlation-id` request header, or minted by the proxy. */
 readonly correlationId: string;
 readonly requestId?: string;
 readonly userId?: string;
 readonly sessionId?: string;
 readonly route?: string;
 readonly locale?: string;
 readonly tenantId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run `fn` with `context` visible to everything it awaits, however deep. */
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
 return storage.run(context, fn);
}

/** The active context, or `undefined` outside a request (build, instrumentation, scripts). */
export function getRequestContext(): RequestContext | undefined {
 return storage.getStore();
}

/**
 * Shallow-merge fields into the active context.
 *
 * Used once the session is resolved, to attach `userId` to lines written later in the
 * same request. Silently does nothing outside a request rather than throwing — enriching
 * a log is never worth failing a request over.
 */
export function enrichRequestContext(fields: Partial<RequestContext>): void {
 const current = storage.getStore();
 if (!current) return;
 Object.assign(current, fields);
}

/** The shape `LoggerOptions.context` expects. Bound in the server composition root. */
export function requestContextResolver(): Record<string, unknown> {
 const current = storage.getStore();
 if (!current) return {};
 return { ...current };
}
