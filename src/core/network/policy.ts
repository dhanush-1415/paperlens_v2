/**
 * Offline policy (requirement 14).
 *
 * "Handle offline" is not one behaviour. Reading a cached document list while offline should
 * work silently; submitting a payment while offline should refuse loudly. The difference is
 * a property of the *operation*, so it is declared per operation class here rather than
 * decided ad hoc at each call site.
 *
 * The classes below are deliberately few. A taxonomy with fifteen entries is one nobody
 * chooses correctly.
 */

import type { NetworkStatus, OfflinePolicy } from './types';

export type OperationClass =
 /** Reading data that may already be cached. Let it try; the cache may answer. */
 | 'read'
 /** Creating or changing something the user can see. Must not be silently lost. */
 | 'mutation'
 /** Money, or anything with an external side effect that cannot be undone. */
 | 'critical'
 /** Analytics, telemetry, prefetch. Losing these is fine and the user must never be told. */
 | 'background';

const POLICIES: Record<OperationClass, (status: NetworkStatus) => OfflinePolicy> = {
 read: (status) => ({
 // Attempted even when offline: the request may be served from the HTTP cache or a
 // service worker, and a false "offline" that blocks a cached read is a worse experience
 // than a fetch that fails fast.
 shouldAttempt: true,
 blockUi: false,
 retryOnReconnect: true,
 messageKey: status.connection === 'offline' ? 'network.offlineStale' : 'network.slow',
 }),

 mutation: (status) => ({
 // Not attempted while the browser is certain it is offline. A mutation that fails
 // in-flight leaves the user unsure whether it applied; failing before it leaves is
 // unambiguous.
 shouldAttempt: status.connection === 'online',
 blockUi: status.connection === 'offline',
 retryOnReconnect: false,
 messageKey: 'network.offlineMutation',
 }),

 critical: (status) => ({
 // Stricter still: an unverified 'online' is not good enough when the operation cannot be
 // repeated safely. Callers should `probe()` first and re-evaluate.
 shouldAttempt: status.connection === 'online' && status.reachability !== 'unreachable',
 blockUi: true,
 // Never auto-retried. A retry policy on an irreversible operation is how one charge
 // becomes three.
 retryOnReconnect: false,
 messageKey: 'network.offlineCritical',
 }),

 background: (status) => ({
 shouldAttempt: status.connection === 'online' && !status.saveData,
 blockUi: false,
 retryOnReconnect: false,
 // Nothing user-facing. Background work failing is not the user's problem.
 messageKey: '',
 }),
};

export function resolveOfflinePolicy(
 operation: OperationClass,
 status: NetworkStatus,
): OfflinePolicy {
 return POLICIES[operation](status);
}

/**
 * Should non-essential work — prefetch, image upscaling, autoplay, polling — run at all?
 *
 * Respects Save-Data as an instruction rather than a hint. A user who turned it on is
 * telling us their bytes cost money.
 */
export function allowsNonEssentialTraffic(status: NetworkStatus): boolean {
 if (status.connection === 'offline') return false;
 if (status.saveData) return false;
 return status.quality !== 'slow-2g' && status.quality !== '2g';
}

/** True when the UI should visibly degrade — skeletons over spinners, no decorative media. */
export function isDegraded(status: NetworkStatus): boolean {
 return (
 status.connection === 'offline' ||
 status.reachability === 'unreachable' ||
 status.saveData ||
 status.quality === 'slow-2g' ||
 status.quality === '2g'
 );
}
