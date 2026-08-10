/**
 * Logging contracts.
 *
 * `Logger` is what application code uses. `LogTransport` is what a destination
 * implements. Keeping them apart is what lets the same call site write pretty output in
 * dev, newline-delimited JSON in production, and an assertion in a test — without a
 * single `if (isDev)` anywhere in feature code.
 */

export const LOG_LEVELS = {
 trace: 10,
 debug: 20,
 info: 30,
 warn: 40,
 error: 50,
 fatal: 60,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export function isLevelEnabled(level: LogLevel, minimum: LogLevel): boolean {
 return LOG_LEVELS[level] >= LOG_LEVELS[minimum];
}

/** One log line, after redaction, before formatting. */
export interface LogRecord {
 readonly level: LogLevel;
 readonly message: string;
 readonly timestamp: string;
 /** Dotted name of the subsystem that emitted it, e.g. `http.client`. */
 readonly scope: string;
 /** Merged bindings from the logger chain plus per-call data. Already redacted. */
 readonly context: Record<string, unknown>;
 readonly error?: Record<string, unknown>;
}

/** A destination. Must never throw — a broken log must not break a request. */
export interface LogTransport {
 readonly name: string;
 write(record: LogRecord): void;
}

export interface Logger {
 trace(message: string, context?: Record<string, unknown>): void;
 debug(message: string, context?: Record<string, unknown>): void;
 info(message: string, context?: Record<string, unknown>): void;
 warn(message: string, context?: Record<string, unknown>): void;
 error(message: string, error?: unknown, context?: Record<string, unknown>): void;
 fatal(message: string, error?: unknown, context?: Record<string, unknown>): void;
 /** A logger with additional bindings merged into every record it writes. */
 child(scope: string, bindings?: Record<string, unknown>): Logger;
}
