/**
 * Network monitors.
 *
 * The browser monitor is the only place `navigator.onLine` and the Network Information API
 * are read. Both are partially-implemented, spec-unstable APIs, so they are feature-detected
 * and typed locally rather than trusted from `lib.dom`.
 */

import { isServer } from '@/config/runtime';

import type {
 ConnectionQuality,
 ConnectionState,
 NetworkMonitor,
 NetworkStatus,
 Reachability,
} from './types';

/**
 * The Network Information API, declared here because TypeScript's DOM lib does not include
 * it — it is a Chromium extension, not a shipped standard.
 */
interface NetworkInformationLike {
 effectiveType?: string;
 saveData?: boolean;
 addEventListener?: (type: 'change', listener: () => void) => void;
 removeEventListener?: (type: 'change', listener: () => void) => void;
}

/**
 * The status the server always reports.
 *
 * A single frozen object, not a fresh one per call: `useSyncExternalStore` compares the
 * server snapshot by reference and throws "The result of getServerSnapshot should be cached"
 * if it changes between calls.
 */
export const SERVER_NETWORK_STATUS: NetworkStatus = Object.freeze({
 connection: 'online',
 reachability: 'unknown',
 quality: 'unknown',
 saveData: false,
 changedAt: 0,
});

function readConnectionInfo(): NetworkInformationLike | undefined {
 const nav = navigator as Navigator & { connection?: NetworkInformationLike };
 return nav.connection;
}

function toQuality(effectiveType: string | undefined): ConnectionQuality {
 switch (effectiveType) {
 case 'slow-2g':
 case '2g':
 case '3g':
 case '4g':
 return effectiveType;
 default:
 return 'unknown';
 }
}

export interface BrowserMonitorOptions {
 /**
 * A cheap, cacheable, same-origin URL used to test reachability.
 *
 * Same-origin on purpose: probing a third party (the usual `google.com/generate_204`)
 * tells you the *internet* is up, which is not the question. The question is whether
 * *this* app's server is answering.
 */
 probeUrl?: string;
 probeTimeoutMs?: number;
 fetchImpl?: typeof fetch;
 now?: () => number;
}

export function createBrowserNetworkMonitor(options: BrowserMonitorOptions = {}): NetworkMonitor {
 const {
 probeUrl = '/api/health',
 probeTimeoutMs = 3_000,
 fetchImpl = globalThis.fetch,
 now = () => Date.now(),
 } = options;

 const listeners = new Set<() => void>();

 let status: NetworkStatus = readStatus('unknown');

 function readStatus(reachability: Reachability): NetworkStatus {
 // Rendering on the server, there is no client connection to describe. Reporting 'online'
 // keeps SSR output identical to the optimistic first client render, which is what avoids
 // a hydration mismatch on every page.
 if (isServer) return SERVER_NETWORK_STATUS;

 const info = readConnectionInfo();
 const connection: ConnectionState = navigator.onLine ? 'online' : 'offline';

 return {
 connection,
 // An explicitly offline browser is unreachable by definition; no probe needed.
 reachability: connection === 'offline' ? 'unreachable' : reachability,
 quality: toQuality(info?.effectiveType),
 saveData: info?.saveData === true,
 changedAt: now(),
 };
 }

 function emit(next: NetworkStatus): void {
 // Reference equality is what `useSyncExternalStore` compares, so a no-op change must not
 // produce a new object or every listener re-renders on every `change` event.
 if (
 next.connection === status.connection &&
 next.reachability === status.reachability &&
 next.quality === status.quality &&
 next.saveData === status.saveData
 ) {
 return;
 }

 status = next;
 for (const listener of listeners) listener();
 }

 function handleOnline(): void {
 // Coming back online is exactly when the browser's optimism is least reliable — the
 // interface is up before the uplink is. Probe rather than announce.
 emit(readStatus('unknown'));
 void probe();
 }

 function handleOffline(): void {
 emit(readStatus('unreachable'));
 }

 function handleChange(): void {
 emit(readStatus(status.reachability));
 }

 async function probe(): Promise<Reachability> {
 if (isServer || !navigator.onLine) {
 emit(readStatus('unreachable'));
 return 'unreachable';
 }

 try {
 const response = await fetchImpl(probeUrl, {
 method: 'HEAD',
 cache: 'no-store',
 signal: AbortSignal.timeout(probeTimeoutMs),
 });
 // Any answer at all — including a 500 — means the network path works. This probes
 // connectivity, not health; conflating the two would show an offline banner during an
 // outage the user could otherwise read an error page about.
 const result: Reachability = response.status > 0 ? 'reachable' : 'unreachable';
 emit(readStatus(result));
 return result;
 } catch {
 emit(readStatus('unreachable'));
 return 'unreachable';
 }
 }

 if (!isServer) {
 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);
 readConnectionInfo()?.addEventListener?.('change', handleChange);
 }

 return {
 name: 'browser',
 getStatus: () => status,
 subscribe(listener) {
 listeners.add(listener);
 return () => {
 listeners.delete(listener);
 };
 },
 probe,
 dispose() {
 listeners.clear();
 if (isServer) return;
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 readConnectionInfo()?.removeEventListener?.('change', handleChange);
 },
 };
}

/**
 * Controllable monitor for tests and Storybook.
 *
 * `set()` is the whole point: offline behaviour is otherwise untestable without pulling a
 * cable, so it goes untested, so it is broken. This makes "what does the app do on a
 * flapping connection" a unit test.
 */
export interface FakeNetworkMonitor extends NetworkMonitor {
 set(partial: Partial<NetworkStatus>): void;
}

export function createFakeNetworkMonitor(initial: Partial<NetworkStatus> = {}): FakeNetworkMonitor {
 const listeners = new Set<() => void>();

 let status: NetworkStatus = {
 connection: 'online',
 reachability: 'reachable',
 quality: 'unknown',
 saveData: false,
 changedAt: 0,
 ...initial,
 };

 return {
 name: 'fake',
 getStatus: () => status,
 subscribe(listener) {
 listeners.add(listener);
 return () => {
 listeners.delete(listener);
 };
 },
 probe: () => Promise.resolve(status.reachability),
 dispose: () => listeners.clear(),
 set(partial) {
 status = { ...status, ...partial, changedAt: status.changedAt + 1 };
 for (const listener of listeners) listener();
 },
 };
}

/** Always online, never notifies. The server-side and opt-out implementation. */
export function createNoopNetworkMonitor(): NetworkMonitor {
 return {
 name: 'noop',
 getStatus: () => SERVER_NETWORK_STATUS,
 subscribe: () => () => undefined,
 probe: () => Promise.resolve('unknown'),
 dispose: () => undefined,
 };
}
