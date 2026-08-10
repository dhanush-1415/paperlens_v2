import { describe, expect, it } from 'vitest';

import { describeStorageDriverContract } from '@/test/contracts/storage-driver.contract';

import {
 createLocalStorageDriver,
 createMemoryStorageDriver,
 createNoopStorageDriver,
 createSessionStorageDriver,
} from './drivers';
import { createStorageEntry } from './entry';

/**
 * Every driver runs the *same* suite. That is the whole point: the contract is written once
 * and each adapter either satisfies it or is not an adapter. Adding a driver means adding one
 * line here, and a driver that cannot pass never reaches the composition root.
 */
describeStorageDriverContract('memory', () => createMemoryStorageDriver());
describeStorageDriverContract('noop', () => createNoopStorageDriver());
// jsdom supplies real Web Storage, so the browser adapters are exercised for real rather
// than through a stand-in that would prove nothing about them.
describeStorageDriverContract('local', () => createLocalStorageDriver());
describeStorageDriverContract('session', () => createSessionStorageDriver());

describe('the web driver’s failure handling', () => {
 it('reports a failed write instead of throwing, and reads null afterwards', () => {
 const driver = createLocalStorageDriver();
 const original = Storage.prototype.setItem;

 // What Safari private mode and an exceeded quota actually look like.
 Storage.prototype.setItem = () => {
 throw new DOMException('QuotaExceededError', 'QuotaExceededError');
 };

 try {
 expect(driver.setItem('quota.key', 'value')).toBe(false);
 } finally {
 Storage.prototype.setItem = original;
 }
 });
});

describe('storage entries', () => {
 const makeDeps = (nowMs = { value: 1_000 }) => ({
 driver: createMemoryStorageDriver(),
 now: () => nowMs.value,
 });

 it('reads back what it wrote', () => {
 const entry = createStorageEntry({ key: 'k', version: 1, fallback: 'default' }, makeDeps());

 expect(entry.get()).toBe('default');
 expect(entry.set('written')).toBe(true);
 expect(entry.get()).toBe('written');
 });

 it('returns the fallback for absent, corrupt and version-mismatched data alike', () => {
 const deps = makeDeps();
 const entry = createStorageEntry({ key: 'k', version: 2, fallback: 'default' }, deps);

 // Absent.
 expect(entry.get()).toBe('default');

 // Not JSON — a key collision or a truncated write.
 deps.driver.setItem('k', 'not json at all');
 expect(entry.get()).toBe('default');
 expect(deps.driver.getItem('k')).toBeNull(); // and it cleans up after itself

 // JSON, but not an envelope.
 deps.driver.setItem('k', '{"hello":"world"}');
 expect(entry.get()).toBe('default');

 // Last release's shape. Discarded, never migrated on read.
 deps.driver.setItem('k', JSON.stringify({ v: 1, d: 'old shape' }));
 expect(entry.get()).toBe('default');
 });

 it('expires on read against the injected clock, not the system one', () => {
 const nowMs = { value: 1_000 };
 const deps = makeDeps(nowMs);
 const entry = createStorageEntry(
 { key: 'k', version: 1, fallback: 'default', ttlMs: 5_000 },
 deps,
 );

 entry.set('fresh');
 nowMs.value = 5_999;
 expect(entry.get()).toBe('fresh');

 nowMs.value = 6_001;
 expect(entry.get()).toBe('default');
 expect(deps.driver.getItem('k')).toBeNull();
 });

 it('rejects a value that fails validation — storage is user-writable input', () => {
 const deps = makeDeps();
 const isTheme = (value: unknown): value is 'light' | 'dark' =>
 value === 'light' || value === 'dark';

 const entry = createStorageEntry(
 { key: 'theme', version: 1, fallback: 'light' as const, validate: isTheme },
 deps,
 );

 // Exactly what a devtools console can write.
 deps.driver.setItem('theme', JSON.stringify({ v: 1, d: '<script>alert(1)</script>' }));

 expect(entry.get()).toBe('light');
 expect(deps.driver.getItem('theme')).toBeNull();
 });

 it('returns false rather than throwing when the value cannot be serialised', () => {
 const entry = createStorageEntry<Record<string, unknown>>(
 { key: 'k', version: 1, fallback: {} },
 makeDeps(),
 );

 const circular: Record<string, unknown> = {};
 circular.self = circular;

 expect(entry.set(circular)).toBe(false);
 });

 it('remove clears the key; reset restores the fallback in place', () => {
 const deps = makeDeps();
 const entry = createStorageEntry({ key: 'k', version: 1, fallback: 'default' }, deps);

 entry.set('written');
 entry.remove();
 expect(deps.driver.getItem('k')).toBeNull();

 entry.set('written');
 entry.reset();
 expect(entry.get()).toBe('default');
 expect(deps.driver.getItem('k')).not.toBeNull();
 });
});
