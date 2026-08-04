/**
 * The flag facade (requirement 18).
 *
 * Resolves a flag by walking the provider stack in order and taking the first non-`undefined`
 * answer, falling back to the registry default. Two guarantees on top of that:
 *
 * - **Type safety.** `get('pricingLayout')` returns `string`; `get('vaultEnabled')` returns
 *   `boolean`; `get('nonexistent')` does not compile. The value comes from the registry's
 *   `defaultValue`, so the type and the fallback can never disagree.
 * - **Type coercion refusal.** If a provider returns a string for a boolean flag — an easy
 *   mistake when a remote service serializes everything as JSON strings — the value is
 *   rejected and the default used, with a warning. Silently coercing `"false"` to `true` is
 *   the bug that takes a day to find.
 */

import { FLAGS, type FlagName, type FlagValue, type FlagValueOf } from './registry';
import type { FlagContext, FlagProvider, Flags } from './types';
import type { Logger } from '../logging/types';

export interface FlagsOptions {
  providers: readonly FlagProvider[];
  context: FlagContext;
  logger: Logger;
  /** Called on every resolution. Wire to `analytics.track('feature_flag.evaluated', …)`. */
  onEvaluate?: (name: FlagName, value: FlagValue, source: string) => void;
}

export function createFlags(options: FlagsOptions): Flags {
  const { providers, logger } = options;
  const scoped = logger.child('flags');

  let context = options.context;

  function resolve(name: FlagName): { value: FlagValue; source: string } {
    const definition = FLAGS[name];

    for (const provider of providers) {
      let answer: FlagValue | undefined;
      try {
        answer = provider.evaluate(definition.key, context);
      } catch (error) {
        // A provider that throws is skipped, not fatal. Flags must degrade to defaults.
        scoped.warn('provider threw during evaluation', {
          provider: provider.name,
          flag: definition.key,
          error,
        });
        continue;
      }

      if (answer === undefined) continue;

      if (typeof answer !== typeof definition.defaultValue) {
        scoped.warn('provider returned the wrong type; using default', {
          provider: provider.name,
          flag: definition.key,
          expected: typeof definition.defaultValue,
          received: typeof answer,
        });
        continue;
      }

      return { value: answer, source: provider.name };
    }

    return { value: definition.defaultValue, source: 'default' };
  }

  return {
    get<TName extends FlagName>(name: TName): FlagValueOf<TName> {
      const { value, source } = resolve(name);
      options.onEvaluate?.(name, value, source);
      // The cast is contained here and justified by the type check in `resolve`: the value
      // is either the default (correct by construction) or a provider answer whose runtime
      // type matched the default's.
      return value as FlagValueOf<TName>;
    },

    isEnabled(name) {
      const { value, source } = resolve(name);
      options.onEvaluate?.(name, value, source);
      return value === true;
    },

    snapshot() {
      const names = Object.keys(FLAGS) as FlagName[];
      const entries = names.map((name) => [name, resolve(name).value] as const);
      return Object.fromEntries(entries) as Record<FlagName, FlagValue>;
    },

    setContext(next) {
      context = next;
    },

    async refresh() {
      await Promise.all(
        providers.map(async (provider) => {
          try {
            await provider.refresh?.(context);
          } catch (error) {
            scoped.warn('provider refresh failed', { provider: provider.name, error });
          }
        }),
      );
    },
  };
}

/**
 * Flags fixed at their registry defaults.
 *
 * The server-render fallback and the test default. Keeping it a real `Flags` object rather
 * than `null` means no call site needs a null check.
 */
export function createDefaultFlags(): Flags {
  return {
    get: <TName extends FlagName>(name: TName) => FLAGS[name].defaultValue as FlagValueOf<TName>,
    isEnabled: (name) => FLAGS[name].defaultValue === true,
    snapshot: () => {
      const names = Object.keys(FLAGS) as FlagName[];
      return Object.fromEntries(names.map((name) => [name, FLAGS[name].defaultValue])) as Record<
        FlagName,
        FlagValue
      >;
    },
    setContext: () => undefined,
    refresh: () => Promise.resolve(),
  };
}
