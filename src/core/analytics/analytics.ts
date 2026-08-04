/**
 * The analytics facade (requirement 16).
 *
 * One object, injected once, that owns four things no individual vendor adapter should:
 *
 * 1. **The consent gate.** Nothing leaves the device while `analytics` consent is `unknown`
 *    or `denied`. This is the whole reason a facade exists — a consent check duplicated
 *    across providers is a consent check that will eventually be missed in one of them.
 * 2. **The pre-consent buffer.** Events fired before the user answers the banner are held,
 *    not dropped. If they then grant consent, the buffer flushes; if they deny, it is
 *    discarded. Dropping them loses the first-session funnel, which is the session that
 *    matters most; sending them is a violation.
 * 3. **Super-properties.** Plan, tenant, app version, applied uniformly.
 * 4. **Fan-out and isolation.** Every provider call is wrapped: a vendor SDK that throws must
 *    not take a click handler with it.
 */

import { CONSENT_EXEMPT_EVENTS, type AnalyticsEventMap, type AnalyticsEventName } from './events';
import {
  DEFAULT_CONSENT,
  type Analytics,
  type AnalyticsIdentity,
  type AnalyticsProvider,
  type ConsentState,
  type SuperProperties,
} from './types';
import type { Logger } from '../logging/types';

export interface AnalyticsOptions {
  providers: readonly AnalyticsProvider[];
  logger: Logger;
  initialConsent?: ConsentState;
  superProperties?: SuperProperties;
  /**
   * Cap on the pre-consent buffer.
   *
   * Bounded because a user who never answers the banner would otherwise accumulate events
   * for the whole session. Overflow drops the oldest, so the buffer keeps the events closest
   * to the consent decision.
   */
  maxBufferedEvents?: number;
  now?: () => number;
}

interface QueuedEvent {
  event: string;
  properties: Record<string, unknown>;
}

export function createAnalytics(options: AnalyticsOptions): Analytics {
  const {
    providers,
    logger,
    initialConsent = DEFAULT_CONSENT,
    superProperties: initialSuper = {},
    maxBufferedEvents = 50,
    now = () => Date.now(),
  } = options;

  const scoped = logger.child('analytics');

  let consent: ConsentState = initialConsent;
  let superProperties: SuperProperties = initialSuper;
  let identity: AnalyticsIdentity | null = null;
  let buffer: QueuedEvent[] = [];

  /** Never let a vendor's failure surface as an application error. */
  function safely(action: () => void, provider: string, operation: string): void {
    try {
      action();
    } catch (error) {
      scoped.warn('provider call failed', { provider, operation, error });
    }
  }

  function dispatch(queued: QueuedEvent): void {
    for (const provider of providers) {
      safely(() => provider.track(queued.event, queued.properties), provider.name, 'track');
    }
  }

  function enrich(properties: Record<string, unknown>): Record<string, unknown> {
    return {
      ...superProperties,
      ...properties,
      // Stamped at emit time, not at send time: a buffered event that flushes ten minutes
      // later must still report when it actually happened.
      ts: now(),
    };
  }

  function emit(event: AnalyticsEventName, properties: Record<string, unknown>): void {
    const queued: QueuedEvent = { event, properties: enrich(properties) };

    if (consent.analytics === 'granted' || CONSENT_EXEMPT_EVENTS.has(event)) {
      dispatch(queued);
      return;
    }

    if (consent.analytics === 'denied') {
      // Not buffered, not logged as a warning. A denied user generating log noise for every
      // interaction is its own kind of surveillance.
      return;
    }

    buffer.push(queued);
    if (buffer.length > maxBufferedEvents) buffer.shift();
  }

  function flushBuffer(): void {
    const pending = buffer;
    buffer = [];
    for (const queued of pending) dispatch(queued);
  }

  return {
    track(event, ...rest) {
      const [properties] = rest;
      emit(event, (properties ?? {}) as Record<string, unknown>);
    },

    page(path, referrer) {
      const properties: AnalyticsEventMap['page.viewed'] = referrer ? { path, referrer } : { path };
      emit('page.viewed', properties);
    },

    identify(next) {
      identity = next;
      if (consent.analytics !== 'granted') return;

      for (const provider of providers) {
        safely(() => provider.identify(next), provider.name, 'identify');
      }
    },

    reset() {
      identity = null;
      buffer = [];
      for (const provider of providers) {
        safely(() => provider.reset(), provider.name, 'reset');
      }
    },

    setConsent(next) {
      const previous = consent;
      consent = next;

      if (next.analytics === 'granted' && previous.analytics !== 'granted') {
        // Identity is replayed before the buffer so the flushed events attach to the right
        // user rather than to an anonymous device.
        if (identity) {
          const current = identity;
          for (const provider of providers) {
            safely(() => provider.identify(current), provider.name, 'identify');
          }
        }
        flushBuffer();
        return;
      }

      if (next.analytics === 'denied') {
        buffer = [];
        for (const provider of providers) {
          safely(() => provider.disable?.(), provider.name, 'disable');
          safely(() => provider.reset(), provider.name, 'reset');
        }
      }
    },

    getConsent: () => consent,

    setSuperProperties(properties) {
      superProperties = { ...superProperties, ...properties };
    },

    async flush() {
      await Promise.all(
        providers.map(async (provider) => {
          try {
            await provider.flush?.();
          } catch (error) {
            scoped.warn('provider flush failed', { provider: provider.name, error });
          }
        }),
      );
    },
  };
}

/**
 * An analytics facade that does nothing.
 *
 * For server-side code paths and tests. Returning this rather than `null` keeps every call
 * site free of `analytics?.track(...)`, which is how a null check eventually gets forgotten
 * in the one place it mattered.
 */
export function createNoopAnalytics(): Analytics {
  return {
    track: () => undefined,
    page: () => undefined,
    identify: () => undefined,
    reset: () => undefined,
    setConsent: () => undefined,
    getConsent: () => DEFAULT_CONSENT,
    setSuperProperties: () => undefined,
    flush: () => Promise.resolve(),
  };
}
