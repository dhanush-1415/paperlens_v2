import { type Logger } from '@/core/logging/types';
import { type ErrorReportContext, type ErrorReporter } from '@/core/monitoring/types';

/**
 * Recording test doubles for the two collaborators every boundary takes.
 *
 * These are *recording* fakes rather than `vi.fn()` mocks on purpose: a test that asserts on
 * `records` reads as a statement about behaviour ("a 404 is logged at warn and not reported")
 * instead of a statement about call mechanics. They also give the port contract suites a
 * logger they can hand to any adapter without pulling in transports or config.
 */

export interface LogRecord {
 readonly level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
 readonly message: string;
 readonly error?: unknown;
 readonly context?: Record<string, unknown>;
}

export interface RecordingLogger extends Logger {
 readonly records: readonly LogRecord[];
 clear(): void;
}

export function createRecordingLogger(): RecordingLogger {
 const records: LogRecord[] = [];

 const write =
 (level: LogRecord['level']) =>
 (message: string, context?: Record<string, unknown>): void => {
 records.push({ level, message, context });
 };

 const writeWithError =
 (level: 'error' | 'fatal') =>
 (message: string, error?: unknown, context?: Record<string, unknown>): void => {
 records.push({ level, message, error, context });
 };

 const logger: RecordingLogger = {
 records,
 clear: () => {
 records.length = 0;
 },
 trace: write('trace'),
 debug: write('debug'),
 info: write('info'),
 warn: write('warn'),
 error: writeWithError('error'),
 fatal: writeWithError('fatal'),
 // A child shares the parent's buffer, so a test asserting on `records` sees everything
 // written under the boundary regardless of which scope produced it.
 child: () => logger,
 };

 return logger;
}

export interface ReportRecord {
 readonly error: unknown;
 readonly context: ErrorReportContext;
}

export interface RecordingReporter extends ErrorReporter {
 readonly reports: readonly ReportRecord[];
 readonly messages: readonly string[];
 clear(): void;
}

export function createRecordingReporter(): RecordingReporter {
 const reports: ReportRecord[] = [];
 const messages: string[] = [];

 return {
 name: 'recording',
 reports,
 messages,
 clear: () => {
 reports.length = 0;
 messages.length = 0;
 },
 report: (error, context) => {
 reports.push({ error, context });
 },
 captureMessage: (message) => {
 messages.push(message);
 },
 addTrail: () => {},
 setUser: () => {},
 clearUser: () => {},
 } as RecordingReporter;
}

/** The pair every boundary wrapper asks for, built fresh. */
export function createBoundaryDeps() {
 return { logger: createRecordingLogger(), reporter: createRecordingReporter() };
}
