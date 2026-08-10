/**
 * String helpers.
 *
 * Pure, framework-free, and — where user-visible text is involved — Unicode-aware. A
 * `.slice()` on a string containing an emoji or a combining accent cuts a grapheme in half
 * and renders as a replacement character, which is the kind of bug that only appears in the
 * one screenshot a customer sends.
 */

/** Truncate to `max` characters, breaking at a grapheme boundary. */
export function truncate(value: string, max: number, ellipsis = '…'): string {
 if (value.length <= max) return value;
 const graphemes = [...value];
 if (graphemes.length <= max) return value;
 return graphemes.slice(0, Math.max(0, max - ellipsis.length)).join('') + ellipsis;
}

/** Truncate at a word boundary, so a preview never ends mid-word. */
export function truncateWords(value: string, max: number, ellipsis = '…'): string {
 if (value.length <= max) return value;
 const cut = value.slice(0, max);
 const lastSpace = cut.lastIndexOf(' ');
 return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + ellipsis;
}

/** Collapse whitespace runs and trim. The first step on any pasted document. */
export function normalizeWhitespace(value: string): string {
 return value.replace(/\s+/g, ' ').trim();
}

/** Collapse blank-line runs but keep paragraph structure. For document text. */
export function normalizeParagraphs(value: string): string {
 return value
 .replace(/\r\n?/g, '\n')
 .replace(/[ \t]+/g, ' ')
 .replace(/\n{3,}/g, '\n\n')
 .trim();
}

export function capitalize(value: string): string {
 return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

/** `documentAnalysis` → `Document Analysis`. For turning a key into a label. */
export function titleCaseFromKey(value: string): string {
 return value
 .replace(/[_-]+/g, ' ')
 .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
 .split(' ')
 .filter(Boolean)
 .map(capitalize)
 .join(' ');
}

export function slugify(value: string): string {
 return value
 .toLowerCase()
 .normalize('NFKD')
 .replace(/[\u0300-\u036f]/g, '') // strip the accents NFKD just separated out
 .replace(/[^a-z0-9]+/g, '-')
 .replace(/^-+|-+$/g, '');
}

/** Initials for an avatar fallback. Grapheme-aware, so a non-Latin name still works. */
export function initials(value: string, max = 2): string {
 return value
 .split(/\s+/)
 .filter(Boolean)
 .slice(0, max)
 .map((part) => [...part][0] ?? '')
 .join('')
 .toUpperCase();
}

/** Approximate reading time in minutes, at 220wpm. Never returns 0. */
export function readingTimeMinutes(value: string, wordsPerMinute = 220): number {
 const words = value.trim().split(/\s+/).filter(Boolean).length;
 return Math.max(1, Math.round(words / wordsPerMinute));
}

/**
 * Mask all but the last `visible` characters.
 *
 * For showing a user their own identifier without putting it in full on screen — an account
 * number in a support ticket, an API key in a settings page.
 */
export function mask(value: string, visible = 4, maskChar = '•'): string {
 if (value.length <= visible) return maskChar.repeat(value.length);
 return maskChar.repeat(value.length - visible) + value.slice(-visible);
}

/** Pluralize by count. `pluralize(1, 'document')` → `1 document`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
 return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * `{name}` — deliberately not `{{name}}`, so a stray brace in prose is not a syntax error.
 *
 * Lives here rather than in `core/i18n` because it is a pure string operation and both sides
 * of the RSC boundary need it: the translator interpolates on the server, and a Client
 * Component handed a message *template* as a prop interpolates in the browser. Templates cross
 * that boundary; the functions that would otherwise format them do not — passing one throws
 * "Functions cannot be passed directly to Client Components", which is React telling you the
 * label should have been data all along.
 */
const PLACEHOLDER = /\{(\w+)\}/g;

export function interpolate(
 template: string,
 params: Readonly<Record<string, string | number>> | undefined,
): string {
 if (!params) return template;

 return template.replace(PLACEHOLDER, (match, name: string) => {
 const value = params[name];
 // An unfilled placeholder is left visible rather than blanked. `{count}` on screen tells
 // whoever sees it exactly which parameter the caller forgot.
 return value === undefined ? match : String(value);
 });
}

/**
 * A message key with its parameters travelling alongside it, as one string.
 *
 * ### Why this exists
 *
 * `validation.tooShort` is `'Must be at least {min} characters.'`, and the only place that
 * knows what `min` is, is the schema — `documentTextSchema` says `.min(200)`. But a field
 * error is carried as `Record<string, string[]>`: a flat, serializable shape that survives a
 * Server Action's return trip and that `FormField` can render without knowing anything about
 * i18n. Widening it to `{ key, params }` objects would push i18n's data model through the
 * error envelope, the action result, and every form component on the way to the input.
 *
 * So the parameters ride in the string, in the one encoding every runtime on both sides of
 * the wire already parses correctly: `validation.tooShort?min=200`. A consumer that does not
 * decode — the JSON API, a log line — sees a key that still reads as a key and now also
 * states its bound, which is strictly more useful than the bare key was.
 *
 * The separator is `?` because a message key is dotted and never contains one, so decoding
 * is unambiguous and a plain key decodes to itself.
 */
export function encodeMessageRef(
 key: string,
 params?: Readonly<Record<string, string | number>>,
): string {
 if (!params) return key;

 const entries = Object.entries(params);
 if (entries.length === 0) return key;

 const query = new URLSearchParams(entries.map(([name, value]) => [name, String(value)]));
 return `${key}?${query.toString()}`;
}

export function decodeMessageRef(ref: string): {
 key: string;
 params?: Record<string, string>;
} {
 const separator = ref.indexOf('?');
 if (separator === -1) return { key: ref };

 return {
 key: ref.slice(0, separator),
 params: Object.fromEntries(new URLSearchParams(ref.slice(separator + 1))),
 };
}
