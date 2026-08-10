/**
 * Dictionary loaders.
 *
 * The bundled loader is the shipped implementation. It uses a dynamic `import()` per locale
 * rather than a static import of all of them, so adding twenty languages adds twenty
 * chunks — not twenty languages to every user's first byte.
 */

import { DEFAULT_LOCALE, type Locale } from './locales';
import { en } from './dictionaries/en';
import type { Dictionary, DictionaryLoader } from './types';

/**
 * Loads dictionaries from the bundle.
 *
 * English is imported statically because it is the fallback: every missing key in every
 * other locale resolves against it, so it must be present synchronously and is worth its
 * bytes in the main chunk.
 */
export function createBundledDictionaryLoader(): DictionaryLoader {
 return {
 name: 'bundled',
 async load(locale: Locale): Promise<Partial<Dictionary>> {
 if (locale === DEFAULT_LOCALE) return en;

 // Only reachable once a second locale exists. The `catch` is what keeps a missing
 // translation file from turning into a blank page: fall back to English and carry on.
 try {
 const loaded: unknown = await import(`./dictionaries/${locale}.ts`);
 const dictionary = (loaded as Record<string, unknown>)[locale];
 return (dictionary as Partial<Dictionary> | undefined) ?? {};
 } catch {
 return {};
 }
 },
 };
}

/** Serves a fixed set of strings. The test double. */
export function createStaticDictionaryLoader(
 messages: Partial<Dictionary> = en,
): DictionaryLoader {
 return {
 name: 'static',
 load: () => Promise.resolve(messages),
 };
}
