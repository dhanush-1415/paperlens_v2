/**
 * Input sanitization (requirement 15).
 *
 * The first thing to say is what this file is *not* for. React escapes everything it renders
 * as a child, so ordinary text needs no sanitizing — calling `escapeHtml` before putting a
 * string in JSX produces `&amp;lt;` on screen and is a bug, not a defence.
 *
 * These helpers exist for the narrow set of places where a value leaves React's escaping:
 * an `href`, a downloaded filename, a CSV cell, an inline script, a log line. Each of those
 * has its own injection grammar, so each gets its own function. A single `sanitize()` that
 * claims to cover all of them is the shape of most XSS bugs.
 *
 * Every pattern below is written with explicit `\uXXXX` escapes rather than literal
 * characters, so the source stays plain ASCII and a copy-paste through a tool that
 * normalizes whitespace cannot silently weaken a rule.
 */

import { SAFE_URL_SCHEME, UNSAFE_FILENAME_CHARS } from '@/shared/constants/regex';

/** C0 control characters, which several parsers strip before interpreting a value. */
const CONTROL_CHARS = /[\u0000-\u001f]/g;

/**
 * Escape for interpolation into raw HTML.
 *
 * Only needed when bypassing React — `dangerouslySetInnerHTML`, an email template, an
 * `ImageResponse`. ESLint restricts `dangerouslySetInnerHTML` to the theme script, so in
 * practice this is for server-generated markup.
 */
export function escapeHtml(value: string): string {
 return value
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&#39;');
}

/**
 * Escape for use inside a `<script>` block.
 *
 * Distinct from `escapeHtml` because the rules are different: the HTML parser ends a script
 * at the literal text `</script`, wherever it appears — including inside a JSON string.
 * Serializing state into a page without this is a classic breakout. `<!--` gets the same
 * treatment because it opens a comment under legacy script parsing.
 *
 * Used by the inline no-flash theme script, which is the only inline script this app ships.
 */
export function escapeScriptContent(value: string): string {
 return (
 value
 .replace(/<\/(script)/gi, '<\\/$1')
 .replace(/<!--/g, '<\\!--')
 // U+2028 and U+2029 are legal inside a JSON string but count as line terminators in
 // JavaScript, so an unescaped one turns a serialized payload into a syntax error.
 .replace(/\u2028/g, '\\u2028')
 .replace(/\u2029/g, '\\u2029')
 );
}

/**
 * Return a URL only if it is safe to put in an `href`.
 *
 * `javascript:` is the obvious one. `data:` is the one people forget — a `data:text/html`
 * link executes script in the origin's context when opened. `vbscript:` still works in some
 * embedded browsers. Anything not on the allowlist becomes `null`, which the caller should
 * render as plain text rather than as a link.
 */
export function safeHref(value: string | null | undefined): string | null {
 if (!value) return null;

 // Control characters are stripped first: `java\tscript:` is parsed as `javascript:` by
 // browsers but slips past a naive prefix check.
 const cleaned = value.trim().replace(CONTROL_CHARS, '');
 if (cleaned.length === 0) return null;

 // Relative URLs and fragments carry no scheme and are safe by construction.
 if (cleaned.startsWith('/') || cleaned.startsWith('#') || cleaned.startsWith('?')) {
 // Except protocol-relative `//evil.com`, which is an absolute URL wearing a disguise.
 return cleaned.startsWith('//') ? null : cleaned;
 }

 const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(cleaned);
 if (!schemeMatch) return cleaned;

 // The allowlist is matched against the bare scheme, which is what the capture holds.
 return SAFE_URL_SCHEME.test(schemeMatch[1] ?? '') ? cleaned : null;
}

/**
 * Make a string safe as a downloaded filename.
 *
 * Three separate hazards: path traversal, reserved device names on Windows (`CON`, `PRN`,
 * `AUX`, `NUL`, `COM1`..., which fail in ways that look like a corrupt download), and
 * characters the filesystem rejects outright. Also length-capped, because most filesystems
 * stop at 255 bytes and a truncated extension breaks the file association.
 */
export function safeFilename(value: string, fallback = 'download'): string {
 const base = value
 .replace(/[/\\]+/g, '-')
 .replace(UNSAFE_FILENAME_CHARS, '')
 .replace(/^\.+/, '')
 .trim();

 if (base.length === 0) return fallback;

 const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;
 const safe = reserved.test(base) ? `_${base}` : base;

 return safe.length > 200 ? safe.slice(0, 200) : safe;
}

/**
 * Neutralize a value destined for a CSV cell.
 *
 * Spreadsheet applications evaluate a cell beginning with `=`, `+`, `-`, `@`, tab or CR as a
 * formula. An exported document title of `=HYPERLINK("http://evil","click")` becomes a live
 * link in the recipient's Excel. A leading single quote disarms it.
 */
export function safeCsvCell(value: string): string {
 const needsGuard = /^[=+\-@\t\r]/.test(value);
 const escaped = value.replace(/"/g, '""');
 return needsGuard ? `'${escaped}` : escaped;
}

/**
 * Strip characters that would let user input forge a log line.
 *
 * Newlines in user input let an attacker write a fake entry — an old technique that still
 * works against anything concatenating strings. The structured logger sidesteps this by
 * serializing to JSON; this is for the boundaries that do not.
 */
export function safeLogValue(value: string, maxLength = 512): string {
 const flattened = value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
 return flattened.length > maxLength ? `${flattened.slice(0, maxLength)}...` : flattened;
}

/**
 * Collapse a user-supplied string to a single line of bounded length.
 *
 * For headers and metadata where a newline splits the value into two fields — response
 * splitting — rather than merely looking untidy.
 */
export function safeHeaderValue(value: string, maxLength = 256): string {
 return value.replace(/[\r\n]+/g, '').slice(0, maxLength);
}
