import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { isErr, isOk } from '../result/result';
import { createLogger } from '../logging/logger';
import { createMemoryTransport } from '../logging/transports';
import { createHttpClient, type HttpClientOptions } from './client';
import {
  bearerAuthInterceptor,
  csrfInterceptor,
  localeInterceptor,
  loggingInterceptor,
  tenantInterceptor,
  timingInterceptor,
} from './interceptors';
import type { HttpInterceptor } from './types';

/**
 * The HTTP client.
 *
 * Everything worth asserting here is a policy, not a mechanic. `fetch` already works; what
 * this module adds is the set of decisions that a hand-written `fetch` at each call site
 * would get subtly wrong — when to retry, when *not* to, what an error becomes, and whether
 * the response is actually the shape the caller's types claim.
 *
 * The single most important test in this file is "does not retry a POST without an
 * idempotency key". That is the one that stops a timed-out charge from becoming two charges.
 */

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

/** A `fetch` that replays a queued script and records what it was asked for. */
function fetchStub(responses: Array<Response | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let index = 0;

  const impl = vi.fn(async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    if (next instanceof Error) throw next;
    // A `Response` body is a single-use stream; clone so a replayed script still works.
    return (next as Response).clone();
  });

  return { impl: impl as unknown as typeof fetch, calls, count: () => index };
}

function client(options: HttpClientOptions & { fetchImpl: typeof fetch }) {
  return createHttpClient({ retries: 0, ...options });
}

describe('requests', () => {
  it('resolves a relative path against the base URL', async () => {
    const stub = fetchStub([jsonResponse({ ok: true })]);
    await client({ baseUrl: 'https://api.example.com/v1', fetchImpl: stub.impl }).get('/documents');

    expect(stub.calls[0]?.url).toBe('https://api.example.com/v1/documents');
  });

  it('serializes query params and drops empty ones', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({ fetchImpl: stub.impl }).request({
      url: '/search',
      query: { q: 'lease', page: 2, empty: '', missing: undefined, flag: false },
    });

    expect(stub.calls[0]?.url).toBe('/search?q=lease&page=2&flag=false');
  });

  it('sends a JSON body with the right content type', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({ fetchImpl: stub.impl }).post('/documents', { title: 'Lease' });

    const headers = stub.calls[0]?.init.headers as Headers;
    expect(stub.calls[0]?.init.body).toBe('{"title":"Lease"}');
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('leaves a FormData body alone', async () => {
    // Setting content-type on FormData strips the multipart boundary and the upload fails
    // upstream with a message that names none of this.
    const body = new FormData();
    body.set('file', 'x');
    const stub = fetchStub([jsonResponse({})]);
    await client({ fetchImpl: stub.impl }).post('/upload', body);

    expect((stub.calls[0]?.init.headers as Headers).has('content-type')).toBe(false);
    expect(stub.calls[0]?.init.body).toBe(body);
  });

  it('stamps a correlation id on every request', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({ fetchImpl: stub.impl }).get('/x');

    expect((stub.calls[0]?.init.headers as Headers).get('x-correlation-id')).toBeTruthy();
  });

  it('propagates a caller-supplied correlation id rather than minting a new one', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({ fetchImpl: stub.impl }).get('/x', {
      headers: { 'x-correlation-id': 'given-id' },
    });

    expect((stub.calls[0]?.init.headers as Headers).get('x-correlation-id')).toBe('given-id');
  });

  it('merges default headers under per-request ones', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({
      fetchImpl: stub.impl,
      defaultHeaders: { 'x-app': 'paperlens', 'x-env': 'default' },
    }).get('/x', { headers: { 'x-env': 'override' } });

    const headers = stub.calls[0]?.init.headers as Headers;
    expect(headers.get('x-app')).toBe('paperlens');
    expect(headers.get('x-env')).toBe('override');
  });

  it('exposes a verb per HTTP method', async () => {
    const stub = fetchStub([jsonResponse({})]);
    const http = client({ fetchImpl: stub.impl });

    await http.get('/a');
    await http.post('/b', {});
    await http.put('/c', {});
    await http.patch('/d', {});
    await http.delete('/e');

    expect(stub.calls.map((call) => call.init.method)).toEqual([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ]);
  });
});

describe('the egress allowlist', () => {
  it('rejects an absolute URL whose origin is not on the list', async () => {
    // The web's answer to certificate pinning: an SSRF that manages to control a URL still
    // cannot reach an internal metadata endpoint, because that origin was never allowed.
    const stub = fetchStub([jsonResponse({})]);
    const result = await client({
      fetchImpl: stub.impl,
      allowedOrigins: ['https://api.example.com'],
    }).get('http://169.254.169.254/latest/meta-data/');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('CONFIGURATION_ERROR');
    expect(stub.count()).toBe(0);
  });

  it('allows an origin that is on the list', async () => {
    const stub = fetchStub([jsonResponse({ ok: true })]);
    const result = await client({
      fetchImpl: stub.impl,
      allowedOrigins: ['https://api.example.com'],
    }).get('https://api.example.com/health');

    expect(isOk(result)).toBe(true);
  });

  it('is unrestricted when the list is empty', async () => {
    const stub = fetchStub([jsonResponse({})]);

    expect(isOk(await client({ fetchImpl: stub.impl }).get('https://anywhere.example/x'))).toBe(
      true,
    );
  });

  it('never reaches fetch — the URL is rejected before the request is made', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({ fetchImpl: stub.impl, allowedOrigins: ['https://a.example'] }).get(
      'https://b.example/x',
    );

    expect(stub.impl).not.toHaveBeenCalled();
  });
});

describe('response parsing', () => {
  it('validates against the schema and returns typed data', async () => {
    const stub = fetchStub([jsonResponse({ id: 'doc_1', risk: 3 })]);
    const result = await client({ fetchImpl: stub.impl }).get('/doc', {
      schema: z.object({ id: z.string(), risk: z.number() }),
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value.data).toEqual({ id: 'doc_1', risk: 3 });
  });

  it('reports a schema mismatch as an upstream contract violation', async () => {
    // The upstream broke a promise. That is not a user error and not a bug in this app —
    // it is a different fault with a different owner, and the code says so.
    const stub = fetchStub([jsonResponse({ id: 42 })]);
    const result = await client({ fetchImpl: stub.impl }).get('/doc', {
      schema: z.object({ id: z.string() }),
      operation: 'documents.get',
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('UPSTREAM_CONTRACT_VIOLATION');
      expect(result.error.message).toContain('documents.get');
    }
  });

  it('reports malformed JSON as a contract violation too', async () => {
    const stub = fetchStub([
      new Response('{not json', { headers: { 'content-type': 'application/json' } }),
    ]);
    const result = await client({ fetchImpl: stub.impl }).get('/doc');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('UPSTREAM_CONTRACT_VIOLATION');
  });

  it('returns undefined data for 204 rather than trying to parse a body', async () => {
    const stub = fetchStub([new Response(null, { status: 204 })]);
    const result = await client({ fetchImpl: stub.impl }).delete('/doc/1');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value.data).toBeUndefined();
  });

  it('reads a non-JSON response as text', async () => {
    const stub = fetchStub([
      new Response('plain words', { headers: { 'content-type': 'text/plain' } }),
    ]);
    const result = await client({ fetchImpl: stub.impl }).get('/readme');

    if (isOk(result)) expect(result.value.data).toBe('plain words');
  });

  it('reports the status, headers and duration alongside the data', async () => {
    const stub = fetchStub([jsonResponse({}, { status: 201, headers: { 'x-thing': 'y' } })]);
    const result = await client({ fetchImpl: stub.impl }).post('/x', {});

    if (isOk(result)) {
      expect(result.value.status).toBe(201);
      expect(result.value.headers.get('x-thing')).toBe('y');
      expect(result.value.durationMs).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('status mapping', () => {
  it.each([
    [400, 'MALFORMED_REQUEST'],
    [401, 'UNAUTHENTICATED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [413, 'PAYLOAD_TOO_LARGE'],
    [415, 'UNSUPPORTED_FILE_TYPE'],
    [422, 'VALIDATION_FAILED'],
    [429, 'RATE_LIMITED'],
    [503, 'SERVICE_UNAVAILABLE'],
    [504, 'TIMEOUT'],
    [418, 'UPSTREAM_ERROR'],
  ])('maps %i to %s', async (status, code) => {
    const stub = fetchStub([new Response('nope', { status })]);
    const result = await client({ fetchImpl: stub.impl }).get('/x');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe(code);
  });

  it('carries retry-after through to the error', async () => {
    const stub = fetchStub([
      new Response('slow down', { status: 429, headers: { 'retry-after': '30' } }),
    ]);
    const result = await client({ fetchImpl: stub.impl }).get('/x');

    if (isErr(result)) expect(result.error.retryAfterSeconds).toBe(30);
  });

  it('does not surface the upstream body to the user', async () => {
    // We do not control what an upstream error message contains — it may name internal
    // hosts, or echo the request back. The user-facing key is drawn from the code, never
    // from the body; the body belongs in the log line and nowhere else.
    const stub = fetchStub([new Response('internal-host-4 rejected token abc', { status: 500 })]);
    const result = await client({ fetchImpl: stub.impl }).get('/x');

    if (isErr(result)) {
      expect(result.error.messageKey).not.toContain('internal-host-4');
      expect(result.error.messageKey).toMatch(/^errors\./);
    }
  });
});

describe('retry policy', () => {
  it('retries an idempotent method on a retryable status', async () => {
    const stub = fetchStub([new Response('', { status: 503 }), jsonResponse({ ok: true })]);
    const result = await createHttpClient({ retries: 1, fetchImpl: stub.impl }).get('/x');

    expect(isOk(result)).toBe(true);
    expect(stub.count()).toBe(2);
  });

  it('does not retry a non-retryable status', async () => {
    // Retrying a 400 sends the same wrong request a second time and blames the upstream.
    const stub = fetchStub([new Response('', { status: 400 })]);
    await createHttpClient({ retries: 2, fetchImpl: stub.impl }).get('/x');

    expect(stub.count()).toBe(1);
  });

  it('does NOT retry a POST without an idempotency key', async () => {
    // The most consequential line in this file. A POST that times out may already have
    // succeeded upstream — the *response* was lost, not the effect. Retrying then creates
    // the second charge, the second document, the second email.
    const stub = fetchStub([new Response('', { status: 503 })]);
    await createHttpClient({ retries: 3, fetchImpl: stub.impl }).post('/charges', { amount: 1 });

    expect(stub.count()).toBe(1);
  });

  it('does retry a POST that carries an idempotency key', async () => {
    const stub = fetchStub([new Response('', { status: 503 }), jsonResponse({ ok: true })]);
    const result = await createHttpClient({ retries: 1, fetchImpl: stub.impl }).post(
      '/charges',
      { amount: 1 },
      { idempotencyKey: 'key-1' },
    );

    expect(isOk(result)).toBe(true);
    expect(stub.count()).toBe(2);
    expect((stub.calls[0]?.init.headers as Headers).get('x-idempotency-key')).toBe('key-1');
  });

  it('honours retries: 0 as "try once"', async () => {
    const stub = fetchStub([new Response('', { status: 503 })]);
    await createHttpClient({ retries: 5, fetchImpl: stub.impl }).get('/x', { retries: 0 });

    expect(stub.count()).toBe(1);
  });

  it('gives up after the configured attempts and returns the last error', async () => {
    const stub = fetchStub([new Response('', { status: 503 })]);
    const result = await createHttpClient({ retries: 1, fetchImpl: stub.impl }).get('/x');

    expect(stub.count()).toBe(2);
    if (isErr(result)) expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('retries a transport failure', async () => {
    const stub = fetchStub([new TypeError('fetch failed'), jsonResponse({ ok: true })]);
    const result = await createHttpClient({ retries: 1, fetchImpl: stub.impl }).get('/x');

    expect(isOk(result)).toBe(true);
  });
});

describe('timeouts', () => {
  it('aborts a request that exceeds its budget and reports TIMEOUT', async () => {
    const hangingFetch = ((_url: string, init: RequestInit = {}) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      })) as unknown as typeof fetch;

    const result = await createHttpClient({ retries: 0, fetchImpl: hangingFetch }).get('/slow', {
      timeoutMs: 20,
    });

    // `fetch` has no default timeout — a hung connection hangs forever. Supplying one is
    // half the reason this client exists.
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('TIMEOUT');
  });

  it('respects a caller-supplied abort signal', async () => {
    const controller = new AbortController();
    const hangingFetch = ((_url: string, init: RequestInit = {}) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      })) as unknown as typeof fetch;

    const pending = createHttpClient({ retries: 0, fetchImpl: hangingFetch }).get('/slow', {
      signal: controller.signal,
    });
    controller.abort();

    expect(isErr(await pending)).toBe(true);
  });
});

describe('interceptors', () => {
  it('runs onRequest in order and onResponse in reverse', async () => {
    // Reverse order is what makes a pair that opens and closes something — a timer, a span —
    // nest correctly instead of interleaving.
    const order: string[] = [];
    const trace = (name: string): HttpInterceptor => ({
      name,
      onRequest: () => void order.push(`req:${name}`),
      onResponse: () => void order.push(`res:${name}`),
    });

    const stub = fetchStub([jsonResponse({})]);
    await client({ fetchImpl: stub.impl, interceptors: [trace('a'), trace('b')] }).get('/x');

    expect(order).toEqual(['req:a', 'req:b', 'res:b', 'res:a']);
  });

  it('lets an interceptor mutate the outbound headers', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({
      fetchImpl: stub.impl,
      interceptors: [bearerAuthInterceptor(() => Promise.resolve('tok_123'))],
    }).get('/x');

    expect((stub.calls[0]?.init.headers as Headers).get('authorization')).toBe('Bearer tok_123');
  });

  it('re-reads the token on every attempt, not once at construction', async () => {
    // A token that expires mid-retry must be refreshed for the retry. One captured when the
    // client was built is stale by definition.
    const tokens = ['expired', 'fresh'];
    const stub = fetchStub([new Response('', { status: 503 }), jsonResponse({})]);
    await createHttpClient({
      retries: 1,
      fetchImpl: stub.impl,
      interceptors: [bearerAuthInterceptor(() => tokens.shift())],
    }).get('/x');

    expect((stub.calls[1]?.init.headers as Headers).get('authorization')).toBe('Bearer fresh');
  });

  it('calls onError in reverse order when a request fails', async () => {
    const seen: string[] = [];
    const trace = (name: string): HttpInterceptor => ({
      name,
      onError: () => void seen.push(name),
    });

    const stub = fetchStub([new Response('', { status: 400 })]);
    await client({ fetchImpl: stub.impl, interceptors: [trace('a'), trace('b')] }).get('/x');

    expect(seen).toEqual(['b', 'a']);
  });

  it('omits an optional header when its source has nothing to give', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({
      fetchImpl: stub.impl,
      interceptors: [
        bearerAuthInterceptor(() => undefined),
        tenantInterceptor(() => undefined),
        localeInterceptor(() => undefined),
      ],
    }).get('/x');

    const headers = stub.calls[0]?.init.headers as Headers;
    expect(headers.has('authorization')).toBe(false);
    expect(headers.has('x-tenant-id')).toBe(false);
  });

  it('stamps tenant and locale when they exist', async () => {
    const stub = fetchStub([jsonResponse({})]);
    await client({
      fetchImpl: stub.impl,
      interceptors: [tenantInterceptor(() => 'tenant_a'), localeInterceptor(() => 'en-GB')],
    }).get('/x');

    const headers = stub.calls[0]?.init.headers as Headers;
    expect(headers.get('x-tenant-id')).toBe('tenant_a');
    expect(headers.get('accept-language')).toBe('en-GB');
  });

  it('attaches a CSRF token to writes but not to reads', async () => {
    const stub = fetchStub([jsonResponse({})]);
    const http = client({ fetchImpl: stub.impl, interceptors: [csrfInterceptor(() => 'csrf_1')] });

    await http.get('/x');
    await http.post('/x', {});

    expect((stub.calls[0]?.init.headers as Headers).has('x-csrf-token')).toBe(false);
    expect((stub.calls[1]?.init.headers as Headers).get('x-csrf-token')).toBe('csrf_1');
  });

  it('logs without the query string, which carries search terms and ids', async () => {
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
    const stub = fetchStub([jsonResponse({})]);

    await client({ fetchImpl: stub.impl, interceptors: [loggingInterceptor(logger)] }).get(
      '/search',
      { query: { q: 'my private lease' } },
    );

    const logged = JSON.stringify(transport.records);
    expect(logged).not.toContain('my private lease');
    expect(logged).toContain('/search');
  });

  it('logs a failure at warn with the error code', async () => {
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
    const stub = fetchStub([new Response('', { status: 404 })]);

    await client({ fetchImpl: stub.impl, interceptors: [loggingInterceptor(logger)] }).get('/x');

    const warning = transport.records.find((record) => record.level === 'warn');
    expect(warning?.context['code']).toBe('NOT_FOUND');
  });

  it('warns only when a request crosses its latency budget', async () => {
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
    const stub = fetchStub([jsonResponse({})]);

    await client({
      fetchImpl: stub.impl,
      interceptors: [timingInterceptor(logger, 100_000)],
    }).get('/fast');

    expect(transport.records.filter((record) => record.level === 'warn')).toHaveLength(0);
  });

  it('warns when the budget is zero, proving the branch is wired', async () => {
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
    const stub = fetchStub([jsonResponse({})]);

    await client({ fetchImpl: stub.impl, interceptors: [timingInterceptor(logger, -1)] }).get('/x');

    expect(transport.records.some((record) => record.message === 'slow request')).toBe(true);
  });
});
