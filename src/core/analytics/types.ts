/**
 * Analytics contracts (requirement 16).
 *
 * Two layers, deliberately separate:
 *
 * - `AnalyticsProvider` — a thin adapter over one vendor (PostHog, Amplitude, GA4, a
 * first-party endpoint). Dumb on purpose: it sends what it is given.
 * - `Analytics` — the facade the app uses. It owns consent, identity, super-properties and
 * fan-out, so those rules exist once rather than once per vendor.
 *
 * Application code never sees a provider. It calls `analytics.track('document.analyzed', …)`
 * and the facade decides whether that is allowed to leave the device.
 */

import type { AnalyticsEventMap, AnalyticsEventName } from './events';

/**
 * Consent, by category.
 *
 * `unknown` is a distinct state from `denied` and the distinction is load-bearing: unknown
 * means "we have not asked yet", which is when the banner shows. Collapsing the two makes
 * the banner either never appear or appear forever.
 */
export type ConsentValue = 'granted' | 'denied' | 'unknown';

export interface ConsentState {
 /** Session, security, load balancing. Not optional, never asked about. */
 readonly essential: true;
 /** Product analytics. Gates everything in this module. */
 readonly analytics: ConsentValue;
 /** Advertising and cross-site attribution. Gates nothing today; declared for honesty. */
 readonly marketing: ConsentValue;
 /** When the choice was recorded, for the audit trail regulators ask about. */
 readonly decidedAt: number | null;
}

export const DEFAULT_CONSENT: ConsentState = {
 essential: true,
 analytics: 'unknown',
 marketing: 'unknown',
 decidedAt: null,
};

/** Identity attached to subsequent events. No email, no name — see `events.ts`. */
export interface AnalyticsIdentity {
 readonly userId: string;
 readonly plan?: string;
 readonly tenantId?: string;
}

/** Properties merged into every event. Set once at bootstrap. */
export type SuperProperties = Readonly<Record<string, string | number | boolean>>;

export interface AnalyticsProvider {
 readonly name: string;
 /** Must never throw. A broken analytics vendor is not an outage. */
 track(event: string, properties: Record<string, unknown>): void;
 identify(identity: AnalyticsIdentity): void;
 /** Called on sign-out. Must clear the vendor's own device id where the vendor supports it. */
 reset(): void;
 /** Called when consent is revoked. Stronger than `reset` — stop sending entirely. */
 disable?(): void;
 /** Flush any buffered events. Called on `pagehide`. */
 flush?(): void | Promise<void>;
}

export interface Analytics {
 track<TName extends AnalyticsEventName>(
 event: TName,
 ...properties: Record<string, never> extends AnalyticsEventMap[TName]
 ? [properties?: AnalyticsEventMap[TName]]
 : [properties: AnalyticsEventMap[TName]]
 ): void;
 page(path: string, referrer?: string): void;
 identify(identity: AnalyticsIdentity): void;
 reset(): void;
 setConsent(consent: ConsentState): void;
 getConsent(): ConsentState;
 setSuperProperties(properties: SuperProperties): void;
 flush(): Promise<void>;
}
