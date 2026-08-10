/**
 * The translator (requirement 29).
 *
 * Small on purpose. A full ICU MessageFormat implementation is a large dependency that
 * exists to support select/ordinal/nested-plural forms this product does not have. What it
 * does support is the two things every product needs — placeholder interpolation and correct
 * plural selection — and it does the second through `Intl.PluralRules`, which is the only
 * way to be right in languages with more than two forms.
 *
 * ### Missing-key behaviour
 *
 * A key missing from the active locale falls back to English. A key missing from English too
 * renders the key itself, and warns. It never renders empty: a blank button is a support
 * ticket, while a visible `common.save` is a bug report that names its own cause.
 */

import { interpolate } from '@/shared/utils/string';

import { localeMeta, type Locale } from './locales';
import { en, type Dictionary, type MessageKey } from './dictionaries/en';
import type { MessageParams, Translator } from './types';
import type { Logger } from '../logging/types';

export interface TranslatorOptions {
 locale: Locale;
 /** The active locale's strings. Partial: anything untranslated falls back to English. */
 messages: Partial<Dictionary>;
 logger?: Logger;
}

export function createTranslator(options: TranslatorOptions): Translator {
 const { locale, messages, logger } = options;
 const meta = localeMeta(locale);
 const scoped = logger?.child('i18n');

 // Built once per translator rather than per call: constructing an `Intl` formatter is
 // measurably expensive and this runs on every pluralized string in a list.
 const pluralRules = new Intl.PluralRules(meta.intlTag);

 function lookup(key: string): string | undefined {
 const translated = (messages as Record<string, string | undefined>)[key];
 if (translated !== undefined) return translated;
 return (en as Record<string, string | undefined>)[key];
 }

 return {
 locale,
 dir: meta.dir,

 t(key: MessageKey, params?: MessageParams): string {
 const template = lookup(key);
 if (template === undefined) {
 scoped?.warn('missing translation', { key, locale });
 return key;
 }
 return interpolate(template, params);
 },

 plural(baseKey: string, count: number, params?: MessageParams): string {
 const category = pluralRules.select(count);
 // `_other` is the CLDR fallback and every locale defines it, so a locale that omits a
 // rarer category still renders something grammatical rather than the raw key.
 const template = lookup(`${baseKey}_${category}`) ?? lookup(`${baseKey}_other`);

 if (template === undefined) {
 scoped?.warn('missing plural translation', { key: baseKey, category, locale });
 return baseKey;
 }

 return interpolate(template, { count, ...params });
 },

 has(key: MessageKey): boolean {
 return (messages as Record<string, string | undefined>)[key] !== undefined;
 },
 };
}

/**
 * A translator that returns keys unchanged.
 *
 * For tests that assert on *which* message was shown rather than on its English wording —
 * an assertion against `'validation.email'` keeps passing when the copy is reworded, which
 * is the difference between a test that protects behaviour and one that protects prose.
 */
export function createKeyTranslator(locale: Locale = 'en'): Translator {
 return {
 locale,
 dir: localeMeta(locale).dir,
 t: (key) => key,
 plural: (baseKey, count) => `${baseKey}:${count}`,
 has: () => true,
 };
}
