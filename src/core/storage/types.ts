/**
 * Local storage contracts (requirement 12).
 *
 * `localStorage` is banned across `src/**` by ESLint, and this module is where that ban
 * redirects to. The reasons are concrete:
 *
 * - It throws in Safari private mode and when a quota is exceeded. An unguarded
 * `localStorage.setItem` is a white screen for a subset of users.
 * - It does not exist on the server. A module-level read crashes SSR.
 * - It is untyped and unversioned, so a shape change silently feeds last month's data into
 * this month's parser.
 * - It has no TTL, so a "temporary" value is permanent.
 *
 * The driver interface below is synchronous because every browser backing store is. An async
 * interface would be more general (IndexedDB), but it would push `await` into every read
 * and make the no-flash theme script impossible.
 */

export interface StorageDriver {
  readonly name: string;
  /** Returns `null` when absent *or* when the store is unavailable. Never throws. */
  getItem(key: string): string | null;
  /** Returns false if the write failed — quota, private mode, disabled storage. */
  setItem(key: string, value: string): boolean;
  removeItem(key: string): void;
  clear(): void;
  keys(): string[];
}

/**
 * The envelope every value is wrapped in.
 *
 * Version and expiry live *with* the data rather than in a side table, because a side table
 * can be cleared independently and then lies. `v` is compared on read: a mismatch discards
 * the entry rather than handing a stale shape to a parser that will misinterpret it.
 */
export interface StoredEnvelope<T> {
  /** Schema version. Bump when the shape of `d` changes. */
  readonly v: number;
  /** The value. */
  readonly d: T;
  /** Epoch milliseconds when this expires. Absent means never. */
  readonly e?: number;
}

export interface StorageEntryOptions<T> {
  /** The full key, from `STORAGE_KEYS`. Never a literal at the call site. */
  key: string;
  version: number;
  /** Returned when absent, expired, malformed or version-mismatched. */
  fallback: T;
  /** Time to live in milliseconds. Omit for no expiry. */
  ttlMs?: number;
  /**
   * Validates what came out of storage.
   *
   * Storage is user-writable — a devtools console is all it takes. Anything read back is
   * untrusted input, and this is where that is enforced. Typically a Zod schema's
   * `safeParse` wrapped in a predicate.
   */
  validate?: (value: unknown) => value is T;
}

/** A typed, versioned, expiring handle on one storage key. */
export interface StorageEntry<T> {
  get(): T;
  set(value: T): boolean;
  remove(): void;
  /** Reset to `fallback` without removing the key. */
  reset(): boolean;
}
