/**
 * i18n — public API (requirement 29).
 *
 * ```ts
 * t('validation.email') // compile error if the key does not exist
 * t('errors.rateLimited', { seconds: 30 })
 * plural('quota.scansRemaining', remaining) // correct form in every locale
 * ```
 *
 * The translator is injected, never imported as a singleton: it is per-request on the server
 * (the locale differs per user) and per-tree on the client (through a provider). A module-level
 * translator would serve one user's language to another under concurrent SSR.
 */

export { createBundledDictionaryLoader, createStaticDictionaryLoader } from './loader';

export { createKeyTranslator, createTranslator, type TranslatorOptions } from './translator';

export { en } from './dictionaries/en';

export {
 DEFAULT_LOCALE,
 LOCALES,
 SUPPORTED_LOCALES,
 isSupportedLocale,
 localeMeta,
 negotiateLocale,
 resolveLocale,
 type Locale,
 type LocaleMeta,
 type LocaleResolutionInput,
} from './locales';

export type { Dictionary, DictionaryLoader, MessageKey, MessageParams, Translator } from './types';
