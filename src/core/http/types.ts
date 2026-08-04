import type { z } from 'zod';

import type { AppError } from '../errors/app-error';
import type { Result } from '../result/result';
import type { HttpMethod } from '@/shared/constants/http';

/**
 * HTTP contracts (requirement 2).
 *
 * One client, one place where a request is built, retried, timed out, traced and parsed.
 * A raw `fetch()` anywhere else in `src/` is a bug: it has no timeout (fetch has no default
 * one — a hung connection hangs forever), no correlation ID, no retry policy, no schema
 * validation, and no consistent error type.
 *
 * **No realtime transport.** There is deliberately no WebSocket, EventSource or
 * subscription API here or anywhere else in the codebase. Request/response only. Freshness
 * comes from cache tags and revalidation (`core/cache`), which keeps every read path
 * cacheable, prerenderable and trivially testable — none of which survives a persistent
 * connection.
 */

export interface RequestConfig<TResponse = unknown> {
  /** Path relative to the client's `baseUrl`, or an absolute URL. */
  url: string;
  method?: HttpMethod;
  /** Serialized into the query string; `undefined` and `''` entries are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  /** JSON-serialized unless it is `FormData`, `Blob`, `URLSearchParams` or a string. */
  body?: unknown;

  /**
   * Schema the response is parsed against.
   *
   * Not optional in spirit. An unvalidated response is `any` wearing a type annotation: the
   * compiler believes the shape, the runtime does not check it, and an upstream field
   * rename becomes a `undefined is not a function` three components deep. A failure here is
   * `UPSTREAM_CONTRACT_VIOLATION`, which is reported — the upstream broke a promise.
   */
  schema?: z.ZodType<TResponse>;

  /** Overrides the client default. `AbortSignal.timeout` under the hood. */
  timeoutMs?: number;
  /** Total attempts including the first. Non-idempotent methods ignore this unless keyed. */
  retries?: number;
  signal?: AbortSignal;

  /**
   * Deduplicates a retried mutation upstream.
   *
   * Supplying this is what makes a POST safe to retry: without it, a retry after a timeout
   * may create a second charge, a second document, a second email. The client refuses to
   * retry a non-idempotent method unless this is present.
   */
  idempotencyKey?: string;

  /** Next.js fetch cache options. Only meaningful server-side. */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };

  /** Attached to the log line and the error context. Name the operation, not the URL. */
  operation?: string;
}

export interface HttpResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: Headers;
  /** Wall-clock duration in milliseconds, for the log line. */
  readonly durationMs: number;
}

/**
 * The mutable request as it travels the interceptor chain.
 *
 * A plain object rather than a `Request`: `Request` bodies are single-use streams, so a
 * retry would send an empty body the second time — a bug that only appears when the network
 * is bad, which is exactly when you cannot debug it.
 */
export interface HttpRequestContext {
  url: string;
  method: HttpMethod;
  headers: Headers;
  body: BodyInit | undefined;
  config: RequestConfig<unknown>;
  correlationId: string;
  attempt: number;
}

/**
 * Interceptors.
 *
 * Ordered and explicit. `onRequest` runs in registration order, `onResponse` and `onError`
 * in reverse — so a pair that opens and closes something (a timer, a span) nests correctly
 * rather than interleaving.
 */
export interface HttpInterceptor {
  readonly name: string;
  onRequest?(context: HttpRequestContext): Promise<void> | void;
  onResponse?(response: Response, context: HttpRequestContext): Promise<void> | void;
  onError?(error: AppError, context: HttpRequestContext): Promise<void> | void;
}

export interface HttpClient {
  request<T>(config: RequestConfig<T>): Promise<Result<HttpResponse<T>, AppError>>;
  get<T>(url: string, config?: Omit<RequestConfig<T>, 'url' | 'method'>): Promise<Result<HttpResponse<T>, AppError>>;
  post<T>(url: string, body?: unknown, config?: Omit<RequestConfig<T>, 'url' | 'method' | 'body'>): Promise<Result<HttpResponse<T>, AppError>>;
  put<T>(url: string, body?: unknown, config?: Omit<RequestConfig<T>, 'url' | 'method' | 'body'>): Promise<Result<HttpResponse<T>, AppError>>;
  patch<T>(url: string, body?: unknown, config?: Omit<RequestConfig<T>, 'url' | 'method' | 'body'>): Promise<Result<HttpResponse<T>, AppError>>;
  delete<T>(url: string, config?: Omit<RequestConfig<T>, 'url' | 'method'>): Promise<Result<HttpResponse<T>, AppError>>;
}
