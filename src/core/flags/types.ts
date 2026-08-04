/**
 * Feature flag contracts (requirement 18).
 *
 * **Evaluation is synchronous, and that is a hard requirement.** A flag decides what to
 * render; if reading one returned a promise, every flagged component would need a loading
 * state, and the layout would shift when the answer arrived. Providers therefore hold a
 * snapshot in memory and refresh it out of band.
 *
 * **Refresh is a request, not a stream.** No socket, no event source, no subscription —
 * consistent with the no-realtime constraint that applies across this codebase. Flags are
 * fetched at bootstrap and, if a provider chooses, re-fetched on an interval. The cost is
 * that a flag change takes up to one refresh interval to propagate, which is the right
 * trade for a system where the alternative is a persistent connection per user.
 */

import type { FlagName, FlagValue, FlagValueOf } from './registry';

/**
 * The evaluation context.
 *
 * Deliberately small. A context that carries the whole user object invites targeting rules
 * written against fields nobody intended to expose to a flag vendor.
 */
export interface FlagContext {
  readonly userId?: string;
  readonly plan?: string;
  readonly tenantId?: string;
  readonly environment: string;
  /** Stable per-device value for consistent bucketing of signed-out users. */
  readonly anonymousId?: string;
}

export interface FlagProvider {
  readonly name: string;
  /**
   * Resolve one flag by its wire key.
   *
   * Returns `undefined` to mean "no opinion", which lets providers be layered: an override
   * provider answers for the two flags a developer is toggling and defers on the rest.
   * Returning the default here instead would make every provider authoritative for every
   * flag and break that composition.
   */
  evaluate(key: string, context: FlagContext): FlagValue | undefined;
  /** Re-fetch the snapshot. Called at bootstrap and on an interval, never on a stream. */
  refresh?(context: FlagContext): Promise<void>;
}

export interface Flags {
  get<TName extends FlagName>(name: TName): FlagValueOf<TName>;
  /** Typed so it can only be called with a boolean flag. */
  isEnabled(name: BooleanFlagNameOf): boolean;
  /** Every flag's current value. For the debug panel and for `feature_flag.evaluated`. */
  snapshot(): Record<FlagName, FlagValue>;
  /** Replace the evaluation context — after sign-in, or on a plan change. */
  setContext(context: FlagContext): void;
  refresh(): Promise<void>;
}

type BooleanFlagNameOf = {
  [TName in FlagName]: FlagValueOf<TName> extends boolean ? TName : never;
}[FlagName];
