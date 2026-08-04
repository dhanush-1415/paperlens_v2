/**
 * Typed storage entries.
 *
 * Application code never touches a `StorageDriver` directly. It declares an *entry* — key,
 * version, fallback, optional TTL, optional validator — once, at module scope, and then
 * reads and writes a typed value. That single indirection buys four things a raw
 * `getItem`/`JSON.parse` pair does not have:
 *
 * 1. **A total read.** `get()` returns `T`, never `T | null | undefined`. Absent, expired,
 *    corrupt, and version-mismatched all collapse to the declared fallback.
 * 2. **Versioning.** Shipping a shape change means bumping `version`; last release's data is
 *    discarded rather than parsed as if it were this release's.
 * 3. **Expiry.** The envelope carries its own deadline, checked on read.
 * 4. **Validation.** Storage is user-writable. Whatever comes back is untrusted input and is
 *    treated as such.
 */

import type { StorageDriver, StorageEntry, StorageEntryOptions, StoredEnvelope } from './types';

export interface EntryDeps {
  driver: StorageDriver;
  /** Injected so TTL is testable without touching the system clock. */
  now?: () => number;
}

export function createStorageEntry<T>(
  options: StorageEntryOptions<T>,
  deps: EntryDeps,
): StorageEntry<T> {
  const { key, version, fallback, ttlMs, validate } = options;
  const { driver, now = () => Date.now() } = deps;

  function read(): T {
    const raw = driver.getItem(key);
    if (raw === null) return fallback;

    let envelope: unknown;
    try {
      envelope = JSON.parse(raw);
    } catch {
      // Not JSON at all — someone else's key collision, or a truncated write. Drop it so
      // the next write starts clean instead of failing forever.
      driver.removeItem(key);
      return fallback;
    }

    if (!isEnvelope(envelope)) {
      driver.removeItem(key);
      return fallback;
    }

    // Version mismatch is a *discard*, not a migration. Migrations belong in an explicit
    // upgrade step; silently reshaping data on read is how two versions of a bug ship at once.
    if (envelope.v !== version) {
      driver.removeItem(key);
      return fallback;
    }

    if (envelope.e !== undefined && envelope.e <= now()) {
      driver.removeItem(key);
      return fallback;
    }

    if (validate && !validate(envelope.d)) {
      driver.removeItem(key);
      return fallback;
    }

    return envelope.d as T;
  }

  function write(value: T): boolean {
    const envelope: StoredEnvelope<T> = {
      v: version,
      d: value,
      ...(ttlMs === undefined ? {} : { e: now() + ttlMs }),
    };

    try {
      return driver.setItem(key, JSON.stringify(envelope));
    } catch {
      // `JSON.stringify` throws on cycles and on BigInt. Both are programmer errors that
      // should not take down a render.
      return false;
    }
  }

  return {
    get: read,
    set: write,
    remove: () => driver.removeItem(key),
    reset: () => write(fallback),
  };
}

function isEnvelope(value: unknown): value is StoredEnvelope<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.v !== 'number') return false;
  if (!('d' in candidate)) return false;
  if (candidate.e !== undefined && typeof candidate.e !== 'number') return false;
  return true;
}
