import { AppError, timeoutError, upstreamError } from '../errors/app-error';
import type { ErrorCode } from '../errors/codes';
import { normalizeError } from '../errors/normalize';
import type { Logger } from '../logging/types';
import { err, ok, type Result } from '../result/result';

import type {
 HttpClient,
 HttpInterceptor,
 HttpRequestContext,
 HttpResponse,
 RequestConfig,
} from './types';
import {
 CONTENT_TYPES,
 HTTP_HEADERS,
 IDEMPOTENT_METHODS,
 RETRYABLE_STATUS,
 type HttpMethod,
} from '@/shared/constants/http';
import { backoffDelay, sleep } from '@/shared/utils/async';
import { correlationId as newCorrelationId } from '@/shared/utils/id';
import { buildQueryString, isSafeUrl, joinPath } from '@/shared/utils/url';

/**
 * The HTTP client (requirement 2).
 *
 * A factory rather than a class, so the container can hand out differently-configured
 * clients (one per upstream) without inheritance, and a test can construct one with a fake
 * `fetch` and no globals patched.
 */

export interface HttpClientOptions {
 /** Prefixed to relative URLs. Absolute URLs in a request bypass it — see the allowlist. */
 baseUrl?: string;
 defaultHeaders?: Record<string, string>;
 timeoutMs?: number;
 retries?: number;
 interceptors?: readonly HttpInterceptor[];
 logger?: Logger;
 /**
 * Origins this client may call.
 *
 * Empty means unrestricted. Non-empty turns the client into an egress allowlist — the
 * web equivalent of certificate pinning: an SSRF that manages to control a URL still
 * cannot reach an internal metadata endpoint, because the origin was never on the list.
 */
 allowedOrigins?: readonly string[];
 /** Injected for tests. Defaults to the platform `fetch`. */
 fetchImpl?: typeof fetch;
 /** Injected so retry timing is deterministic under test. */
 now?: () => number;
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
 const {
 baseUrl = '',
 defaultHeaders = {},
 timeoutMs = 15_000,
 retries = 2,
 interceptors = [],
 logger,
 allowedOrigins = [],
 fetchImpl = globalThis.fetch,
 now = () => performance.now(),
 } = options;

 async function request<T>(config: RequestConfig<T>): Promise<Result<HttpResponse<T>, AppError>> {
 const method = config.method ?? 'GET';
 const operation = config.operation ?? `${method} ${config.url}`;
 const attempts = resolveAttempts(config, method, retries);

 let url: string;
 try {
 url = resolveUrl(baseUrl, config.url, config.query, allowedOrigins);
 } catch (error) {
 return err(normalizeError(error));
 }

 const context: HttpRequestContext = {
 url,
 method,
 headers: buildHeaders(config, defaultHeaders),
 body: serializeBody(config.body, config.headers),
 config: config as RequestConfig<unknown>,
 correlationId: config.headers?.[HTTP_HEADERS.correlationId] ?? newCorrelationId(),
 attempt: 1,
 };
 context.headers.set(HTTP_HEADERS.correlationId, context.correlationId);

 let lastError: AppError | undefined;

 for (let attempt = 1; attempt <= attempts; attempt += 1) {
 context.attempt = attempt;
 const startedAt = now();

 try {
 for (const interceptor of interceptors) await interceptor.onRequest?.(context);

 const response = await fetchImpl(context.url, {
 method: context.method,
 headers: context.headers,
 body: context.body,
 signal: combineSignals(config.signal, config.timeoutMs ?? timeoutMs),
 ...(config.cache ? { cache: config.cache } : {}),
 ...(config.next ? { next: config.next } : {}),
 });

 for (const interceptor of [...interceptors].reverse()) {
 await interceptor.onResponse?.(response, context);
 }

 const durationMs = Math.round(now() - startedAt);

 if (!response.ok) {
 const failure = await toAppError(response, operation, context.correlationId);

 // A retryable status on a retryable method: back off and try again. Anything else
 // is final — retrying a 400 sends the same wrong request a second time.
 if (attempt < attempts && RETRYABLE_STATUS.has(response.status)) {
 lastError = failure;
 await waitBeforeRetry(attempt, response, config.signal);
 continue;
 }

 logger?.warn('http request failed', {
 operation,
 status: response.status,
 durationMs,
 attempt,
 correlationId: context.correlationId,
 });
 for (const interceptor of [...interceptors].reverse()) {
 await interceptor.onError?.(failure, context);
 }
 return err(failure);
 }

 const parsed = await parseBody<T>(response, config, operation);
 if (!parsed.ok) return parsed;

 logger?.debug('http request', {
 operation,
 status: response.status,
 durationMs,
 attempt,
 correlationId: context.correlationId,
 });

 return ok({
 data: parsed.value,
 status: response.status,
 headers: response.headers,
 durationMs,
 });
 } catch (error) {
 // normalizeError rethrows framework control flow first — a `redirect()` from an
 // interceptor must not be turned into a network error and retried.
 const failure = mapTransportError(error, operation, config.timeoutMs ?? timeoutMs);
 lastError = failure;

 if (attempt < attempts && failure.retryable) {
 await waitBeforeRetry(attempt, undefined, config.signal);
 continue;
 }

 for (const interceptor of [...interceptors].reverse()) {
 await interceptor.onError?.(failure, context);
 }
 return err(failure);
 }
 }

 return err(lastError ?? upstreamError(operation));
 }

 return {
 request,
 get: (url, config) => request({ ...config, url, method: 'GET' }),
 post: (url, body, config) => request({ ...config, url, method: 'POST', body }),
 put: (url, body, config) => request({ ...config, url, method: 'PUT', body }),
 patch: (url, body, config) => request({ ...config, url, method: 'PATCH', body }),
 delete: (url, config) => request({ ...config, url, method: 'DELETE' }),
 };
}

// ── Internals ─────────────────────────────────────────────────────────────────────────────

/**
 * A non-idempotent request is retried only when it carries an idempotency key.
 *
 * Without one, a POST that times out may already have succeeded upstream — the response was
 * lost, not the effect. Retrying then creates the second charge, the second document, the
 * second email. This is the single most common way a well-meaning retry policy causes a
 * data incident.
 */
function resolveAttempts(
 config: RequestConfig<unknown>,
 method: HttpMethod,
 fallback: number,
): number {
 const requested = config.retries ?? fallback;
 if (requested <= 0) return 1;
 if (IDEMPOTENT_METHODS.has(method) || config.idempotencyKey) return requested + 1;
 return 1;
}

function resolveUrl(
 baseUrl: string,
 path: string,
 query: RequestConfig<unknown>['query'],
 allowedOrigins: readonly string[],
): string {
 const isAbsolute = /^https?:\/\//i.test(path);
 const url = isAbsolute ? path : joinPath(baseUrl, path);
 const withQuery = query ? `${url}${buildQueryString(query)}` : url;

 if (isAbsolute && !isSafeUrl(withQuery)) {
 throw new AppError('MALFORMED_REQUEST', { message: `Unsupported URL protocol: ${path}` });
 }

 if (allowedOrigins.length > 0 && /^https?:\/\//i.test(withQuery)) {
 const origin = new URL(withQuery).origin;
 if (!allowedOrigins.includes(origin)) {
 throw new AppError('CONFIGURATION_ERROR', {
 message: `Origin "${origin}" is not in the HTTP allowlist`,
 context: { origin },
 });
 }
 }

 return withQuery;
}

function buildHeaders(
 config: RequestConfig<unknown>,
 defaults: Record<string, string>,
): Headers {
 const headers = new Headers(defaults);
 headers.set(HTTP_HEADERS.accept, CONTENT_TYPES.json);

 for (const [key, value] of Object.entries(config.headers ?? {})) headers.set(key, value);

 if (config.idempotencyKey) {
 headers.set(HTTP_HEADERS.idempotencyKey, config.idempotencyKey);
 }

 const needsJsonContentType =
 config.body !== undefined &&
 !headers.has(HTTP_HEADERS.contentType) &&
 !isPassthroughBody(config.body);

 if (needsJsonContentType) headers.set(HTTP_HEADERS.contentType, CONTENT_TYPES.json);

 return headers;
}

/** Bodies fetch already knows how to send. Setting content-type on these breaks them. */
function isPassthroughBody(body: unknown): boolean {
 return (
 typeof body === 'string' ||
 body instanceof FormData ||
 body instanceof URLSearchParams ||
 body instanceof Blob ||
 body instanceof ArrayBuffer
 );
}

function serializeBody(
 body: unknown,
 _headers: Record<string, string> | undefined,
): BodyInit | undefined {
 if (body === undefined || body === null) return undefined;
 if (isPassthroughBody(body)) return body as BodyInit;
 return JSON.stringify(body);
}

/**
 * Combine the caller's signal with a timeout.
 *
 * `AbortSignal.timeout` is the platform's own timer — no `setTimeout` to leak, and it aborts
 * the connection rather than merely rejecting a promise while the socket stays open.
 */
function combineSignals(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
 const timeout = AbortSignal.timeout(timeoutMs);
 return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function parseBody<T>(
 response: Response,
 config: RequestConfig<T>,
 operation: string,
): Promise<Result<T, AppError>> {
 if (response.status === 204 || response.headers.get('content-length') === '0') {
 return ok(undefined as T);
 }

 const contentType = response.headers.get(HTTP_HEADERS.contentType) ?? '';
 const isJson = contentType.includes('json');

 let raw: unknown;
 try {
 raw = isJson ? await response.json() : await response.text();
 } catch (error) {
 return err(
 new AppError('UPSTREAM_CONTRACT_VIOLATION', {
 message: `Malformed body from "${operation}"`,
 cause: error,
 }),
 );
 }

 if (!config.schema) return ok(raw as T);

 const parsed = config.schema.safeParse(raw);
 if (parsed.success) return ok(parsed.data);

 return err(
 new AppError('UPSTREAM_CONTRACT_VIOLATION', {
 message: `Response from "${operation}" did not match its schema`,
 cause: parsed.error,
 context: { operation },
 }),
 );
}

async function toAppError(
 response: Response,
 operation: string,
 correlationId: string,
): Promise<AppError> {
 const retryAfter = Number(response.headers.get(HTTP_HEADERS.retryAfter));

 // The body is read for the log only — an upstream error message is never surfaced to a
 // user, because we do not control what it contains.
 let detail = '';
 try {
 detail = (await response.text()).slice(0, 500);
 } catch {
 /* a body that will not read is not worth failing over */
 }

 const code = statusToCode(response.status);
 return new AppError(code, {
 message: `${operation} → ${response.status}${detail ? `: ${detail}` : ''}`,
 correlationId,
 context: { status: response.status, operation },
 ...(Number.isFinite(retryAfter) && retryAfter > 0 ? { retryAfterSeconds: retryAfter } : {}),
 });
}

function statusToCode(status: number): ErrorCode {
 switch (status) {
 case 400:
 return 'MALFORMED_REQUEST';
 case 401:
 return 'UNAUTHENTICATED';
 case 403:
 return 'FORBIDDEN';
 case 404:
 return 'NOT_FOUND';
 case 409:
 return 'CONFLICT';
 case 413:
 return 'PAYLOAD_TOO_LARGE';
 case 415:
 return 'UNSUPPORTED_FILE_TYPE';
 case 422:
 return 'VALIDATION_FAILED';
 case 429:
 return 'RATE_LIMITED';
 case 503:
 return 'SERVICE_UNAVAILABLE';
 case 504:
 return 'TIMEOUT';
 default:
 return 'UPSTREAM_ERROR';
 }
}

function mapTransportError(error: unknown, operation: string, timeoutMs: number): AppError {
 const normalized = normalizeError(error);
 if (normalized.is('TIMEOUT')) return timeoutError(operation, timeoutMs);
 return normalized;
}

/**
 * Honour `Retry-After` when the upstream sends one, otherwise exponential backoff.
 *
 * The header is authoritative: a service that says "wait 30 seconds" is telling you it is
 * shedding load, and ignoring it is how a client turns a partial outage into a full one.
 */
async function waitBeforeRetry(
 attempt: number,
 response: Response | undefined,
 signal: AbortSignal | undefined,
): Promise<void> {
 const retryAfter = Number(response?.headers.get(HTTP_HEADERS.retryAfter));
 const delayMs =
 Number.isFinite(retryAfter) && retryAfter > 0
 ? Math.min(retryAfter * 1_000, 30_000)
 : backoffDelay(attempt);

 await sleep(delayMs, signal);
}
