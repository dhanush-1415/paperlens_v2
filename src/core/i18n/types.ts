/**
 * i18n contracts (requirement 29).
 *
 * The dictionary is a *port*: today it resolves to a bundled TypeScript object, later it may
 * resolve to JSON fetched from a translation service. Nothing that calls `t()` should have to
 * change when that happens, so the loader is async even though the current implementation
 * returns immediately.
 */

import type { Dictionary, MessageKey } from './dictionaries/en';
import type { Locale } from './locales';

export type { Dictionary, MessageKey };

/** Values interpolated into `{placeholder}` slots. */
export type MessageParams = Readonly<Record<string, string | number>>;

export interface DictionaryLoader {
 readonly name: string;
 /**
 * Load one locale.
 *
 * Async by contract, not by current need. Making it synchronous now would bake the
 * bundled-dictionary assumption into every call site and force a rewrite the day
 * translations move off the build.
 */
 load(locale: Locale): Promise<Partial<Dictionary>>;
}

export interface Translator {
 readonly locale: Locale;
 readonly dir: 'ltr' | 'rtl';
 /**
 * Translate a key.
 *
 * `key` is constrained to the English dictionary's keys, so a typo does not compile and a
 * deleted string breaks the build rather than rendering as itself.
 */
 t(key: MessageKey, params?: MessageParams): string;
 /**
 * Translate a plural key.
 *
 * Takes the *base* key — `quota.scansRemaining` — and appends the CLDR category selected by
 * `Intl.PluralRules`. Passing `count` to plain `t()` would silently pick the wrong form in
 * every language with more than two.
 */
 plural(baseKey: string, count: number, params?: MessageParams): string;
 /** True when a key resolves in this locale rather than falling back to English. */
 has(key: MessageKey): boolean;
}
