import type { LogLevel, LogRecord, LogTransport } from './types';

/**
 * Transports.
 *
 * This is the only module in the codebase permitted to call `console` — enforced by an
 * ESLint override on this directory. Everything else goes through `Logger`.
 */

const ESC = String.fromCharCode(27); // ANSI escape; written this way so the source stays plain ASCII
const RESET = `${ESC}[0m`;
const LEVEL_STYLES: Record<LogLevel, string> = {
  trace: `${ESC}[90m`, // grey
  debug: `${ESC}[36m`, // cyan
  info: `${ESC}[32m`, // green
  warn: `${ESC}[33m`, // yellow
  error: `${ESC}[31m`, // red
  fatal: `${ESC}[41m${ESC}[97m`, // white on red
};

/**
 * Human-readable output for local development.
 *
 * Colour codes are only emitted server-side — a browser console renders them as noise.
 */
export function createConsoleTransport(options: { colour?: boolean } = {}): LogTransport {
  const colour = options.colour ?? typeof window === 'undefined';

  return {
    name: 'console',
    write(record: LogRecord): void {
      const label = record.level.toUpperCase().padEnd(5);
      const head = colour
        ? `${LEVEL_STYLES[record.level]}${label}${RESET} ${record.scope}`
        : `${label} ${record.scope}`;

      const detail: unknown[] = [];
      if (Object.keys(record.context).length > 0) detail.push(record.context);
      if (record.error) detail.push(record.error);

      pickConsoleMethod(record.level)(`${head} ${record.message}`, ...detail);
    },
  };
}

/**
 * Newline-delimited JSON for production.
 *
 * One object per line is what every log aggregator ingests without a custom parser.
 * Written through `console.log` because that is stdout in every runtime this app targets.
 */
export function createJsonTransport(): LogTransport {
  return {
    name: 'json',
    write(record: LogRecord): void {
      try {
        console.log(
          JSON.stringify({
            level: record.level,
            time: record.timestamp,
            scope: record.scope,
            msg: record.message,
            ...record.context,
            ...(record.error ? { err: record.error } : {}),
          }),
        );
      } catch {
        // A record that cannot be serialized (a cycle that survived redaction) must not
        // take down the request that produced it.
        console.log(
          JSON.stringify({
            level: record.level,
            time: record.timestamp,
            scope: record.scope,
            msg: record.message,
            _error: 'log record not serializable',
          }),
        );
      }
    },
  };
}

/** Captures records in memory. For assertions in tests. */
export function createMemoryTransport(): LogTransport & { records: LogRecord[] } {
  const records: LogRecord[] = [];
  return {
    name: 'memory',
    records,
    write(record) {
      records.push(record);
    },
  };
}

/** Discards everything. The default when logging is disabled. */
export function createNoopTransport(): LogTransport {
  return { name: 'noop', write() {} };
}

function pickConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case 'trace':
    case 'debug':
      return console.debug.bind(console);
    case 'warn':
      return console.warn.bind(console);
    case 'error':
    case 'fatal':
      return console.error.bind(console);
    default:
      return console.log.bind(console);
  }
}
