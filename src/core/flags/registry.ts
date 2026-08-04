/**
 * The feature flag registry (requirement 18).
 *
 * Every flag in the system is declared here, with four things that are usually missing and
 * are the reason flag systems rot:
 *
 * - **`owner`** — the team that can delete it. An unowned flag is never removed.
 * - **`expiresOn`** — the date by which it should be gone. A lint/CI check can read this file
 *   and fail the build on an expired flag, which is the only mechanism that actually keeps
 *   the count down.
 * - **`kind`** — a release toggle and a permission check have opposite lifetimes. Conflating
 *   them is how a temporary rollout flag becomes permanent business logic.
 * - **`defaultValue`** — the value when no provider answers. Chosen so that a total flag
 *   outage leaves the app in its safe, shipped state.
 *
 * The default is the contract: if the flag service is down, the app behaves as if every flag
 * returned its default. So a half-built feature defaults to `false`, and a kill-switch for
 * something already live defaults to `true`.
 */

export type FlagValue = boolean | string | number;

export type FlagKind =
  /** Ships a half-built feature dark. Deleted the week it reaches 100%. */
  | 'release'
  /** A/B test. Deleted when the experiment concludes. */
  | 'experiment'
  /** Kill switch for something already live. Long-lived by design. */
  | 'ops'
  /** Gates a capability by plan or role. Prefer `core/auth/policy.ts` — this is the exception. */
  | 'permission';

export interface FlagDefinition<TValue extends FlagValue = FlagValue> {
  /** The wire key sent to a provider. Kebab-case, stable, never reused after deletion. */
  readonly key: string;
  readonly description: string;
  /** Team or individual accountable for removing it. */
  readonly owner: string;
  readonly kind: FlagKind;
  /** Value when no provider answers. Must be the safe state. */
  readonly defaultValue: TValue;
  /** ISO date. A flag past this is a build failure, not a warning. */
  readonly expiresOn: string;
}

export const FLAGS = {
  /** Example release toggle — the document-analysis chat panel. */
  documentChat: {
    key: 'document-chat',
    description: 'Conversational follow-up questions on an analyzed document.',
    owner: 'product',
    kind: 'release',
    defaultValue: false,
    expiresOn: '2026-12-31',
  },

  /** Example ops kill switch — defaults ON because the feature is live. */
  vaultEnabled: {
    key: 'vault-enabled',
    description: 'Master switch for document storage. Turn off to shed load during an incident.',
    owner: 'platform',
    kind: 'ops',
    defaultValue: true,
    expiresOn: '2099-01-01',
  },

  /** Example experiment — the variant name is the flag value. */
  pricingLayout: {
    key: 'pricing-layout',
    description: 'Pricing page layout variant under test.',
    owner: 'growth',
    kind: 'experiment',
    defaultValue: 'control',
    expiresOn: '2026-10-31',
  },

  /** Example numeric flag — tunable without a deploy. */
  scanConcurrencyLimit: {
    key: 'scan-concurrency-limit',
    description: 'Maximum simultaneous analyses per user. Lower during an upstream incident.',
    owner: 'platform',
    kind: 'ops',
    defaultValue: 2,
    expiresOn: '2099-01-01',
  },
} as const satisfies Record<string, FlagDefinition>;

export type FlagName = keyof typeof FLAGS;

export type FlagValueOf<TName extends FlagName> = (typeof FLAGS)[TName]['defaultValue'];

/** Flag names whose value is a boolean, so `isEnabled` cannot be called on a string flag. */
export type BooleanFlagName = {
  [TName in FlagName]: FlagValueOf<TName> extends boolean ? TName : never;
}[FlagName];

/** Reverse lookup, wire key -> registry name. Providers speak keys; the app speaks names. */
export const FLAG_BY_KEY: ReadonlyMap<string, FlagName> = new Map(
  (Object.keys(FLAGS) as FlagName[]).map((name) => [FLAGS[name].key, name]),
);

/**
 * Flags past their expiry date.
 *
 * Called by a test so the reminder arrives in CI rather than in a quarterly cleanup that
 * never happens. Takes `now` rather than reading the clock, so the test is deterministic.
 */
export function expiredFlags(now: Date): FlagName[] {
  return (Object.keys(FLAGS) as FlagName[]).filter((name) => new Date(FLAGS[name].expiresOn) < now);
}
