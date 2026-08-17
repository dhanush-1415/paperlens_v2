/**
 * Network monitoring contracts (requirement 14).
 *
 * The honest framing first: **the browser cannot tell you whether the network works.**
 * `navigator.onLine` reports whether the machine has *a* network interface up. A laptop on a
 * captive-portal wifi, a phone with a dead uplink, and a working connection to a server that
 * is down all report `true`.
 *
 * So this module models two distinct things and never conflates them:
 *
 * - `connection` — the browser's own opinion. Cheap, instant, and only trustworthy in the
 * negative direction: `offline` means offline; `online` means "maybe".
 * - `reachability` — whether our own origin actually answered. Costs a request, so it is
 * probed on demand and after a failure, not on a timer.
 *
 * UI should key its "you are offline" banner on `connection === 'offline'` (fast, no false
 * positives) and its retry logic on `reachability` (accurate, worth the round trip).
 *
 * **No realtime transport.** Reachability is a plain `fetch` of a static endpoint. There is
 * no socket held open to watch the connection, here or anywhere else in this codebase.
 */

export type ConnectionState = 'online' | 'offline';

export type Reachability = 'reachable' | 'unreachable' | 'unknown';

/**
 * Effective connection quality, from the Network Information API where it exists.
 *
 * Available in Chromium, absent in Safari and Firefox — hence `'unknown'`. Use it to
 * *degrade* (skip a prefetch, drop image quality), never to block: a user on `'slow-2g'`
 * still gets the app, just leaner.
 */
export type ConnectionQuality = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export interface NetworkStatus {
  readonly connection: ConnectionState;
  readonly reachability: Reachability;
  readonly quality: ConnectionQuality;
  /** True when the user asked for reduced data usage. Respect it. */
  readonly saveData: boolean;
  /** Epoch ms of the last state change, for "offline since" copy. */
  readonly changedAt: number;
}

export interface NetworkMonitor {
  readonly name: string;
  getStatus(): NetworkStatus;
  /**
   * Subscribe to changes. Returns an unsubscribe function.
   *
   * The signature is exactly what `useSyncExternalStore` wants, which is why the hook in
   * this directory is six lines long and correct under concurrent rendering.
   */
  subscribe(listener: () => void): () => void;
  /** Actively probe our own origin. Resolves to the new reachability. */
  probe(): Promise<Reachability>;
  /** Release listeners. Called on unmount in tests; the app-level monitor lives forever. */
  dispose(): void;
}

/** How the app should behave for a given operation while degraded. */
export interface OfflinePolicy {
  /** Attempt the request anyway? `navigator.onLine === false` is trustworthy enough to skip. */
  readonly shouldAttempt: boolean;
  /** Show the user a blocking offline state, or degrade quietly? */
  readonly blockUi: boolean;
  /** Retry automatically once connectivity returns? */
  readonly retryOnReconnect: boolean;
  /** i18n key for what to tell the user. */
  readonly messageKey: string;
}
