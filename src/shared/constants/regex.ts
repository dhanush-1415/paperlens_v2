/**
 * Shared patterns (requirements 19 and 20).
 *
 * Two rules govern everything in this file.
 *
 * First: no `g` flag. A global regex carries mutable `lastIndex`, so a module-level one
 * shared between call sites returns different answers on alternate calls to `.test()` — a
 * bug that only shows up under load and looks like flakiness. Anything needing `g`
 * constructs its own instance locally.
 *
 * Second: no unbounded nested quantifiers. `(a+)+` against a long non-matching input is a
 * denial of service with no packets required, and these patterns run on user input.
 */

/** Slug in a URL: lowercase, hyphen-separated, no leading/trailing hyphen. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** UUID v4, the ID shape used throughout. Prefer `z.uuid()` in schemas. */
export const UUID =
 /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** URL-safe share token: 22+ base64url characters. */
export const SHARE_TOKEN = /^[A-Za-z0-9_-]{22,64}$/;

/**
 * Password strength: at least one lower, one upper, one digit.
 *
 * Length is checked separately by the schema, because a regex that also enforces length
 * produces one useless "invalid password" message instead of three actionable ones.
 */
export const PASSWORD_LOWERCASE = /[a-z]/;
export const PASSWORD_UPPERCASE = /[A-Z]/;
export const PASSWORD_DIGIT = /\d/;
export const PASSWORD_SYMBOL = /[^A-Za-z0-9]/;

/** E.164 phone number. Storage format; display formatting is a separate concern. */
export const E164_PHONE = /^\+[1-9]\d{7,14}$/;

/** ISO 8601 date, `YYYY-MM-DD`. */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Hex colour, 3 or 6 digits. Used when validating tenant token overrides. */
export const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Runs of whitespace, for normalising pasted document text. Local `g` at the call site. */
export const WHITESPACE_RUN_SOURCE = '\\s+';

/**
 * Characters stripped from a filename before it is stored or echoed back.
 * Path separators, control characters and the Windows reserved set.
 *
 * `g` is required, not stylistic: without it `String.replace` strips only the *first*
 * offending character, so `a<b<c` sanitizes to `ab<c`. Safe to share at module scope
 * because `replace` resets `lastIndex`; the same regex reused with `.test()` would not be.
 */
export const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

/**
 * URL schemes allowed in an `href`. Matched against the scheme **alone** — `https`, not
 * `https://` — because that is what `safeHref` extracts before testing. A pattern written
 * to match the full `https://` prefix silently rejects every absolute URL instead.
 *
 * `mailto` and `tel` are here because support links need them and neither can execute
 * script. `javascript`, `data` and `vbscript` are absent, which is the entire point.
 */
export const SAFE_URL_SCHEME = /^(https?|mailto|tel)$/i;
