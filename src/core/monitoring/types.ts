import type { ErrorSeverity } from '../errors/codes';

/**
 * Crash reporting contracts (requirement 17).
 *
 * The port exists before any vendor does, on purpose. Sentry, Bugsnag, Datadog and
 * Highlight all want you to call their SDK from your components; doing that means a vendor
 * change is a codebase-wide edit and a test suite that needs network mocks. Here, every
 * call site talks to `ErrorReporter`, and the vendor is one adapter behind the container.
 */

/** Where the failure surfaced. Drives grouping and alert routing. */
export type ErrorBoundaryKind =
  | 'server-request' // instrumentation.ts onRequestError
  | 'server-action'
  | 'route-handler'
  | 'segment' // app/**/error.tsx
  | 'global' // app/global-error.tsx
  | 'component' // unstable_catchError
  | 'client-runtime' // instrumentation-client.ts
  | 'background'; // scheduled / non-request work

export interface ErrorReportContext {
  readonly boundary: ErrorBoundaryKind;
  readonly correlationId?: string;
  readonly route?: string;
  readonly digest?: string;
  readonly severity?: ErrorSeverity;
  readonly tags?: Readonly<Record<string, string>>;
  readonly extra?: Readonly<Record<string, unknown>>;
}

/**
 * Identity attached to subsequent reports.
 *
 * Deliberately narrow: an ID and a plan tier are enough to answer "who is affected and how
 * badly". Email and name are not, and this product's users upload tax notices and medical
 * bills — the less that leaves the process, the better.
 */
export interface ErrorReporterUser {
  readonly id: string;
  readonly plan?: string;
  readonly tenantId?: string;
}

/** A step in the trail leading to a failure. Vendors call these breadcrumbs. */
export interface ErrorReportTrail {
  readonly category: string;
  readonly message: string;
  readonly level?: 'debug' | 'info' | 'warning' | 'error';
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface ErrorReporter {
  readonly name: string;
  /**
   * Must never throw and never reject. A reporter that fails during error handling turns
   * one incident into two, and the second one has no boundary left to catch it.
   */
  report(error: unknown, context: ErrorReportContext): void;
  /** Something noteworthy that is not an error — a degraded fallback, a retry exhausted. */
  captureMessage(message: string, context: ErrorReportContext): void;
  addTrail(trail: ErrorReportTrail): void;
  setUser(user: ErrorReporterUser | null): void;
  /** Called on sign-out and on consent withdrawal. */
  clear(): void;
}
