/**
 * Logging — public API.
 *
 * `./context` is deliberately NOT re-exported here. It is `server-only`, and re-exporting
 * it would drag that constraint into every client component that wants to log. Server code
 * that needs the request context imports `@/core/logging/context` directly.
 */

export {
 LOG_LEVELS,
 isLevelEnabled,
 type LogLevel,
 type LogRecord,
 type LogTransport,
 type Logger,
} from './types';

export { createLogger, noopLogger, type LoggerOptions } from './logger';

export {
 createConsoleTransport,
 createJsonTransport,
 createMemoryTransport,
 createNoopTransport,
} from './transports';

export { redact, redactContext } from './redact';
