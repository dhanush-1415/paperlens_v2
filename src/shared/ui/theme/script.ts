/**
 * The no-flash bootstrap script (requirement 1).
 *
 * ### The problem
 *
 * The server cannot know the user's theme. The preference lives in `localStorage`, which is
 * a browser API, and `'system'` resolves against an OS setting the server has never seen.
 * So the HTML is streamed with the default theme applied, React hydrates, an effect reads
 * storage, and *then* the page changes colour — a full-screen flash on every hard load, for
 * every user who is not on the default.
 *
 * ### The fix
 *
 * A synchronous, blocking, inline `<script>` in `<head>`. It runs after the stylesheet is
 * parsed and before the first paint, sets `data-theme` on `<html>`, and the browser paints
 * once, correctly. React later adopts whatever this decided (see `ThemeProvider`) rather
 * than re-deciding it.
 *
 * There is no way to do this without an inline script. `next/script` cannot help — every
 * strategy it offers (`afterInteractive`, `lazyOnload`, even `beforeInteractive`) runs too
 * late or is deferred, and any external `<script src>` is a network round trip during which
 * the page is already painted. This is the single audited `dangerouslySetInnerHTML` in the
 * codebase, and `eslint.config.mjs` grants the exemption to this directory alone.
 *
 * ### Why it duplicates the storage envelope
 *
 * The script cannot import anything — it is a string that runs before the bundle exists. So
 * it re-implements the read that `createStorageEntry` performs: same key, same `{v,d}`
 * envelope, same validation. Both sides derive the key and version from the constants below,
 * and `script.test.ts` executes this string against a real entry write to prove the two
 * agree. That is the only defence available, and it is a real one.
 */

import { escapeScriptContent } from '@/core/security/sanitize';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

import { DEFAULT_THEME_PREFERENCE, THEME_PREFERENCES } from './types';

/**
 * Envelope version for the persisted preference.
 *
 * Shared by the script and by `ThemeProvider`'s `StorageEntry`. Bumping it discards every
 * user's stored choice and falls everyone back to `'system'` — correct behaviour if the
 * stored shape ever changes, and the reason this is a named constant rather than a `1`
 * written in two places.
 */
export const THEME_STORAGE_VERSION = 1;

/**
 * Queried for `light`, not for `dark`.
 *
 * A browser that does not support `prefers-color-scheme` returns `matches: false` for any
 * query, so asking for light means an unsupporting browser falls through to dark — which is
 * the unconditional base in `tokens.css` and therefore the one theme guaranteed to be
 * complete. Asking for dark would resolve those browsers to light and leave them relying on
 * the override block.
 */
export const SYSTEM_LIGHT_QUERY = '(prefers-color-scheme: light)';

/**
 * Builds the script source.
 *
 * Every dynamic part is a constant from this codebase, interpolated at module scope — there
 * is no user input anywhere in this string. `escapeScriptContent` is applied regardless,
 * because "there is no user input in this template" is a statement about today's code and
 * the escape is a statement about every future edit to it.
 *
 * Wrapped in *three separate* `try`/`catch` blocks, not one.
 *
 * `localStorage` throws outright in Safari's private mode and under a blocked-cookies policy,
 * `JSON.parse` throws on a value half-written by a killed tab, and `matchMedia` is absent in
 * some embedded browsers. A single wrapper around the whole body means any one of those
 * aborts before `data-theme` is written, and the page renders with no theme attribute at all
 * — so a light-preferring user in a private window gets the dark base theme. Scoping each
 * catch to its own step keeps the script *total*: every path ends with a concrete theme on
 * `<html>`, degrading preference by preference rather than all at once. That is the difference
 * between "you get the default theme" and "the theme system did not run", which is exactly
 * the distinction `script.test.ts` executes this string to check.
 */
function buildThemeScript(): string {
 const key = JSON.stringify(STORAGE_KEYS.theme);
 const version = String(THEME_STORAGE_VERSION);
 const valid = JSON.stringify(THEME_PREFERENCES);
 const fallback = JSON.stringify(DEFAULT_THEME_PREFERENCE);
 const lightQuery = JSON.stringify(SYSTEM_LIGHT_QUERY);

 // Minified by hand rather than by a build step: this string ships in the HTML of every
 // page, so its byte count is paid on every request, and a build step that rewrote it
 // would put a transform between this file and what actually runs.
 const source = `(function(){var p=${fallback};try{var r=localStorage.getItem(${key});if(r){var e=JSON.parse(r);if(e&&e.v===${version}&&${valid}.indexOf(e.d)>-1)p=e.d}}catch(_){}var t=p;if(p==="system"){t="dark";try{if(window.matchMedia(${lightQuery}).matches)t="light"}catch(_){}}try{document.documentElement.dataset.theme=t}catch(_){}})()`;

 return escapeScriptContent(source);
}

/**
 * The script source, computed once at module load.
 *
 * Constant for the lifetime of the process, so recomputing it per request would be pure
 * waste on a path that runs for every page view.
 */
export const THEME_BOOTSTRAP_SCRIPT = buildThemeScript();
