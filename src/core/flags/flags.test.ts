import { describe, expect, it, vi } from 'vitest';

import { createLogger } from '../logging/logger';
import { createMemoryTransport } from '../logging/transports';
import { createDefaultFlags, createFlags } from './flags';
import {
 createMemoryFlagProvider,
 createNoopFlagProvider,
 createRemoteFlagProvider,
 createStaticFlagProvider,
} from './providers';
import { expiredFlags, FLAG_BY_KEY, FLAGS, type FlagName } from './registry';
import type { FlagContext, FlagProvider } from './types';

/**
 * Feature flags.
 *
 * The interesting assertions here are all about *degradation*. A flag system that works when
 * everything is healthy is easy; the requirement is that a flag service outage leaves the app
 * in its shipped state rather than taking the product down with it. That is a property of
 * `resolve()`, and it is only observable under failure — so the failures are what is tested.
 */

const context: FlagContext = { environment: 'test' };

function flagsWith(providers: readonly FlagProvider[]) {
 const transport = createMemoryTransport();
 const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
 return { flags: createFlags({ providers, context, logger }), transport };
}

describe('the registry', () => {
 it('declares an owner, a kind and an expiry for every flag', () => {
 // These four fields are the reason flag systems rot. A flag with no owner is never
 // deleted; a flag with no expiry is never reviewed.
 for (const [name, definition] of Object.entries(FLAGS)) {
 expect(definition.owner, name).toBeTruthy();
 expect(definition.description, name).toBeTruthy();
 expect(definition.kind, name).toBeTruthy();
 expect(new Date(definition.expiresOn).getTime(), name).not.toBeNaN();
 }
 });

 it('has unique wire keys, and a reverse map covering all of them', () => {
 const keys = Object.values(FLAGS).map((definition) => definition.key);

 expect(new Set(keys).size).toBe(keys.length);
 expect(FLAG_BY_KEY.size).toBe(keys.length);
 expect(FLAG_BY_KEY.get('document-chat')).toBe('documentChat');
 });

 it('names no expired flag today', () => {
 // This is the mechanism that actually keeps the flag count down: the reminder arrives in
 // CI rather than in a quarterly cleanup that never happens. `now` is a parameter so the
 // assertion is deterministic and the failure date is legible.
 expect(expiredFlags(new Date('2026-08-04T00:00:00.000Z'))).toEqual([]);
 });

 it('detects a flag past its date', () => {
 expect(expiredFlags(new Date('2099-12-31T00:00:00.000Z')).length).toBeGreaterThan(0);
 });
});

describe('resolution', () => {
 it('returns the registry default when no provider answers', () => {
 const { flags } = flagsWith([createNoopFlagProvider()]);

 expect(flags.get('documentChat')).toBe(FLAGS.documentChat.defaultValue);
 expect(flags.get('pricingLayout')).toBe('control');
 expect(flags.get('scanConcurrencyLimit')).toBe(2);
 });

 it('takes the first provider with an opinion, in stack order', () => {
 const high = createMemoryFlagProvider({ 'pricing-layout': 'variant-a' });
 const low = createMemoryFlagProvider({ 'pricing-layout': 'variant-b' });

 expect(flagsWith([high, low]).flags.get('pricingLayout')).toBe('variant-a');
 });

 it('defers to the next provider when one has no opinion', () => {
 // `undefined` meaning "no opinion" is what makes providers layerable: an override
 // provider answers for the two flags a developer is toggling and defers on the rest.
 const empty = createMemoryFlagProvider();
 const answering = createMemoryFlagProvider({ 'pricing-layout': 'variant-c' });

 expect(flagsWith([empty, answering]).flags.get('pricingLayout')).toBe('variant-c');
 });

 it('rejects a provider answer of the wrong type and warns', () => {
 // A remote service that serializes everything as JSON strings will send `"false"`, and
 // coercing that to `true` is the bug that costs a day. Refusing is louder and cheaper.
 const { flags, transport } = flagsWith([
 createMemoryFlagProvider({ 'vault-enabled': 'false' }),
 ]);

 expect(flags.get('vaultEnabled')).toBe(true);
 expect(transport.records[0]?.message).toContain('wrong type');
 });

 it('skips a provider that throws rather than failing the render', () => {
 const broken: FlagProvider = {
 name: 'broken',
 evaluate() {
 throw new Error('flag service exploded');
 },
 };
 const { flags, transport } = flagsWith([broken, createMemoryFlagProvider({
 'pricing-layout': 'variant-d',
 })]);

 expect(flags.get('pricingLayout')).toBe('variant-d');
 expect(transport.records[0]?.level).toBe('warn');
 });

 it('narrows isEnabled to true only for a literal true', () => {
 const { flags } = flagsWith([createStaticFlagProvider({ 'document-chat': true })]);

 expect(flags.isEnabled('documentChat')).toBe(true);
 expect(flags.isEnabled('vaultEnabled')).toBe(true);
 });

 it('reports every flag in a snapshot', () => {
 const { flags } = flagsWith([createMemoryFlagProvider({ 'document-chat': true })]);
 const snapshot = flags.snapshot();

 expect(Object.keys(snapshot).sort()).toEqual(Object.keys(FLAGS).sort());
 expect(snapshot.documentChat).toBe(true);
 });

 it('notifies onEvaluate with the value and the provider that supplied it', () => {
 const onEvaluate = vi.fn();
 const logger = createLogger({ scope: 't', level: 'trace', transports: [] });
 const flags = createFlags({
 providers: [createMemoryFlagProvider({ 'document-chat': true })],
 context,
 logger,
 onEvaluate,
 });

 flags.get('documentChat');
 flags.get('pricingLayout');

 expect(onEvaluate).toHaveBeenNthCalledWith(1, 'documentChat', true, 'memory');
 expect(onEvaluate).toHaveBeenNthCalledWith(2, 'pricingLayout', 'control', 'default');
 });
});

describe('context and refresh', () => {
 it('passes the current context to providers, and can replace it', () => {
 const seen: FlagContext[] = [];
 const spy: FlagProvider = {
 name: 'spy',
 evaluate(_key, ctx) {
 seen.push(ctx);
 return undefined;
 },
 };
 const { flags } = flagsWith([spy]);

 flags.get('documentChat');
 flags.setContext({ environment: 'test', userId: 'u1', plan: 'pro' });
 flags.get('documentChat');

 expect(seen[0]).toMatchObject({ environment: 'test' });
 expect(seen[1]).toMatchObject({ userId: 'u1', plan: 'pro' });
 });

 it('refreshes every provider that supports it', async () => {
 const a = createMemoryFlagProvider();
 const b = createMemoryFlagProvider();
 const { flags } = flagsWith([a, b, createNoopFlagProvider()]);

 await flags.refresh();

 expect(a.refreshCount()).toBe(1);
 expect(b.refreshCount()).toBe(1);
 });

 it('survives one provider’s refresh rejecting', async () => {
 const good = createMemoryFlagProvider();
 const bad: FlagProvider = {
 name: 'bad',
 evaluate: () => undefined,
 refresh: () => Promise.reject(new Error('network')),
 };
 const { flags, transport } = flagsWith([bad, good]);

 await expect(flags.refresh()).resolves.toBeUndefined();
 expect(good.refreshCount()).toBe(1);
 expect(transport.records[0]?.message).toContain('refresh failed');
 });
});

describe('the remote provider', () => {
 it('serves the snapshot it last fetched', async () => {
 const provider = createRemoteFlagProvider({
 fetchSnapshot: () => Promise.resolve({ 'pricing-layout': 'remote-variant' }),
 });

 expect(provider.evaluate('pricing-layout', context)).toBeUndefined();
 await provider.refresh?.(context);
 expect(provider.evaluate('pricing-layout', context)).toBe('remote-variant');
 });

 it('keeps the previous snapshot when a refresh fails', async () => {
 const onError = vi.fn();
 let shouldFail = false;
 const provider = createRemoteFlagProvider({
 fetchSnapshot: () =>
 shouldFail
 ? Promise.reject(new Error('502'))
 : Promise.resolve({ 'pricing-layout': 'held' }),
 onError,
 });

 await provider.refresh?.(context);
 shouldFail = true;
 await provider.refresh?.(context);

 // A flag-service outage must freeze flags at their last known values. Clearing them
 // would stampede every user back to defaults and turn a config outage into a product one.
 expect(provider.evaluate('pricing-layout', context)).toBe('held');
 expect(onError).toHaveBeenCalledOnce();
 });

 it('can start from an initial snapshot', () => {
 const provider = createRemoteFlagProvider({
 fetchSnapshot: () => Promise.resolve({}),
 initial: { 'document-chat': true },
 });

 expect(provider.evaluate('document-chat', context)).toBe(true);
 });
});

describe('the memory provider', () => {
 it('is settable and clearable', () => {
 const provider = createMemoryFlagProvider();

 provider.set('document-chat', true);
 expect(provider.evaluate('document-chat', context)).toBe(true);

 provider.clear();
 expect(provider.evaluate('document-chat', context)).toBeUndefined();
 });
});

describe('createDefaultFlags', () => {
 it('is a real Flags object pinned to the registry defaults', () => {
 // Returning this rather than `null` before the container is wired means no call site
 // needs a null check, and the server render matches the shipped state exactly.
 const flags = createDefaultFlags();

 expect(flags.get('pricingLayout')).toBe('control');
 expect(flags.isEnabled('vaultEnabled')).toBe(true);
 expect(flags.isEnabled('documentChat')).toBe(false);
 expect(Object.keys(flags.snapshot()) as FlagName[]).toHaveLength(Object.keys(FLAGS).length);
 });

 it('accepts a context change and a refresh without doing anything', async () => {
 const flags = createDefaultFlags();

 flags.setContext({ environment: 'test' });
 await expect(flags.refresh()).resolves.toBeUndefined();
 });
});
