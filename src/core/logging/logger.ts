import { redact, redactContext } from './redact';
import {
  isLevelEnabled,
  type LogLevel,
  type LogRecord,
  type LogTransport,
  type Logger,
} from './types';

/**
 * The logger factory.
 *
 * Deliberately has no environment awareness of its own: level, transports, clock and
 * ambient context all arrive as arguments. That is what lets the same code path write
 * coloured lines in dev, NDJSON in production, and an in-memory array in a test — with no
 * `if (isDev)` at any call site, and no module-level singleton to reset between tests.
 *
 * Note the `context` resolver is *injected* rather than imported. `AsyncLocalStorage` is a
 * Node-only API and this module is reachable from client components, so a top-level import
 * of it would break the client bundle. The server composition root supplies it; the client
 * gets `undefined` and simply logs without a correlation ID.
 */
export interface LoggerOptions {
  /** Dotted subsystem name, e.g. `http.client`. Appears on every record. */
  scope: string;
  /** Records below this level are dropped before redaction — the cheap check comes first. */
  level: LogLevel;
  transports: readonly LogTransport[];
  /** Merged into every record this logger and its children write. */
  bindings?: Record<string, unknown>;
  /**
   * Ambient per-request fields (correlation ID, user ID, route). Called per record so a
   * long-lived logger picks up the *current* request rather than the one it was made in.
   */
  context?: () => Record<string, unknown>;
  /** Injected so tests get deterministic timestamps. */
  now?: () => Date;
}

export function createLogger(options: LoggerOptions): Logger {
  const { scope, level, transports, bindings = {}, context, now = () => new Date() } = options;

  function write(
    recordLevel: LogLevel,
    message: string,
    error: unknown,
    callContext: Record<string, unknown> | undefined,
  ): void {
    if (!isLevelEnabled(recordLevel, level)) return;

    const merged = { ...(context?.() ?? {}), ...bindings, ...(callContext ?? {}) };

    const record: LogRecord = {
      level: recordLevel,
      message,
      timestamp: now().toISOString(),
      scope,
      context: redactContext(merged),
      ...(error !== undefined && error !== null
        ? { error: redact(serializeError(error)) as Record<string, unknown> }
        : {}),
    };

    for (const transport of transports) {
      try {
        transport.write(record);
      } catch {
        // A transport that throws must not fail the request that logged. There is nowhere
        // useful to report this — reporting it would go through a transport.
      }
    }
  }

  return {
    trace: (message, ctx) => write('trace', message, undefined, ctx),
    debug: (message, ctx) => write('debug', message, undefined, ctx),
    info: (message, ctx) => write('info', message, undefined, ctx),
    warn: (message, ctx) => write('warn', message, undefined, ctx),
    error: (message, error, ctx) => write('error', message, error, ctx),
    fatal: (message, error, ctx) => write('fatal', message, error, ctx),
    child: (childScope, childBindings) =>
      createLogger({
        ...options,
        scope: `${scope}.${childScope}`,
        bindings: { ...bindings, ...(childBindings ?? {}) },
      }),
  };
}

/**
 * Flatten anything throwable into a loggable object.
 *
 * `AppError` is detected structurally rather than by `instanceof` so this module stays
 * free of a dependency on `core/errors` — that direction would be circular, since error
 * handling logs.
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const output: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    const candidate = error as { toLog?: unknown };
    if (typeof candidate.toLog === 'function') {
      return { ...output, ...(candidate.toLog.call(error) as Record<string, unknown>) };
    }

    if (error.cause !== undefined) output['cause'] = serializeError(error.cause);
    return output;
  }

  if (typeof error === 'object' && error !== null) return { ...error };

  return { message: String(error) };
}

/** A logger that discards everything. The safe default before the container is wired. */
export const noopLogger: Logger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => noopLogger,
};
