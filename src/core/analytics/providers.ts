/**
 * Analytics provider adapters.
 *
 * No real vendor is wired up. That is the brief: ports now, providers when one is chosen.
 * What matters is that the three below satisfy the same interface a vendor SDK will, so
 * adding PostHog later is a new file in this directory and one line in the composition root.
 */

import type { AnalyticsIdentity, AnalyticsProvider } from './types';
import type { Logger } from '../logging/types';

/** Discards everything. The production default until a vendor is chosen. */
export function createNoopAnalyticsProvider(): AnalyticsProvider {
 return {
 name: 'noop',
 track: () => undefined,
 identify: () => undefined,
 reset: () => undefined,
 };
}

/**
 * Writes events to the structured logger.
 *
 * The development provider. Being able to *see* the event stream while building a funnel is
 * what stops the funnel from being wrong — a silent provider means analytics bugs are only
 * discovered on the dashboard, weeks later.
 */
export function createLoggerAnalyticsProvider(logger: Logger): AnalyticsProvider {
 const scoped = logger.child('analytics');

 return {
 name: 'logger',
 track: (event, properties) => scoped.info('track', { event, properties }),
 identify: (identity) => scoped.info('identify', { ...identity }),
 reset: () => scoped.info('reset'),
 };
}

/** Records calls in arrays. The test double — assertions read directly off these. */
export interface MemoryAnalyticsProvider extends AnalyticsProvider {
 readonly events: Array<{ event: string; properties: Record<string, unknown> }>;
 readonly identities: AnalyticsIdentity[];
 resetCount(): number;
}

export function createMemoryAnalyticsProvider(): MemoryAnalyticsProvider {
 const events: Array<{ event: string; properties: Record<string, unknown> }> = [];
 const identities: AnalyticsIdentity[] = [];
 let resets = 0;

 return {
 name: 'memory',
 events,
 identities,
 track: (event, properties) => {
 events.push({ event, properties });
 },
 identify: (identity) => {
 identities.push(identity);
 },
 reset: () => {
 resets += 1;
 },
 resetCount: () => resets,
 };
}
