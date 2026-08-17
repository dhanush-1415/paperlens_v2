/**
 * Storage — public API (requirement 12).
 *
 * The rule this module exists to enforce: **no file outside `src/core/storage/**` names
 * `localStorage` or `sessionStorage`.** ESLint's `no-restricted-globals` makes that a build
 * error rather than a review comment.
 *
 * Usage is always the same two steps — declare an entry once at module scope, then read and
 * write it:
 *
 * ```ts
 * const sidebarEntry = createStorageEntry(
 * { key: STORAGE_KEYS.sidebarCollapsed, version: 1, fallback: false },
 * { driver: defaultStorageDriver() },
 * );
 * ```
 */

export {
  createLocalStorageDriver,
  createMemoryStorageDriver,
  createNoopStorageDriver,
  createSessionStorageDriver,
  defaultStorageDriver,
} from './drivers';

export { createStorageEntry, type EntryDeps } from './entry';

export type { StorageDriver, StorageEntry, StorageEntryOptions, StoredEnvelope } from './types';
