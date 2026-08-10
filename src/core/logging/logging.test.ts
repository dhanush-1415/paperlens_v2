import { describe, expect, it } from 'vitest';

import { createLogger, noopLogger } from './logger';
import { redact, redactContext } from './redact';
import {
 createConsoleTransport,
 createJsonTransport,
 createMemoryTransport,
 createNoopTransport,
} from './transports';
import { isLevelEnabled, LOG_LEVELS, type LogLevel } from './types';

/**
 * The logging pipeline.
 *
 * These tests exist for one reason above all others: **redaction cannot be tested in
 * production**. A log line that leaks a password is discovered by someone reading logs
 * months later, or by an auditor, or by nobody. The only place the guarantee can be checked
 * is here, and it has to be checked exhaustively, because redaction that works on four of
 * five shapes is redaction that does not work.
 */

const fixedNow = () => new Date('2026-01-15T10:30:00.000Z');

function loggerWithMemory(level: LogLevel = 'trace') {
 const transport = createMemoryTransport();
 const logger = createLogger({ scope: 'test', level, transports: [transport], now: fixedNow });
 return { logger, transport };
}

describe('levels', () => {
 it('orders levels so a numeric comparison is a severity comparison', () => {
 expect(LOG_LEVELS.trace).toBeLessThan(LOG_LEVELS.debug);
 expect(LOG_LEVELS.debug).toBeLessThan(LOG_LEVELS.info);
 expect(LOG_LEVELS.info).toBeLessThan(LOG_LEVELS.warn);
 expect(LOG_LEVELS.warn).toBeLessThan(LOG_LEVELS.error);
 expect(LOG_LEVELS.error).toBeLessThan(LOG_LEVELS.fatal);
 });

 it('enables a level at or above the minimum, and nothing below it', () => {
 expect(isLevelEnabled('error', 'info')).toBe(true);
 expect(isLevelEnabled('info', 'info')).toBe(true);
 expect(isLevelEnabled('debug', 'info')).toBe(false);
 });

 it('drops records below the configured level before they reach a transport', () => {
 const { logger, transport } = loggerWithMemory('warn');

 logger.trace('no');
 logger.debug('no');
 logger.info('no');
 logger.warn('yes');
 logger.error('yes');
 logger.fatal('yes');

 expect(transport.records.map((r) => r.level)).toEqual(['warn', 'error', 'fatal']);
 });
});

describe('records', () => {
 it('carries level, message, scope and an ISO timestamp', () => {
 const { logger, transport } = loggerWithMemory();

 logger.info('something happened');

 expect(transport.records[0]).toMatchObject({
 level: 'info',
 message: 'something happened',
 scope: 'test',
 timestamp: '2026-01-15T10:30:00.000Z',
 });
 });

 it('merges ambient context, logger bindings and call context — in that precedence', () => {
 const transport = createMemoryTransport();
 const logger = createLogger({
 scope: 'test',
 level: 'trace',
 transports: [transport],
 now: fixedNow,
 context: () => ({ correlationId: 'abc', source: 'ambient' }),
 bindings: { source: 'binding', feature: 'x' },
 });

 logger.info('hello', { source: 'call' });

 // Call context wins over bindings, bindings win over ambient. The most specific
 // statement about a record should be the one that survives.
 expect(transport.records[0]?.context).toMatchObject({
 correlationId: 'abc',
 feature: 'x',
 source: 'call',
 });
 });

 it('reads ambient context per record, not once at construction', () => {
 let requestId = 'first';
 const transport = createMemoryTransport();
 const logger = createLogger({
 scope: 'test',
 level: 'trace',
 transports: [transport],
 now: fixedNow,
 context: () => ({ requestId }),
 });

 logger.info('one');
 requestId = 'second';
 logger.info('two');

 // A long-lived logger must report the *current* request, not the one it was built in.
 expect(transport.records.map((r) => r.context['requestId'])).toEqual(['first', 'second']);
 });

 it('flattens an error’s cause chain', () => {
 const { logger, transport } = loggerWithMemory();

 logger.error('outer failed', new Error('outer', { cause: new Error('inner') }));

 expect(transport.records[0]?.error?.['cause']).toMatchObject({ message: 'inner' });
 });

 it('uses an error’s own `toLog()` when it has one', () => {
 const { logger, transport } = loggerWithMemory();

 class Domainish extends Error {
 toLog() {
 return { code: 'DOMAIN_CODE', retryable: false };
 }
 }

 logger.error('failed', new Domainish('boom'));

 // `AppError` is picked up structurally rather than by `instanceof`, so `core/logging`
 // never has to import `core/errors` — that direction would be circular.
 expect(transport.records[0]?.error).toMatchObject({ code: 'DOMAIN_CODE', retryable: false });
 });

 it('logs a non-Error throw without losing it', () => {
 const { logger, transport } = loggerWithMemory();

 logger.error('threw a string', 'just a string');

 expect(transport.records[0]?.error).toMatchObject({ message: 'just a string' });
 });

 it('serializes an error without letting it escape as a live object', () => {
 const { logger, transport } = loggerWithMemory();

 logger.error('failed', new Error('boom'));

 const error = transport.records[0]?.error;
 expect(error).toMatchObject({ name: 'Error', message: 'boom' });
 expect(error).not.toBeInstanceOf(Error);
 });

 it('omits the error field entirely when there is no error', () => {
 const { logger, transport } = loggerWithMemory();

 logger.error('failed with no cause');

 expect(transport.records[0]).not.toHaveProperty('error');
 });
});

describe('child loggers', () => {
 it('extends the scope and inherits bindings', () => {
 const transport = createMemoryTransport();
 const parent = createLogger({
 scope: 'http',
 level: 'trace',
 transports: [transport],
 now: fixedNow,
 bindings: { service: 'api' },
 });

 parent.child('client', { attempt: 1 }).info('sent');

 expect(transport.records[0]?.scope).toBe('http.client');
 expect(transport.records[0]?.context).toMatchObject({ service: 'api', attempt: 1 });
 });

 it('does not leak a child’s bindings back to its parent', () => {
 const transport = createMemoryTransport();
 const parent = createLogger({
 scope: 'a',
 level: 'trace',
 transports: [transport],
 now: fixedNow,
 });

 parent.child('b', { childOnly: true }).info('child');
 parent.info('parent');

 expect(transport.records[1]?.context).not.toHaveProperty('childOnly');
 });
});

describe('transports', () => {
 it('writes to every transport', () => {
 const a = createMemoryTransport();
 const b = createMemoryTransport();

 createLogger({ scope: 't', level: 'trace', transports: [a, b], now: fixedNow }).info('x');

 expect(a.records).toHaveLength(1);
 expect(b.records).toHaveLength(1);
 });

 it('survives a transport that throws, and still reaches the others', () => {
 const good = createMemoryTransport();
 const broken = {
 name: 'broken',
 write() {
 throw new Error('transport is down');
 },
 };

 const logger = createLogger({
 scope: 't',
 level: 'trace',
 transports: [broken, good],
 now: fixedNow,
 });

 // A broken log destination must never break the request that was being logged. This is
 // the whole reason `LogTransport` documents "must never throw" — and the reason the
 // pipeline does not trust it to obey.
 expect(() => logger.info('still works')).not.toThrow();
 expect(good.records).toHaveLength(1);
 });

 it('emits one line of parseable JSON per record', () => {
 const lines: string[] = [];
 const original = console.log;
 console.log = (line: string) => void lines.push(line);

 try {
 createLogger({
 scope: 'json',
 level: 'trace',
 transports: [createJsonTransport()],
 now: fixedNow,
 }).info('structured', { k: 'v' });
 } finally {
 console.log = original;
 }

 expect(lines).toHaveLength(1);
 expect(lines[0]).not.toContain('\n');
 expect(JSON.parse(lines[0] as string)).toMatchObject({
 level: 'info',
 msg: 'structured',
 scope: 'json',
 });
 });

 it('still emits a line when a record cannot be serialized', () => {
 const lines: string[] = [];
 const original = console.log;
 console.log = (line: string) => void lines.push(line);

 // `redact` breaks most cycles, but a getter that throws survives it. The transport must
 // degrade to a marker line rather than take down the request that produced the log.
 const hostile = {
 get boom(): never {
 throw new Error('nope');
 },
 };

 try {
 createLogger({
 scope: 'json',
 level: 'trace',
 transports: [createJsonTransport()],
 now: fixedNow,
 }).info('hostile', { hostile });
 } finally {
 console.log = original;
 }

 expect(lines).toHaveLength(1);
 expect(JSON.parse(lines[0] as string)).toMatchObject({
 msg: 'hostile',
 hostile: { boom: '[unreadable]' },
 });
 });

 it('routes each level to the matching console method, and colours only on the server', () => {
 const calls: Array<[string, string]> = [];
 const original = { debug: console.debug, warn: console.warn, error: console.error };
 console.debug = (line: string) => void calls.push(['debug', line]);
 console.warn = (line: string) => void calls.push(['warn', line]);
 console.error = (line: string) => void calls.push(['error', line]);

 try {
 const logger = createLogger({
 scope: 'dev',
 level: 'trace',
 // jsdom defines `window`, so colour defaults off — which is the behaviour we want to
 // pin: ANSI escapes render as literal noise in a browser console.
 transports: [createConsoleTransport()],
 now: fixedNow,
 });
 logger.debug('d');
 logger.warn('w');
 logger.error('e');
 } finally {
 Object.assign(console, original);
 }

 expect(calls.map(([method]) => method)).toEqual(['debug', 'warn', 'error']);
 expect(calls.every(([, line]) => !line.includes(String.fromCharCode(27)))).toBe(true);
 });

 it('has a noop transport and a noop logger that do nothing without complaint', () => {
 expect(() => createNoopTransport().write({} as never)).not.toThrow();
 expect(() => {
 noopLogger.info('x');
 noopLogger.error('y', new Error('z'));
 noopLogger.child('c').warn('w');
 }).not.toThrow();
 });
});

describe('redaction — by key', () => {
 it.each([
 'password',
 'passphrase',
 'apiKey',
 'api_key',
 'authorization',
 'cookie',
 'sessionId',
 'privateKey',
 'ssn',
 'cardNumber',
 'cvv',
 'dateOfBirth',
 'email',
 'phone',
 'address',
 'passport',
 ])('redacts %s regardless of its value', (key) => {
 expect(redactContext({ [key]: 'anything at all' })[key]).toBe('[redacted]');
 });

 it('matches the key case-insensitively and as a substring', () => {
 const out = redactContext({ userPassword: 'a', X_API_KEY: 'b', billingAddress: 'c' });

 expect(Object.values(out)).toEqual(['[redacted]', '[redacted]', '[redacted]']);
 });

 it('redacts nested keys, not only top-level ones', () => {
 const out = redactContext({ user: { name: 'Ada', password: 'hunter2' } }) as {
 user: Record<string, unknown>;
 };

 expect(out.user.password).toBe('[redacted]');
 expect(out.user.name).toBe('Ada');
 });

 it('never logs document content — it reports the length instead', () => {
 // The product's entire input is documents people would not paste into a chat window.
 // These keys are redacted by name because their *contents* are the sensitive thing.
 // Length survives because "the analysis failed on a 40k-character document" is the one
 // fact about the content that is diagnostic and not disclosing.
 for (const key of ['content', 'body', 'text', 'rawText', 'documentText', 'extractedText']) {
 expect(redactContext({ [key]: 'TENANCY AGREEMENT' })[key]).toBe(
 '[document-content: 17 chars]',
 );
 }
 });

 it('redacts a non-string document-content key outright', () => {
 expect(redactContext({ content: { nested: 'thing' } })['content']).toBe('[redacted]');
 });
});

describe('redaction — by value', () => {
 it('redacts a JWT that arrived under an innocent key', () => {
 const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r';

 // The key `note` is not sensitive by name — this is caught by the *value* pass, which is
 // the pass that matters, because the leaks that happen in practice are the ones nobody
 // labelled `token`.
 expect(redactContext({ note: jwt })['note']).toBe('[redacted]');
 });

 it('redacts bearer tokens, vendor secret keys, emails, card numbers and SSNs in free text', () => {
 const cases: ReadonlyArray<[string, string]> = [
 ['header', 'Bearer abc123.def456-ghi'],
 ['vendorKey', 'sk_abcdefghij123456'],
 ['note', 'contact ada@example.com about it'],
 ['note', 'card 4111 1111 1111 1111 on file'],
 ['note', 'ssn 123-45-6789'],
 ];

 for (const [key, value] of cases) {
 expect(String(redactContext({ [key]: value })[key])).toContain('[redacted]');
 }
 });

 it('leaves ordinary values alone — over-redaction makes logs useless', () => {
 const out = redactContext({ route: '/document/abc', status: 404, retries: 2, ok: false });

 expect(out).toEqual({ route: '/document/abc', status: 404, retries: 2, ok: false });
 });
});

describe('redaction — bounds', () => {
 it('stops at a depth limit rather than recursing forever', () => {
 // A cyclic or pathologically nested object must not become an unbounded log record.
 let deep: Record<string, unknown> = { value: 'bottom' };
 for (let i = 0; i < 12; i += 1) deep = { nested: deep };

 expect(JSON.stringify(redact(deep))).toContain('[depth-limit]');
 });

 it('truncates long arrays and marks that it did', () => {
 const out = redact(Array.from({ length: 100 }, (_, i) => i)) as unknown[];

 expect(out.length).toBeLessThan(100);
 expect(JSON.stringify(out)).toMatch(/more|truncat/i);
 });

 it('truncates a very long string and marks that it did', () => {
 const out = String(redact('x'.repeat(5_000)));

 expect(out.length).toBeLessThan(5_000);
 expect(out).toMatch(/\[\+\d+ chars\]/);
 });

 it('handles null, undefined and primitives without throwing', () => {
 expect(redact(null)).toBeNull();
 expect(redact(undefined)).toBeUndefined();
 expect(redact(42)).toBe(42);
 expect(redact(true)).toBe(true);
 });

 it('normalizes the types JSON cannot carry', () => {
 // A `bigint` throws on `JSON.stringify`; a `Date` serializes inconsistently across
 // runtimes; a function is never meaningful. Each is flattened here so the JSON transport
 // downstream cannot fail on a record it was handed.
 expect(redact(10n)).toBe('10');
 expect(redact(new Date('2026-01-15T10:30:00.000Z'))).toBe('2026-01-15T10:30:00.000Z');
 expect(redact(() => {})).toBe('[function]');
 expect(redact(Symbol('s'))).toBe('[symbol]');
 });

 it('redacts inside an Error’s message while keeping its stack', () => {
 const out = redact(new Error('failed for ada@example.com')) as Record<string, unknown>;

 expect(out['message']).toBe('failed for [redacted]');
 expect(out['stack']).toBeTypeOf('string');
 });
});
