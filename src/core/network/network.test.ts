import { describe, expect, it, vi } from 'vitest';

import {
  SERVER_NETWORK_STATUS,
  createBrowserNetworkMonitor,
  createFakeNetworkMonitor,
  createNoopNetworkMonitor,
} from './monitor';
import { allowsNonEssentialTraffic, isDegraded, resolveOfflinePolicy } from './policy';
import type { NetworkStatus } from './types';

/**
 * Network awareness.
 *
 * Two things are being protected here. First, that a "network changed" event which changed
 * nothing does not re-render the tree — `useSyncExternalStore` compares snapshots by
 * reference, so an eagerly-allocated status object turns every `change` event on a mobile
 * connection into a full re-render. Second, that offline behaviour is a policy decision made
 * once per operation class rather than an `if (navigator.onLine)` scattered across features.
 */

function status(partial: Partial<NetworkStatus> = {}): NetworkStatus {
  return {
    connection: 'online',
    reachability: 'reachable',
    quality: '4g',
    saveData: false,
    changedAt: 0,
    ...partial,
  };
}

describe('the offline policy', () => {
  it('lets a read through even when offline, because the cache may answer', () => {
    // Blocking a read that the HTTP cache could have served is a worse experience than a
    // fetch that fails fast — the user sees a false "you are offline" over content that
    // was sitting on their disk.
    const policy = resolveOfflinePolicy('read', status({ connection: 'offline' }));

    expect(policy.shouldAttempt).toBe(true);
    expect(policy.blockUi).toBe(false);
    expect(policy.retryOnReconnect).toBe(true);
  });

  it('refuses a mutation while the browser is certain it is offline', () => {
    // A mutation that fails in-flight leaves the user unsure whether it applied. Failing
    // before it leaves the device is unambiguous.
    const policy = resolveOfflinePolicy('mutation', status({ connection: 'offline' }));

    expect(policy.shouldAttempt).toBe(false);
    expect(policy.blockUi).toBe(true);
    expect(policy.messageKey).toBe('network.offlineMutation');
  });

  it('never auto-retries a critical operation', () => {
    // Money. A retry policy on an irreversible operation is how one charge becomes three.
    for (const state of [status(), status({ connection: 'offline' })]) {
      expect(resolveOfflinePolicy('critical', state).retryOnReconnect).toBe(false);
    }
  });

  it('treats an unverified connection as insufficient for critical work', () => {
    // `navigator.onLine` reports the interface, not the uplink: a captive portal is "online".
    // For an operation that cannot be repeated safely, that is not good enough.
    expect(
      resolveOfflinePolicy('critical', status({ reachability: 'unreachable' })).shouldAttempt,
    ).toBe(false);
  });

  it('says nothing to the user about background work', () => {
    // Losing a telemetry ping is fine. Telling the user about it is not.
    const policy = resolveOfflinePolicy('background', status({ connection: 'offline' }));

    expect(policy.shouldAttempt).toBe(false);
    expect(policy.blockUi).toBe(false);
    expect(policy.messageKey).toBe('');
  });

  it('suppresses background work under Save-Data even while online', () => {
    expect(resolveOfflinePolicy('background', status({ saveData: true })).shouldAttempt).toBe(
      false,
    );
  });

  it('allows everything on a healthy connection', () => {
    for (const operation of ['read', 'mutation', 'critical', 'background'] as const) {
      expect(resolveOfflinePolicy(operation, status()).shouldAttempt, operation).toBe(true);
    }
  });

  it('gives every user-facing class a message key to render', () => {
    for (const operation of ['read', 'mutation', 'critical'] as const) {
      expect(
        resolveOfflinePolicy(operation, status({ connection: 'offline' })).messageKey,
        operation,
      ).toMatch(/^network\./);
    }
  });
});

describe('save-data and slow connections', () => {
  it('honours Save-Data as an instruction, not a hint', () => {
    // The user turned it on. They are telling us their bytes cost money.
    expect(allowsNonEssentialTraffic(status({ saveData: true }))).toBe(false);
  });

  it('suppresses non-essential traffic on 2g', () => {
    expect(allowsNonEssentialTraffic(status({ quality: 'slow-2g' }))).toBe(false);
    expect(allowsNonEssentialTraffic(status({ quality: '2g' }))).toBe(false);
    expect(allowsNonEssentialTraffic(status({ quality: '3g' }))).toBe(true);
  });

  it('allows non-essential traffic on an unknown-quality connection', () => {
    // Most browsers do not implement the Network Information API at all. Treating "unknown"
    // as slow would degrade the experience for every Safari and Firefox user.
    expect(allowsNonEssentialTraffic(status({ quality: 'unknown' }))).toBe(true);
  });

  it('marks the UI degraded for every constrained case', () => {
    expect(isDegraded(status({ connection: 'offline' }))).toBe(true);
    expect(isDegraded(status({ reachability: 'unreachable' }))).toBe(true);
    expect(isDegraded(status({ saveData: true }))).toBe(true);
    expect(isDegraded(status({ quality: '2g' }))).toBe(true);
    expect(isDegraded(status())).toBe(false);
  });
});

describe('the fake monitor', () => {
  it('notifies subscribers on a change', () => {
    const monitor = createFakeNetworkMonitor();
    const listener = vi.fn();
    monitor.subscribe(listener);

    monitor.set({ connection: 'offline' });

    expect(listener).toHaveBeenCalledOnce();
    expect(monitor.getStatus().connection).toBe('offline');
  });

  it('stops notifying after unsubscribe', () => {
    const monitor = createFakeNetworkMonitor();
    const listener = vi.fn();
    monitor.subscribe(listener)();

    monitor.set({ connection: 'offline' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('makes a flapping connection a unit test', () => {
    // The whole reason this fake exists: offline behaviour is otherwise untestable without
    // pulling a cable, so it goes untested, so it is broken.
    const monitor = createFakeNetworkMonitor();
    const seen: string[] = [];
    monitor.subscribe(() => seen.push(monitor.getStatus().connection));

    monitor.set({ connection: 'offline' });
    monitor.set({ connection: 'online' });
    monitor.set({ connection: 'offline' });

    expect(seen).toEqual(['offline', 'online', 'offline']);
  });

  it('accepts an initial status', () => {
    expect(createFakeNetworkMonitor({ saveData: true }).getStatus().saveData).toBe(true);
  });

  it('clears listeners on dispose', () => {
    const monitor = createFakeNetworkMonitor();
    const listener = vi.fn();
    monitor.subscribe(listener);
    monitor.dispose();

    monitor.set({ connection: 'offline' });

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('the noop monitor', () => {
  it('reports the frozen server status by reference', async () => {
    // `useSyncExternalStore` throws "The result of getServerSnapshot should be cached" if
    // this object is reallocated between calls, and it does so during hydration — the one
    // moment where an error is hardest to attribute.
    const monitor = createNoopNetworkMonitor();

    expect(monitor.getStatus()).toBe(SERVER_NETWORK_STATUS);
    expect(monitor.getStatus()).toBe(monitor.getStatus());
    expect(Object.isFrozen(SERVER_NETWORK_STATUS)).toBe(true);
    await expect(monitor.probe()).resolves.toBe('unknown');
  });

  it('hands back a working unsubscribe even though it never notifies', () => {
    expect(() => createNoopNetworkMonitor().subscribe(() => undefined)()).not.toThrow();
  });
});

describe('the browser monitor', () => {
  it('treats any HTTP answer as reachable, including a 500', async () => {
    // This probes connectivity, not health. Conflating the two shows an offline banner
    // during an outage the user could otherwise read a real error page about.
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }));
    const monitor = createBrowserNetworkMonitor({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(monitor.probe()).resolves.toBe('reachable');
    monitor.dispose();
  });

  it('reports unreachable when the probe throws', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    const monitor = createBrowserNetworkMonitor({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(monitor.probe()).resolves.toBe('unreachable');
    monitor.dispose();
  });

  it('probes a same-origin URL, not a third party', async () => {
    // The usual `google.com/generate_204` answers "is the internet up", which is not the
    // question. The question is whether *this* app's server is answering.
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    const monitor = createBrowserNetworkMonitor({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await monitor.probe();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith('/')).toBe(true);
    expect(init.method).toBe('HEAD');
    expect(init.cache).toBe('no-store');
    monitor.dispose();
  });

  it('does not notify when a change event changes nothing', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    const monitor = createBrowserNetworkMonitor({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await monitor.probe();

    const listener = vi.fn();
    monitor.subscribe(listener);
    await monitor.probe();

    expect(listener).not.toHaveBeenCalled();
    monitor.dispose();
  });

  it('notifies when reachability actually changes', async () => {
    let healthy = true;
    const fetchImpl = vi.fn(async () => {
      if (!healthy) throw new TypeError('fetch failed');
      return new Response(null, { status: 200 });
    });
    const monitor = createBrowserNetworkMonitor({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await monitor.probe();

    const listener = vi.fn();
    monitor.subscribe(listener);
    healthy = false;
    await monitor.probe();

    expect(listener).toHaveBeenCalledOnce();
    monitor.dispose();
  });

  it('removes its window listeners on dispose', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    createBrowserNetworkMonitor().dispose();

    expect(remove).toHaveBeenCalledWith('online', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function));
    remove.mockRestore();
  });
});
