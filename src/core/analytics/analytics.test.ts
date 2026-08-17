import { beforeEach, describe, expect, it } from 'vitest';

import { createMemoryStorageDriver } from '../storage/drivers';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { createLogger } from '../logging/logger';
import { createMemoryTransport } from '../logging/transports';
import { createAnalytics, createNoopAnalytics } from './analytics';
import {
  CONSENT_VERSION,
  createConsentStore,
  customConsent,
  denyAll,
  grantAll,
  needsConsentDecision,
} from './consent';
import { ANALYTICS_EVENTS, CONSENT_EXEMPT_EVENTS } from './events';
import {
  createLoggerAnalyticsProvider,
  createMemoryAnalyticsProvider,
  createNoopAnalyticsProvider,
} from './providers';
import { DEFAULT_CONSENT, type AnalyticsProvider, type ConsentState } from './types';

/**
 * Analytics.
 *
 * The tests that matter here are the ones about *not* sending. An analytics library that
 * fails to record an event costs a dashboard; an analytics library that records an event
 * before the user consented costs a regulatory finding. So the consent gate is tested from
 * both directions — that nothing escapes while consent is unknown, and that nothing is
 * *lost* either, because a facade that silently drops the first session is a facade someone
 * will be tempted to bypass.
 */

const granted: ConsentState = {
  essential: true,
  analytics: 'granted',
  marketing: 'granted',
  decidedAt: 1,
};
const denied: ConsentState = {
  essential: true,
  analytics: 'denied',
  marketing: 'denied',
  decidedAt: 1,
};

function harness(options: { consent?: ConsentState; maxBufferedEvents?: number } = {}) {
  const provider = createMemoryAnalyticsProvider();
  const transport = createMemoryTransport();
  const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
  const analytics = createAnalytics({
    providers: [provider],
    logger,
    now: () => 1_700_000_000_000,
    ...(options.consent ? { initialConsent: options.consent } : {}),
    ...(options.maxBufferedEvents !== undefined
      ? { maxBufferedEvents: options.maxBufferedEvents }
      : {}),
  });

  return { analytics, provider, transport };
}

describe('the consent gate', () => {
  it('sends nothing while consent is unknown', () => {
    const { analytics, provider } = harness();
    analytics.track('cta.clicked', { id: 'hero', surface: 'home' });

    expect(provider.events).toHaveLength(0);
  });

  it('buffers pre-consent events and flushes them on grant', () => {
    // Dropping these loses the first-session funnel — the one session that explains why a
    // visitor converted. Holding them costs nothing and is honest: they leave only if the
    // user says yes.
    const { analytics, provider } = harness();
    analytics.track('cta.clicked', { id: 'hero', surface: 'home' });
    analytics.page('/pricing');

    analytics.setConsent(granted);

    expect(provider.events.map((entry) => entry.event)).toEqual(['cta.clicked', 'page.viewed']);
  });

  it('discards the buffer on denial and never sends it', () => {
    const { analytics, provider } = harness();
    analytics.track('cta.clicked', { id: 'hero', surface: 'home' });

    analytics.setConsent(denied);
    analytics.setConsent(granted); // a later grant must not resurrect pre-denial events

    expect(provider.events).toHaveLength(0);
  });

  it('drops nothing but the oldest when the buffer overflows', () => {
    // A user who never answers the banner would otherwise accumulate the whole session.
    const { analytics, provider } = harness({ maxBufferedEvents: 2 });
    analytics.track('cta.clicked', { id: 'first', surface: 's' });
    analytics.track('cta.clicked', { id: 'second', surface: 's' });
    analytics.track('cta.clicked', { id: 'third', surface: 's' });

    analytics.setConsent(granted);

    expect(provider.events.map((entry) => entry.properties['id'])).toEqual(['second', 'third']);
  });

  it('sends nothing at all once consent is denied', () => {
    const { analytics, provider } = harness({ consent: denied });
    analytics.track('cta.clicked', { id: 'x', surface: 's' });
    analytics.page('/x');

    expect(provider.events).toHaveLength(0);
  });

  it('does not log a warning per suppressed event', () => {
    // A denied user generating a log line for every click is its own form of tracking.
    const { analytics, transport } = harness({ consent: denied });
    for (let i = 0; i < 5; i += 1) analytics.track('cta.clicked', { id: 'x', surface: 's' });

    expect(transport.records).toHaveLength(0);
  });

  it('disables and resets every provider when consent is revoked', () => {
    const calls: string[] = [];
    const provider: AnalyticsProvider = {
      name: 'p',
      track: () => undefined,
      identify: () => undefined,
      reset: () => calls.push('reset'),
      disable: () => calls.push('disable'),
    };
    const logger = createLogger({ scope: 'test', level: 'error', transports: [] });
    const analytics = createAnalytics({ providers: [provider], logger, initialConsent: granted });

    analytics.setConsent(denied);

    expect(calls).toEqual(['disable', 'reset']);
  });

  it('keeps the exempt-event list empty, so the exemption is a reviewed decision', () => {
    // The set exists so that "this one event is essential" has to be argued in this file,
    // under review, rather than in a pull-request comment.
    expect(CONSENT_EXEMPT_EVENTS.size).toBe(0);
  });

  it('reports the consent it is holding', () => {
    const { analytics } = harness();

    expect(analytics.getConsent()).toEqual(DEFAULT_CONSENT);
    analytics.setConsent(granted);
    expect(analytics.getConsent()).toEqual(granted);
  });
});

describe('enrichment', () => {
  it('merges super-properties into every event', () => {
    const { analytics, provider } = harness({ consent: granted });
    analytics.setSuperProperties({ plan: 'free', appVersion: '2.1.0' });
    analytics.track('cta.clicked', { id: 'x', surface: 's' });

    expect(provider.events[0]?.properties).toMatchObject({ plan: 'free', appVersion: '2.1.0' });
  });

  it('lets an event property win over a super-property of the same name', () => {
    const { analytics, provider } = harness({ consent: granted });
    analytics.setSuperProperties({ surface: 'global' });
    analytics.track('cta.clicked', { id: 'x', surface: 'specific' });

    expect(provider.events[0]?.properties['surface']).toBe('specific');
  });

  it('merges rather than replaces on a second setSuperProperties', () => {
    const { analytics, provider } = harness({ consent: granted });
    analytics.setSuperProperties({ plan: 'free' });
    analytics.setSuperProperties({ tenant: 'acme' });
    analytics.track('cta.clicked', { id: 'x', surface: 's' });

    expect(provider.events[0]?.properties).toMatchObject({ plan: 'free', tenant: 'acme' });
  });

  it('stamps the time the event happened, not the time it was sent', () => {
    // A buffered event flushed ten minutes later still belongs at its original point in the
    // session; re-stamping at send time would compress the whole pre-consent funnel into
    // one instant.
    const { analytics, provider } = harness();
    analytics.track('cta.clicked', { id: 'x', surface: 's' });
    analytics.setConsent(granted);

    expect(provider.events[0]?.properties['ts']).toBe(1_700_000_000_000);
  });

  it('accepts an event whose payload is empty', () => {
    const { analytics, provider } = harness({ consent: granted });
    analytics.track('vault.folder_created');

    expect(provider.events[0]?.event).toBe('vault.folder_created');
  });

  it('records the referrer only when there is one', () => {
    const { analytics, provider } = harness({ consent: granted });
    analytics.page('/a');
    analytics.page('/b', '/a');

    expect(provider.events[0]?.properties).not.toHaveProperty('referrer');
    expect(provider.events[1]?.properties['referrer']).toBe('/a');
  });
});

describe('identity', () => {
  it('does not identify before consent', () => {
    const { analytics, provider } = harness();
    analytics.identify({ userId: 'u1' });

    expect(provider.identities).toHaveLength(0);
  });

  it('replays identity before flushing the buffer', () => {
    // Order matters: flushed events must attach to the user, not to the anonymous device
    // they were recorded on.
    const seen: string[] = [];
    const provider: AnalyticsProvider = {
      name: 'p',
      track: () => seen.push('track'),
      identify: () => seen.push('identify'),
      reset: () => undefined,
    };
    const logger = createLogger({ scope: 'test', level: 'error', transports: [] });
    const analytics = createAnalytics({ providers: [provider], logger });

    analytics.identify({ userId: 'u1' });
    analytics.track('cta.clicked', { id: 'x', surface: 's' });
    analytics.setConsent(granted);

    expect(seen).toEqual(['identify', 'track']);
  });

  it('identifies immediately once consent is granted', () => {
    const { analytics, provider } = harness({ consent: granted });
    analytics.identify({ userId: 'u1', plan: 'pro' });

    expect(provider.identities[0]).toEqual({ userId: 'u1', plan: 'pro' });
  });

  it('clears identity and buffer on reset', () => {
    const { analytics, provider } = harness({ consent: granted });
    analytics.identify({ userId: 'u1' });
    analytics.reset();

    expect(provider.resetCount()).toBe(1);
  });
});

describe('provider isolation', () => {
  it('does not let a throwing provider break the caller', () => {
    // A click handler must not fail because a vendor SDK is having a bad day.
    const hostile: AnalyticsProvider = {
      name: 'hostile',
      track: () => {
        throw new Error('vendor is down');
      },
      identify: () => {
        throw new Error('vendor is down');
      },
      reset: () => undefined,
    };
    const healthy = createMemoryAnalyticsProvider();
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
    const analytics = createAnalytics({
      providers: [hostile, healthy],
      logger,
      initialConsent: granted,
    });

    expect(() => analytics.track('cta.clicked', { id: 'x', surface: 's' })).not.toThrow();
    expect(healthy.events).toHaveLength(1);
    expect(transport.records.some((record) => record.level === 'warn')).toBe(true);
  });

  it('survives a provider whose flush rejects', async () => {
    const logger = createLogger({ scope: 'test', level: 'error', transports: [] });
    const analytics = createAnalytics({
      logger,
      initialConsent: granted,
      providers: [
        {
          name: 'a',
          track: () => {},
          identify: () => {},
          reset: () => {},
          flush: () => Promise.reject(new Error('x')),
        },
        createMemoryAnalyticsProvider(),
      ],
    });

    await expect(analytics.flush()).resolves.toBeUndefined();
  });

  it('fans out to every provider', () => {
    const first = createMemoryAnalyticsProvider();
    const second = createMemoryAnalyticsProvider();
    const logger = createLogger({ scope: 'test', level: 'error', transports: [] });
    createAnalytics({ providers: [first, second], logger, initialConsent: granted }).track(
      'cta.clicked',
      { id: 'x', surface: 's' },
    );

    expect(first.events).toHaveLength(1);
    expect(second.events).toHaveLength(1);
  });
});

describe('the shipped providers', () => {
  it('noop accepts every call and records nothing', () => {
    const provider = createNoopAnalyticsProvider();

    expect(() => {
      provider.track('x', {});
      provider.identify({ userId: 'u' });
      provider.reset();
    }).not.toThrow();
  });

  it('the logger provider writes the event to the analytics scope', () => {
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'app', level: 'trace', transports: [transport] });
    createLoggerAnalyticsProvider(logger).track('document.analyzed', { flagCount: 3 });

    expect(transport.records[0]?.scope).toBe('app.analytics');
    expect(transport.records[0]?.context['event']).toBe('document.analyzed');
  });

  it('the noop facade satisfies the full interface', async () => {
    const analytics = createNoopAnalytics();

    expect(analytics.getConsent()).toEqual(DEFAULT_CONSENT);
    await expect(analytics.flush()).resolves.toBeUndefined();
  });
});

describe('the event registry', () => {
  it('names every event noun.verb_past_tense', () => {
    // Consistency here is what keeps a funnel query from silently missing half its rows.
    for (const name of Object.values(ANALYTICS_EVENTS)) {
      expect(name, name).toMatch(/^[a-z_]+\.[a-z_]+$/);
    }
  });

  it('has no duplicate wire names', () => {
    const names = Object.values(ANALYTICS_EVENTS);

    expect(new Set(names).size).toBe(names.length);
  });
});

describe('consent persistence', () => {
  let driver: ReturnType<typeof createMemoryStorageDriver>;

  beforeEach(() => {
    driver = createMemoryStorageDriver();
  });

  it('starts at the default when nothing is stored', () => {
    expect(createConsentStore(driver).get()).toEqual(DEFAULT_CONSENT);
  });

  it('round-trips a decision', () => {
    const store = createConsentStore(driver);
    store.set(grantAll(1_000));

    expect(createConsentStore(driver).get().analytics).toBe('granted');
  });

  it('re-asks when the stored version is stale', () => {
    // A new consent category is a question the user has never been asked. Honouring an old
    // "yes" for it would be consent they did not give.
    const store = createConsentStore(driver);
    store.set(grantAll(1_000));

    const raw = JSON.parse(driver.getItem(STORAGE_KEYS.consent) ?? '{}') as Record<string, unknown>;
    driver.setItem(STORAGE_KEYS.consent, JSON.stringify({ ...raw, v: CONSENT_VERSION + 1 }));

    expect(createConsentStore(driver).get()).toEqual(DEFAULT_CONSENT);
  });

  it('rejects a stored shape that is not consent at all', () => {
    driver.setItem(STORAGE_KEYS.consent, JSON.stringify({ v: CONSENT_VERSION, value: 'yes' }));

    expect(createConsentStore(driver).get()).toEqual(DEFAULT_CONSENT);
  });

  it('shows the banner only while a category is unanswered', () => {
    expect(needsConsentDecision(DEFAULT_CONSENT)).toBe(true);
    expect(needsConsentDecision(grantAll(1))).toBe(false);
    expect(needsConsentDecision(denyAll(1))).toBe(false);
  });

  it('records an unspecified custom choice as denied, never as unknown', () => {
    // `unknown` would re-prompt them for a question they just answered.
    const choice = customConsent({ analytics: true }, 5);

    expect(choice.analytics).toBe('granted');
    expect(choice.marketing).toBe('denied');
    expect(choice.decidedAt).toBe(5);
  });

  it('keeps essential consent true in every shape', () => {
    for (const state of [grantAll(1), denyAll(1), customConsent({}, 1), DEFAULT_CONSENT]) {
      expect(state.essential).toBe(true);
    }
  });
});
