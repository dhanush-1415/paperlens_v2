/**
 * Feature flags — public API (requirement 18).
 *
 * ```ts
 * if (flags.isEnabled('documentChat')) { ... } // boolean flags only
 * const variant = flags.get('pricingLayout'); // typed as string
 * ```
 *
 * Adding a flag means adding an entry to `registry.ts` with an owner and an expiry date.
 * There is no way to read a flag that is not declared there, which is what keeps the set
 * countable.
 */

export { createDefaultFlags, createFlags, type FlagsOptions } from './flags';

export {
  FLAGS,
  FLAG_BY_KEY,
  expiredFlags,
  type BooleanFlagName,
  type FlagDefinition,
  type FlagKind,
  type FlagName,
  type FlagValue,
  type FlagValueOf,
} from './registry';

export {
  createMemoryFlagProvider,
  createNoopFlagProvider,
  createOverrideFlagProvider,
  createRemoteFlagProvider,
  createStaticFlagProvider,
  type MemoryFlagProvider,
  type RemoteFlagProviderOptions,
} from './providers';

export type { FlagContext, FlagProvider, Flags } from './types';
