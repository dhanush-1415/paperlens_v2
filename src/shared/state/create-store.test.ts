import { describe, expect, it, vi } from 'vitest';

import {
  createLocalStorageDriver,
  createMemoryStorageDriver,
  type StorageDriver,
} from '@/core/storage';

import { createStore } from './create-store';

/**
 * The store factory.
 *
 * The factory exists so that three decisions — devtools naming, persistence, and *which*
 * storage the persistence writes to — are made once instead of at every call site. So what is
 * tested here is not Zustand, which has its own tests; it is that those three decisions
 * actually reach the store, and that the persistence layer is wired through the
 * `StorageDriver` port rather than to `localStorage` directly.
 *
 * That last point is the one worth a test. Handing Zustand the raw global would work in a
 * browser and fail in three places we care about: during SSR, where `localStorage` does not
 * exist; in Safari private mode, where it throws on write; and in tests, where two suites
 * would share one namespace. Routing through the port fixes all three at once, and a
 * regression to `localStorage` would be invisible until one of those three happened.
 */

interface CounterState {
  count: number;
  pending: boolean;
  increment: () => void;
}

const counter = (partial: Partial<{ driver: StorageDriver; persist: boolean }> = {}) =>
  createStore<CounterState>(
    (set) => ({
      count: 0,
      pending: false,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'counter',
      ...(partial.persist === false
        ? {}
        : {
            persist: {
              key: 'pl:counter:v1',
              version: 1,
              partialize: (state) => ({ count: state.count }),
              ...(partial.driver ? { driver: partial.driver } : {}),
            },
          }),
    },
  );

describe('an unpersisted store', () => {
  it('holds state and applies an action', () => {
    const useStore = createStore<CounterState>(
      (set) => ({
        count: 0,
        pending: false,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: 'ephemeral' },
    );

    useStore.getState().increment();

    expect(useStore.getState().count).toBe(1);
  });

  it('works outside React, which is the reason Zustand was chosen', () => {
    // A Context provider is a Client Component; putting one at the root turns the tree below
    // it into a client boundary. A module-scoped store has no provider, so a leaf three levels
    // into an RSC tree can subscribe without any ancestor becoming client.
    const useStore = createStore<{ open: boolean; toggle: () => void }>(
      (set) => ({ open: false, toggle: () => set((s) => ({ open: !s.open })) }),
      { name: 'palette' },
    );

    useStore.getState().toggle();

    expect(useStore.getState().open).toBe(true);
  });

  it('notifies subscribers on change', () => {
    const useStore = counter({ persist: false });
    const listener = vi.fn();
    const unsubscribe = useStore.subscribe(listener);

    useStore.getState().increment();
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    useStore.getState().increment();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('persistence', () => {
  it('writes through the injected driver, not to localStorage', async () => {
    // The point of the port. A store that reached for the global would pass this suite in a
    // browser and fail during SSR, in Safari private mode, and across parallel test files.
    const driver = createMemoryStorageDriver();
    const useStore = counter({ driver });

    useStore.getState().increment();
    await Promise.resolve();

    expect(driver.getItem('pl:counter:v1')).toContain('"count":1');
    expect(window.localStorage.getItem('pl:counter:v1')).toBeNull();
  });

  it('persists only the partialized slice', async () => {
    // `pending` is in-flight state. Persisting it means a user who refreshes mid-request
    // comes back to a store that believes it is still loading, forever.
    const driver = createMemoryStorageDriver();
    const useStore = counter({ driver });

    useStore.getState().increment();
    await Promise.resolve();

    const written = driver.getItem('pl:counter:v1') ?? '';
    expect(written).toContain('"count"');
    expect(written).not.toContain('"pending"');
  });

  it('records the version alongside the state', async () => {
    // Without it, last release's persisted shape rehydrates into this release's reducers.
    const driver = createMemoryStorageDriver();
    counter({ driver }).getState().increment();
    await Promise.resolve();

    expect(driver.getItem('pl:counter:v1')).toContain('"version":1');
  });

  it('rehydrates a store from a driver that already holds state', () => {
    const driver = createMemoryStorageDriver();
    driver.setItem('pl:counter:v1', JSON.stringify({ state: { count: 7 }, version: 1 }));

    expect(counter({ driver }).getState().count).toBe(7);
  });

  it('discards a persisted payload from an older version', () => {
    // Zustand's own guarantee, asserted because the factory is what supplies `version` — a
    // factory that dropped it would silently rehydrate an incompatible shape.
    const driver = createMemoryStorageDriver();
    driver.setItem('pl:counter:v1', JSON.stringify({ state: { count: 7 }, version: 0 }));

    expect(counter({ driver }).getState().count).toBe(0);
  });

  it('falls back to a no-op driver rather than touching storage at import time', () => {
    // This module is imported during SSR. A default that reached for `localStorage` at module
    // scope would throw before the request was even routed.
    const useStore = createStore<CounterState>(
      (set) => ({
        count: 0,
        pending: false,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      {
        name: 'no-driver',
        persist: { key: 'pl:no-driver:v1', version: 1, partialize: (s) => ({ count: s.count }) },
      },
    );

    expect(() => useStore.getState().increment()).not.toThrow();
    expect(useStore.getState().count).toBe(1);
  });

  it('keeps working against a driver that reports a failed write', () => {
    // The port's failure signal is a `false` return, not a throw — deliberately, because
    // Zustand's `persist` does not guard its storage calls and a throwing driver would take
    // the `set()` down with it. So the contract puts the guard in the driver, and the factory
    // only has to not care about the answer. A user out of quota loses persistence, not the
    // ability to change state.
    const full: StorageDriver = {
      name: 'full',
      getItem: () => null,
      setItem: () => false,
      removeItem: () => {},
      clear: () => {},
      keys: () => [],
    };

    const useStore = counter({ driver: full });

    expect(() => useStore.getState().increment()).not.toThrow();
    expect(useStore.getState().count).toBe(1);
  });

  it('is safe on a backend that throws, because the shipped driver absorbs it', () => {
    // Safari private mode throws on every `localStorage.setItem`. `createLocalStorageDriver`
    // is what turns that into the `false` above — asserted here through the factory so a
    // regression in either half shows up at the seam where it would actually hurt.
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const useStore = counter({ driver: createLocalStorageDriver() });

    expect(() => useStore.getState().increment()).not.toThrow();
    expect(useStore.getState().count).toBe(1);

    setItem.mockRestore();
  });
});
