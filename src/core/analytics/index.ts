/**
 * Analytics — public API (requirement 16).
 *
 * Application code touches exactly two things from here: the `Analytics` facade (injected,
 * never imported as a singleton) and the event names, which are checked against
 * `AnalyticsEventMap` at the call site.
 *
 * ```ts
 * analytics.track('document.analyzed', { documentId, durationMs, flagCount });
 * //              ^ compile error if the name or any property is wrong
 * ```
 */

export { createAnalytics, createNoopAnalytics, type AnalyticsOptions } from './analytics';

export {
  ANALYTICS_EVENTS,
  CONSENT_EXEMPT_EVENTS,
  type AnalyticsEventMap,
  type AnalyticsEventName,
  type DocumentSource,
  type UpgradeSurface,
} from './events';

export {
  CONSENT_VERSION,
  createConsentStore,
  customConsent,
  denyAll,
  grantAll,
  needsConsentDecision,
} from './consent';

export {
  createLoggerAnalyticsProvider,
  createMemoryAnalyticsProvider,
  createNoopAnalyticsProvider,
  type MemoryAnalyticsProvider,
} from './providers';

export {
  DEFAULT_CONSENT,
  type Analytics,
  type AnalyticsIdentity,
  type AnalyticsProvider,
  type ConsentState,
  type ConsentValue,
  type SuperProperties,
} from './types';
