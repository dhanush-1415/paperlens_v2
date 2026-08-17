/**
 * Flag provider adapters.
 *
 * Providers are layered, first answer wins. The intended stack is:
 *
 * ```
 * [ localOverrides (dev only), remoteSnapshot, staticOverrides ] -> registry default
 * ```
 *
 * so a developer's local toggle beats the remote service, which beats a build-time override,
 * which beats the declared default. Each layer is a separate object rather than a mode flag,
 * because a mode flag means one code path is never exercised in production.
 */

import { isProduction } from '@/config/runtime';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

import { createStorageEntry } from '../storage/entry';
import type { StorageDriver } from '../storage/types';
import type { FlagValue } from './registry';
import type { FlagContext, FlagProvider } from './types';

/** Fixed values, decided at build time. For environment-specific defaults. */
export function createStaticFlagProvider(
  values: Readonly<Record<string, FlagValue>>,
): FlagProvider {
  return {
    name: 'static',
    evaluate: (key) => values[key],
  };
}

/**
 * Values fetched from a remote service.
 *
 * The fetcher is injected rather than a `fetch` call inlined here: the same adapter then
 * works against a JSON endpoint, a vendor SDK, or a test stub, and the module has no
 * knowledge of which one it got.
 *
 * On a failed refresh the previous snapshot is kept rather than cleared. A flag service
 * outage should freeze flags at their last known values, not stampede every user back to
 * defaults — that would turn a config outage into a product outage.
 */
export interface RemoteFlagProviderOptions {
  fetchSnapshot: (context: FlagContext) => Promise<Record<string, FlagValue>>;
  onError?: (error: unknown) => void;
  initial?: Record<string, FlagValue>;
}

export function createRemoteFlagProvider(options: RemoteFlagProviderOptions): FlagProvider {
  let snapshot: Record<string, FlagValue> = options.initial ?? {};

  return {
    name: 'remote',
    evaluate: (key) => snapshot[key],
    async refresh(context) {
      try {
        snapshot = await options.fetchSnapshot(context);
      } catch (error) {
        options.onError?.(error);
      }
    },
  };
}

/**
 * Developer overrides, persisted locally.
 *
 * **Inert in production builds.** The guard is here rather than at the composition root
 * because this is the layer that would otherwise let anyone with a devtools console turn on
 * an unfinished feature — flags are not a security boundary, but they should not be a
 * self-service one either.
 */
export function createOverrideFlagProvider(driver: StorageDriver): FlagProvider {
  const entry = createStorageEntry<Record<string, FlagValue>>(
    {
      key: STORAGE_KEYS.flagOverrides,
      version: 1,
      fallback: {},
    },
    { driver },
  );

  return {
    name: 'override',
    evaluate: (key) => (isProduction ? undefined : entry.get()[key]),
  };
}

/** Answers nothing. Every flag falls through to its registry default. */
export function createNoopFlagProvider(): FlagProvider {
  return {
    name: 'noop',
    evaluate: () => undefined,
  };
}

/** Directly settable. The test double. */
export interface MemoryFlagProvider extends FlagProvider {
  set(key: string, value: FlagValue): void;
  clear(): void;
  refreshCount(): number;
}

export function createMemoryFlagProvider(
  initial: Record<string, FlagValue> = {},
): MemoryFlagProvider {
  const values = new Map(Object.entries(initial));
  let refreshes = 0;

  return {
    name: 'memory',
    evaluate: (key) => values.get(key),
    refresh: () => {
      refreshes += 1;
      return Promise.resolve();
    },
    set: (key, value) => {
      values.set(key, value);
    },
    clear: () => values.clear(),
    refreshCount: () => refreshes,
  };
}
