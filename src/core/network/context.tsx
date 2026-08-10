'use client';

/**
 * The React binding for network status.
 *
 * The monitor arrives through context rather than being constructed in the hook, for the
 * same reason everything else in this codebase is injected: a hook that builds its own
 * monitor is a hook that cannot be tested offline, and a module-level singleton monitor is
 * a global that survives between tests and leaks listeners.
 *
 * `useSyncExternalStore` rather than `useEffect` + `useState`. This is not stylistic — under
 * concurrent rendering, an effect-based subscription can render with a status that was
 * already stale when the render started (the "tearing" problem). `useSyncExternalStore`
 * exists specifically to make an external mutable source safe to read during render.
 */

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import { SERVER_NETWORK_STATUS } from './monitor';
import { allowsNonEssentialTraffic, isDegraded } from './policy';
import type { NetworkMonitor, NetworkStatus } from './types';

const NetworkMonitorContext = createContext<NetworkMonitor | null>(null);

export interface NetworkProviderProps {
 monitor: NetworkMonitor;
 children: ReactNode;
}

export function NetworkProvider({ monitor, children }: NetworkProviderProps) {
 return <NetworkMonitorContext value={monitor}>{children}</NetworkMonitorContext>;
}

/**
 * The monitor itself — for `probe()`, mostly.
 *
 * Throws when unmounted rather than returning a no-op fallback. A silent fallback would mean
 * an offline banner that never appears and nobody notices for a release.
 */
export function useNetworkMonitor(): NetworkMonitor {
 const monitor = useContext(NetworkMonitorContext);
 if (!monitor) {
 throw new Error('useNetworkMonitor must be used inside <NetworkProvider>.');
 }
 return monitor;
}

export function useNetworkStatus(): NetworkStatus {
 const monitor = useNetworkMonitor();

 return useSyncExternalStore(
 monitor.subscribe,
 monitor.getStatus,
 // The server snapshot must be a stable reference across calls, hence the frozen
 // constant. Returning a fresh object here throws in development.
 () => SERVER_NETWORK_STATUS,
 );
}

/** The common case: "is the browser offline right now?" */
export function useIsOffline(): boolean {
 return useNetworkStatus().connection === 'offline';
}

/** True when the UI should drop decorative work — slow link, save-data, or offline. */
export function useIsDegraded(): boolean {
 return isDegraded(useNetworkStatus());
}

/** Gate prefetching, autoplay and other optional traffic on this. */
export function useAllowsNonEssentialTraffic(): boolean {
 return allowsNonEssentialTraffic(useNetworkStatus());
}
