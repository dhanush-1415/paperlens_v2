import { describe, expect, it } from 'vitest';

import { createMemoryTransport } from '../logging/transports';
import { createLogger } from '../logging/logger';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  localeMeta,
  negotiateLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
} from './locales';
import { createKeyTranslator, createTranslator } from './translator';
import type { Dictionary, MessageKey } from './types';

/**
 * i18n.
 *
 * The app ships one locale, which makes it tempting to skip these. That is exactly backwards:
 * the value of this layer is that adding a second locale is a data change rather than a
 * refactor, and the only way to know that claim holds is to exercise the fallback, plural and
 * negotiation paths *now*, while there is still one locale and the bugs are cheap.
 */

const messages = {
  'common.save': 'Save',
  'scan.greeting': 'Hello, {name}.',
} as unknown as Partial<Dictionary>;

const key = (value: string) => value as MessageKey;

describe('the locale registry', () => {
  it('has metadata and a default that is one of the supported locales', () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
    expect(localeMeta(DEFAULT_LOCALE)).toMatchObject({ dir: 'ltr', intlTag: 'en-US' });
  });

  it('narrows an arbitrary string to a Locale', () => {
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
  });
});

describe('Accept-Language negotiation', () => {
  it('falls back to the default for an absent, empty or unparseable header', () => {
    expect(negotiateLocale(null)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale('')).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale(';;;')).toBe(DEFAULT_LOCALE);
  });

  it('matches a language range against its primary subtag', () => {
    // `en-GB` is not in the registry; `en` is. Skipping this fallback is the reason
    // hand-rolled negotiators serve English to a browser set to a dialect they support.
    expect(negotiateLocale('en-GB,en;q=0.9')).toBe('en');
    expect(negotiateLocale('EN-AU')).toBe('en');
  });

  it('honours q-value ordering rather than header order', () => {
    expect(negotiateLocale('fr;q=0.9,en;q=1.0')).toBe('en');
    expect(negotiateLocale('de,en;q=0.5')).toBe('en');
  });

  it('ignores a range explicitly rejected with q=0', () => {
    expect(negotiateLocale('en;q=0')).toBe(DEFAULT_LOCALE);
  });
});

describe('locale resolution precedence', () => {
  it('prefers the path over the cookie over the header', () => {
    expect(resolveLocale({ pathLocale: 'en', cookieLocale: 'zz', acceptLanguage: 'zz' })).toBe(
      'en',
    );
    expect(resolveLocale({ cookieLocale: 'en', acceptLanguage: 'zz' })).toBe('en');
    expect(resolveLocale({ acceptLanguage: 'en-GB' })).toBe('en');
  });

  it('skips an unsupported value at any level rather than failing', () => {
    // A stale cookie naming a locale that has since been removed must not 500 the request.
    expect(resolveLocale({ pathLocale: 'xx', cookieLocale: 'yy', acceptLanguage: null })).toBe(
      DEFAULT_LOCALE,
    );
  });

  it('resolves to something for an entirely empty input', () => {
    expect(resolveLocale({})).toBe(DEFAULT_LOCALE);
  });
});

describe('the translator', () => {
  it('returns the string for a known key', () => {
    const t = createTranslator({ locale: 'en', messages });

    expect(t.t(key('common.save'))).toBe('Save');
  });

  it('interpolates named placeholders', () => {
    const t = createTranslator({ locale: 'en', messages });

    expect(t.t(key('scan.greeting'), { name: 'Ada' })).toBe('Hello, Ada.');
  });

  it('renders the key itself for a missing string, and warns — never blank', () => {
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
    const t = createTranslator({ locale: 'en', messages: {}, logger });

    // A blank button is a support ticket nobody can diagnose. A visible `nope.missing` is a
    // bug report that names its own cause.
    expect(t.t(key('nope.missing'))).toBe('nope.missing');
    expect(transport.records[0]).toMatchObject({ level: 'warn', scope: 'test.i18n' });
  });

  it('falls back to English for a key the active locale has not translated', () => {
    const t = createTranslator({ locale: 'en', messages: {} });

    // `common.cancel` is absent from `messages` but present in the bundled English
    // dictionary, so it resolves rather than rendering as a key.
    expect(t.t(key('common.cancel'))).not.toBe('common.cancel');
  });

  it('reports whether a key resolves *in this locale* rather than via fallback', () => {
    const t = createTranslator({ locale: 'en', messages });

    expect(t.has(key('common.save'))).toBe(true);
    expect(t.has(key('nope.missing'))).toBe(false);
  });

  it('exposes the locale and its direction', () => {
    const t = createTranslator({ locale: 'en', messages });

    expect(t.locale).toBe('en');
    expect(t.dir).toBe('ltr');
  });
});

describe('plurals', () => {
  const plurals = {
    'quota.scans_one': '{count} scan left',
    'quota.scans_other': '{count} scans left',
    'quota.onlyOther_other': '{count} items',
  } as unknown as Partial<Dictionary>;

  it('selects the CLDR category for the count', () => {
    const t = createTranslator({ locale: 'en', messages: plurals });

    expect(t.plural('quota.scans', 1)).toBe('1 scan left');
    expect(t.plural('quota.scans', 5)).toBe('5 scans left');
    expect(t.plural('quota.scans', 0)).toBe('0 scans left');
  });

  it('falls back to `_other` when the selected category is not defined', () => {
    const t = createTranslator({ locale: 'en', messages: plurals });

    // Every CLDR locale defines `other`, so a locale that omits a rarer category still
    // renders something grammatical instead of the raw key.
    expect(t.plural('quota.onlyOther', 1)).toBe('1 items');
  });

  it('renders the base key and warns when no form exists at all', () => {
    const transport = createMemoryTransport();
    const logger = createLogger({ scope: 'test', level: 'trace', transports: [transport] });
    const t = createTranslator({ locale: 'en', messages: {}, logger });

    expect(t.plural('nope.plural', 2)).toBe('nope.plural');
    expect(transport.records[0]?.message).toBe('missing plural translation');
  });

  it('lets extra params through alongside count', () => {
    const t = createTranslator({
      locale: 'en',
      messages: { x_other: '{count} of {total}' } as unknown as Partial<Dictionary>,
    });

    expect(t.plural('x', 3, { total: 10 })).toBe('3 of 10');
  });
});

describe('the key translator', () => {
  it('returns keys unchanged so tests assert on which message, not on its wording', () => {
    const t = createKeyTranslator();

    expect(t.t(key('common.save'))).toBe('common.save');
    expect(t.plural('quota.scans', 3)).toBe('quota.scans:3');
    expect(t.has(key('anything'))).toBe(true);
    expect(t.dir).toBe('ltr');
  });
});
