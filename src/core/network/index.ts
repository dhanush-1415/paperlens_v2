/**
 * Network — public API (requirement 14).
 *
 * `./context` is NOT re-exported: it is a `'use client'` module, and pulling it through this
 * barrel would drag a client boundary into every server file that only wanted `OfflinePolicy`.
 * Client components import `@/core/network/context` directly.
 */

export {
 SERVER_NETWORK_STATUS,
 createBrowserNetworkMonitor,
 createFakeNetworkMonitor,
 createNoopNetworkMonitor,
 type BrowserMonitorOptions,
 type FakeNetworkMonitor,
} from './monitor';

export {
 allowsNonEssentialTraffic,
 isDegraded,
 resolveOfflinePolicy,
 type OperationClass,
} from './policy';

export type {
 ConnectionQuality,
 ConnectionState,
 NetworkMonitor,
 NetworkStatus,
 OfflinePolicy,
 Reachability,
} from './types';
