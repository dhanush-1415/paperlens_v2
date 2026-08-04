/**
 * Storage drivers.
 *
 * This directory is the single ESLint exemption for `localStorage` / `sessionStorage`
 * (see the `src/core/storage/**` override in `eslint.config.mjs`). Every access to the
 * browser stores in the entire application happens in this file, wrapped, so the failure
 * modes are handled once.
 *
 * Each driver is *feature-detected at construction*, not at module load, and every method
 * is total: a read from a broken store returns `null`, a write returns `false`. Nothing here
 * throws, because a storage failure is never worth breaking a render over.
 */

import { isServer } from '@/config/runtime';

import type { StorageDriver } from './types';

/**
 * Probe the store rather than trust its presence.
 *
 * `typeof localStorage !== 'undefined'` is not enough: Safari in private mode and Chrome
 * with third-party storage blocked both *expose* the object and then throw on write. The
 * only reliable test is to actually write.
 */
function isUsable(store: Storage): boolean {
  const probe = '__pl_probe__';
  try {
    store.setItem(probe, probe);
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function createWebDriver(name: string, resolve: () => Storage | null): StorageDriver {
  // Resolved once, at construction. A driver built on the server, or in a browser that
  // refuses storage, degrades to the memory driver instead of failing every call.
  const store = isServer ? null : resolve();
  const usable = store !== null && isUsable(store);

  if (!usable) return createMemoryStorageDriver(name);

  const backing = store;

  return {
    name,

    getItem(key) {
      try {
        return backing.getItem(key);
      } catch {
        return null;
      }
    },

    setItem(key, value) {
      try {
        backing.setItem(key, value);
        return true;
      } catch {
        // Almost always QuotaExceededError. Reporting it is the caller's decision — this
        // layer only guarantees it did not throw.
        return false;
      }
    },

    removeItem(key) {
      try {
        backing.removeItem(key);
      } catch {
        // Nothing useful to do; the entry is either gone or unreachable.
      }
    },

    clear() {
      try {
        // Deliberately only clears our own namespace. `backing.clear()` would also wipe
        // anything a third-party script put there, which is not ours to delete.
        for (const key of this.keys()) backing.removeItem(key);
      } catch {
        // As above.
      }
    },

    keys() {
      try {
        const found: string[] = [];
        for (let index = 0; index < backing.length; index += 1) {
          const key = backing.key(index);
          if (key !== null && key.startsWith('pl:')) found.push(key);
        }
        return found;
      } catch {
        return [];
      }
    },
  };
}

/** `localStorage` — survives a tab close. For preferences. */
export function createLocalStorageDriver(): StorageDriver {
  return createWebDriver('local', () => window.localStorage);
}

/** `sessionStorage` — dies with the tab. For per-tab draft state. */
export function createSessionStorageDriver(): StorageDriver {
  return createWebDriver('session', () => window.sessionStorage);
}

/**
 * In-process map.
 *
 * Serves three roles: the SSR fallback (so a component reading a preference during render
 * gets a defined answer instead of a crash), the private-mode fallback, and the test double.
 * Values do not survive a reload, which is the honest behaviour when nothing else is
 * available.
 */
export function createMemoryStorageDriver(name = 'memory'): StorageDriver {
  const map = new Map<string, string>();

  return {
    name,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
      return true;
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
    keys: () => [...map.keys()],
  };
}

/** Discards everything. For contexts where persistence is a bug — e.g. a consent-denied session. */
export function createNoopStorageDriver(): StorageDriver {
  return {
    name: 'noop',
    getItem: () => null,
    /**
     * `false`, not `true`.
     *
     * The contract for `setItem` is "did the value get stored", and here it did not — the
     * next `getItem` returns `null`. Claiming success would make this driver the one adapter
     * whose return value lies, and a caller that persists a draft and reports "saved" on the
     * strength of it would be showing the user something untrue. Disabled storage is exactly
     * the case the boolean exists for.
     */
    setItem: () => false,
    removeItem: () => undefined,
    clear: () => undefined,
    keys: () => [],
  };
}

/**
 * The default driver for the current environment.
 *
 * Chosen at call time rather than at module load: this module is imported by client
 * components that are also rendered on the server, and a module-level `window` read would
 * crash SSR before the component ever ran.
 */
export function defaultStorageDriver(): StorageDriver {
  return isServer ? createMemoryStorageDriver('server-fallback') : createLocalStorageDriver();
}
