import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createStorageEntry } from '@/core/storage/entry';
import { createLocalStorageDriver } from '@/core/storage/drivers';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

import { SYSTEM_LIGHT_QUERY, THEME_BOOTSTRAP_SCRIPT, THEME_STORAGE_VERSION } from './script';
import { DEFAULT_THEME_PREFERENCE } from './types';

/**
 * The no-flash script, actually executed.
 *
 * `THEME_BOOTSTRAP_SCRIPT` is a string that ships in the HTML of every page and runs before
 * any bundle exists, so it cannot import the storage helper it has to agree with — it
 * re-implements the read. This file is the only defence against those two implementations
 * drifting: it writes a preference through the *real* `StorageEntry` and then runs the *real*
 * script string against it, in a real DOM. If the envelope shape, the key or the version ever
 * diverge, the script silently falls back to the default and every user with a stored light
 * preference gets a dark flash on load — a bug that is invisible in code review and obvious
 * to every user.
 */

const run = () => {
 // `eval` rather than a `<script>` tag: jsdom executes injected scripts asynchronously, and
 // the whole point of this code is that it is synchronous and blocking.
 (0, eval)(THEME_BOOTSTRAP_SCRIPT);
};

const themeEntry = () =>
 createStorageEntry(
 {
 key: STORAGE_KEYS.theme,
 version: THEME_STORAGE_VERSION,
 fallback: DEFAULT_THEME_PREFERENCE,
 },
 { driver: createLocalStorageDriver() },
 );

/** jsdom's `matchMedia` is a stub that always answers `false`; the script needs a real answer. */
function stubSystemPreference(prefersLight: boolean) {
 window.matchMedia = ((query: string) => ({
 matches: query === SYSTEM_LIGHT_QUERY ? prefersLight : !prefersLight,
 media: query,
 addEventListener: () => {},
 removeEventListener: () => {},
 addListener: () => {},
 removeListener: () => {},
 onchange: null,
 dispatchEvent: () => false,
 })) as typeof window.matchMedia;
}

beforeEach(() => {
 localStorage.clear();
 delete document.documentElement.dataset.theme;
 stubSystemPreference(false);
});

afterEach(() => {
 localStorage.clear();
});

describe('the script agrees with the storage entry it cannot import', () => {
 it('reads a stored "light" written by the real StorageEntry', () => {
 themeEntry().set('light');
 run();

 expect(document.documentElement.dataset.theme).toBe('light');
 });

 it('reads a stored "dark" the same way', () => {
 themeEntry().set('dark');
 run();

 expect(document.documentElement.dataset.theme).toBe('dark');
 });

 it('resolves a stored "system" against the OS preference', () => {
 themeEntry().set('system');

 stubSystemPreference(true);
 run();
 expect(document.documentElement.dataset.theme).toBe('light');

 stubSystemPreference(false);
 run();
 expect(document.documentElement.dataset.theme).toBe('dark');
 });
});

describe('it always resolves to a concrete theme', () => {
 it('never writes "system" to the DOM — the attribute is a resolved value', () => {
 // `[data-theme='system']` matches no CSS rule. If the script wrote the preference rather
 // than the resolution, the entire light theme would silently never apply.
 themeEntry().set('system');
 run();

 expect(['light', 'dark']).toContain(document.documentElement.dataset.theme);
 });

 it('falls back to the default when nothing is stored', () => {
 run();

 expect(document.documentElement.dataset.theme).toBe('dark');
 });

 it('ignores a stored value that is not a known preference', () => {
 localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify({ v: THEME_STORAGE_VERSION, d: 'neon' }));
 run();

 expect(document.documentElement.dataset.theme).toBe('dark');
 });

 it('ignores an envelope from an older version', () => {
 localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify({ v: THEME_STORAGE_VERSION - 1, d: 'light' }));
 run();

 expect(document.documentElement.dataset.theme).toBe('dark');
 });

 it('survives corrupt JSON without throwing', () => {
 // A half-written value from a killed tab must not abort the script — an exception here
 // leaves `data-theme` unset and the page renders with no theme at all.
 localStorage.setItem(STORAGE_KEYS.theme, '{not json');

 expect(run).not.toThrow();
 expect(document.documentElement.dataset.theme).toBe('dark');
 });

 it('survives storage throwing outright, as it does in private mode', () => {
 const original = Storage.prototype.getItem;
 Storage.prototype.getItem = () => {
 throw new DOMException('The operation is insecure.', 'SecurityError');
 };

 try {
 expect(run).not.toThrow();
 expect(document.documentElement.dataset.theme).toBe('dark');
 } finally {
 Storage.prototype.getItem = original;
 }
 });

 it('survives a browser with no matchMedia at all', () => {
 themeEntry().set('system');
 const original = window.matchMedia;
 // @ts-expect-error — deliberately removing the API to model an old or embedded browser.
 delete window.matchMedia;

 try {
 // The `system` resolution degrades to the base theme rather than aborting: a browser
 // that cannot report a preference still gets a complete, concrete one.
 expect(run).not.toThrow();
 expect(document.documentElement.dataset.theme).toBe('dark');
 } finally {
 window.matchMedia = original;
 }
 });
});

describe('the script itself', () => {
 it('queries for light, so an unsupporting browser falls through to the base theme', () => {
 // Asking for `dark` would resolve those browsers to `light`, which in this stylesheet is
 // the override block — the one theme that is not guaranteed complete on its own.
 expect(THEME_BOOTSTRAP_SCRIPT).toContain(SYSTEM_LIGHT_QUERY);
 expect(THEME_BOOTSTRAP_SCRIPT).not.toContain('prefers-color-scheme: dark');
 });

 it('contains nothing that could terminate the surrounding script tag', () => {
 expect(THEME_BOOTSTRAP_SCRIPT).not.toMatch(/<\/script/i);
 expect(THEME_BOOTSTRAP_SCRIPT).not.toContain('<!--');
 });

 it('stays small enough to be worth inlining on every page', () => {
 // It is paid for on every request, uncached. A few hundred bytes buys a correct first
 // paint; a few kilobytes would not.
 expect(THEME_BOOTSTRAP_SCRIPT.length).toBeLessThan(600);
 });

 it('is wrapped so it leaks no globals', () => {
 run();

 expect('p' in window).toBe(false);
 expect('t' in window).toBe(false);
 });
});
