/**
 * Locale registry and negotiation (requirement 29).
 *
 * The app ships one locale today. The point of this file is that adding a second one is a
 * data change, not a refactor: nothing anywhere renders a hardcoded English string, the
 * routing segment is already planned, and text direction is already a property of the locale
 * rather than an assumption baked into the CSS.
 *
 * Getting this in before the first translation is deliberate. Retrofitting i18n across a
 * built product is one of the most expensive changes a codebase can undergo, and the cost is
 * almost entirely in the strings that were written inline months earlier.
 */

export const SUPPORTED_LOCALES = ['en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export interface LocaleMeta {
  readonly code: Locale;
  /** The name in its own language — never translated, by convention. */
  readonly nativeName: string;
  readonly englishName: string;
  readonly dir: 'ltr' | 'rtl';
  /** BCP-47 tag for `Intl`. Separate from `code` because `pt` may map to `pt-BR`. */
  readonly intlTag: string;
}

export const LOCALES = {
  en: {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    dir: 'ltr',
    intlTag: 'en-US',
  },
} as const satisfies Record<Locale, LocaleMeta>;

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function localeMeta(locale: Locale): LocaleMeta {
  return LOCALES[locale];
}

/**
 * Pick a locale from an `Accept-Language` header.
 *
 * Implements q-value ordering and language-range fallback (`en-GB` matches `en`), which is
 * the part hand-rolled implementations usually skip — and skipping it means a browser set to
 * `fr-CA` gets English even when French is available.
 *
 * Returns `DEFAULT_LOCALE` rather than `null` for an absent or unparseable header. There is
 * always a locale; the only question is which.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const quality = qParam ? Number.parseFloat(qParam.split('=')[1] ?? '1') : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    if (isSupportedLocale(tag)) return tag;

    // `en-GB` -> `en`. The primary subtag is what we actually support.
    const primary = tag.split('-')[0] ?? '';
    if (isSupportedLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}

/**
 * Resolve the locale for a request, in precedence order.
 *
 * Explicit choice beats stored preference beats browser hint. A user who picked a language
 * in the UI must not have it overridden by their browser's header on the next request —
 * that is the single most common i18n complaint.
 */
export interface LocaleResolutionInput {
  /** From the URL segment, when a `[locale]` route exists. */
  pathLocale?: string | null;
  /** From the persisted preference cookie. */
  cookieLocale?: string | null;
  /** From the `Accept-Language` header. */
  acceptLanguage?: string | null;
}

export function resolveLocale(input: LocaleResolutionInput): Locale {
  if (input.pathLocale && isSupportedLocale(input.pathLocale)) return input.pathLocale;
  if (input.cookieLocale && isSupportedLocale(input.cookieLocale)) return input.cookieLocale;
  return negotiateLocale(input.acceptLanguage);
}
