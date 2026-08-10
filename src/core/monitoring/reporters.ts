import type { Logger } from '../logging/types';
import type {
 ErrorReportContext,
 ErrorReportTrail,
 ErrorReporter,
 ErrorReporterUser,
} from './types';

/**
 * Shipped adapters.
 *
 * `LoggerErrorReporter` is the default in every environment until a vendor is chosen. It is
 * not a stub: routing crashes into the structured log is a legitimate production setup when
 * logs are aggregated, and it means the reporting *call sites* are exercised from day one
 * rather than being dead code that first runs the day Sentry is installed.
 */

const MAX_TRAIL = 25;

export function createLoggerErrorReporter(logger: Logger): ErrorReporter {
 // Bounded ring: an unbounded trail on a long-lived client session is a memory leak.
 const trail: ErrorReportTrail[] = [];
 let user: ErrorReporterUser | null = null;

 const scoped = logger.child('monitoring');

 return {
 name: 'logger',

 report(error, context) {
 try {
 scoped.error('unhandled error', error, {
 ...context,
 ...(user ? { user } : {}),
 trail: trail.slice(-10),
 });
 } catch {
 // Reporting must not throw. See the port's contract.
 }
 },

 captureMessage(message, context) {
 try {
 scoped.warn(message, { ...context, ...(user ? { user } : {}) });
 } catch {
 /* see above */
 }
 },

 addTrail(entry) {
 trail.push(entry);
 if (trail.length > MAX_TRAIL) trail.shift();
 },

 setUser(next) {
 user = next;
 },

 clear() {
 trail.length = 0;
 user = null;
 },
 };
}

/** Discards everything. For tests that assert on something else, and for opted-out users. */
export function createNoopErrorReporter(): ErrorReporter {
 return {
 name: 'noop',
 report() {},
 captureMessage() {},
 addTrail() {},
 setUser() {},
 clear() {},
 };
}

export interface RecordedReport {
 readonly error: unknown;
 readonly context: ErrorReportContext;
}

/** Records calls for assertions. The contract suite runs against this and every real adapter. */
export function createMemoryErrorReporter(): ErrorReporter & {
 reports: RecordedReport[];
 messages: Array<{ message: string; context: ErrorReportContext }>;
 trail: ErrorReportTrail[];
 user: ErrorReporterUser | null;
} {
 const state = {
 name: 'memory' as const,
 reports: [] as RecordedReport[],
 messages: [] as Array<{ message: string; context: ErrorReportContext }>,
 trail: [] as ErrorReportTrail[],
 user: null as ErrorReporterUser | null,

 report(error: unknown, context: ErrorReportContext) {
 state.reports.push({ error, context });
 },
 captureMessage(message: string, context: ErrorReportContext) {
 state.messages.push({ message, context });
 },
 addTrail(entry: ErrorReportTrail) {
 state.trail.push(entry);
 },
 setUser(next: ErrorReporterUser | null) {
 state.user = next;
 },
 clear() {
 state.trail.length = 0;
 state.user = null;
 },
 };

 return state;
}
