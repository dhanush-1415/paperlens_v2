import type { Logger } from '../logging/types';

import type { HttpInterceptor } from './types';
import { HTTP_HEADERS } from '@/shared/constants/http';

/**
 * Interceptors (requirement 2).
 *
 * Every cross-cutting concern that used to be copy-pasted into each request — the auth
 * header, the tenant header, the timing log — is a named, ordered, individually testable
 * unit here. Adding one is a line in the composition root, not an edit to every call site.
 *
 * Each takes its dependencies as arguments. None of them reads a global, resolves from the
 * container, or knows what environment it is in.
 */

/**
 * Attach a bearer token.
 *
 * `getToken` is async and called per attempt, not once at construction: a token that
 * expires mid-retry must be refreshed for the retry, and a token captured at client-creation
 * time is stale by definition.
 */
export function bearerAuthInterceptor(
  getToken: () => Promise<string | undefined> | string | undefined,
): HttpInterceptor {
  return {
    name: 'bearer-auth',
    async onRequest(context) {
      const token = await getToken();
      if (token) context.headers.set(HTTP_HEADERS.authorization, `Bearer ${token}`);
    },
  };
}

/** Stamp the tenant on every outbound request, for multi-tenant upstreams. */
export function tenantInterceptor(getTenantId: () => string | undefined): HttpInterceptor {
  return {
    name: 'tenant',
    onRequest(context) {
      const tenantId = getTenantId();
      if (tenantId) context.headers.set(HTTP_HEADERS.tenantId, tenantId);
    },
  };
}

export function localeInterceptor(getLocale: () => string | undefined): HttpInterceptor {
  return {
    name: 'locale',
    onRequest(context) {
      const locale = getLocale();
      if (locale) context.headers.set(HTTP_HEADERS.locale, locale);
    },
  };
}

/**
 * Log every request at debug and every failure at warn.
 *
 * Logs the *operation name and status*, never the body — request bodies here contain
 * document text and personal identifiers. The logger redacts anyway, but not sending it is
 * cheaper and safer than relying on redaction as the only line of defence.
 */
export function loggingInterceptor(logger: Logger): HttpInterceptor {
  const scoped = logger.child('http');

  return {
    name: 'logging',
    onRequest(context) {
      scoped.debug('→ request', {
        method: context.method,
        url: stripQuery(context.url),
        attempt: context.attempt,
        correlationId: context.correlationId,
      });
    },
    onError(error, context) {
      scoped.warn('← failed', {
        method: context.method,
        url: stripQuery(context.url),
        attempt: context.attempt,
        code: error.code,
        correlationId: context.correlationId,
      });
    },
  };
}

/**
 * Emit a warning when a request is slow.
 *
 * A budget crossed is a signal you want *before* the timeout fires — by the time something
 * times out, the user has already left.
 */
export function timingInterceptor(logger: Logger, budgetMs = 2_000): HttpInterceptor {
  const started = new WeakMap<object, number>();
  const scoped = logger.child('http.timing');

  return {
    name: 'timing',
    onRequest(context) {
      started.set(context, performance.now());
    },
    onResponse(response, context) {
      const startedAt = started.get(context);
      if (startedAt === undefined) return;

      const durationMs = Math.round(performance.now() - startedAt);
      if (durationMs > budgetMs) {
        scoped.warn('slow request', {
          url: stripQuery(context.url),
          durationMs,
          budgetMs,
          status: response.status,
          correlationId: context.correlationId,
        });
      }
    },
  };
}

/**
 * Attach a CSRF token to state-changing requests.
 *
 * Server Actions have their own protection built into the framework; this is for route
 * handlers, which do not.
 */
export function csrfInterceptor(getToken: () => string | undefined): HttpInterceptor {
  return {
    name: 'csrf',
    onRequest(context) {
      if (context.method === 'GET' || context.method === 'HEAD') return;
      const csrfToken = getToken();
      if (csrfToken) context.headers.set(HTTP_HEADERS.csrfToken, csrfToken);
    },
  };
}

/** The query string can carry search terms and IDs. Not something to write to a log. */
function stripQuery(url: string): string {
  const index = url.indexOf('?');
  return index === -1 ? url : `${url.slice(0, index)}?…`;
}
