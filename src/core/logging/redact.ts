/**
 * Redaction.
 *
 * PaperLens handles IRS notices, medical bills, leases and court summons. A log line that
 * echoes a request body is a data breach, not a debugging aid. So redaction is not
 * opt-in at the call site — it runs on every record, and the safe default is to drop.
 *
 * Two passes: keys that are sensitive by name, and values that look like a credential
 * regardless of what they are called.
 */

const REDACTED = '[redacted]';

/** Matched against the key, case-insensitively, anywhere in the name. */
const SENSITIVE_KEY_PATTERN =
 /pass(word|phrase)?|secret|token|jwt|bearer|authorization|cookie|session|api[-_]?key|private[-_]?key|credential|signature|otp|pin\b|ssn|social[-_]?security|tax[-_]?id|ein\b|routing|account[-_]?number|iban|card|cvv|cvc|expiry|dob|date[-_]?of[-_]?birth|email|phone|mobile|address|postcode|zip|licen[cs]e|passport/i;

/** Keys whose *contents* are user document text — never logged, at any level. */
const DOCUMENT_CONTENT_KEYS = /^(content|body|text|rawText|documentText|extractedText|ocr)$/i;

const VALUE_PATTERNS: ReadonlyArray<RegExp> = [
 // JWT
 /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\b/g,
 // Bearer / Basic auth header values
 /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi,
 // Common secret-key prefixes (Stripe, OpenAI, GitHub, Supabase service keys)
 /\b(sk|pk|rk|whsec|ghp|gho|github_pat)_[A-Za-z0-9]{8,}\b/g,
 // Email addresses
 /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
 // Payment card numbers (13–19 digits, optionally grouped)
 /\b(?:\d[ -]*?){13,19}\b/g,
 // US SSN
 /\b\d{3}-\d{2}-\d{4}\b/g,
];

const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 20;
const MAX_STRING_LENGTH = 2_000;

/**
 * Recursively redact a value for logging.
 *
 * Depth, array length and string length are all bounded: an unbounded log record is its
 * own outage. Truncation is marked so a reader knows something was cut rather than absent.
 */
export function redact(value: unknown, depth = 0): unknown {
 if (depth > MAX_DEPTH) return '[depth-limit]';

 if (value === null || value === undefined) return value;

 if (typeof value === 'string') return redactString(value);

 if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
 return typeof value === 'bigint' ? value.toString() : value;
 }

 if (value instanceof Date) return value.toISOString();

 if (value instanceof Error) {
 return {
 name: value.name,
 message: redactString(value.message),
 stack: value.stack,
 };
 }

 if (Array.isArray(value)) {
 const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => redact(item, depth + 1));
 if (value.length > MAX_ARRAY_ITEMS) {
 items.push(`[+${value.length - MAX_ARRAY_ITEMS} more]`);
 }
 return items;
 }

 if (typeof value === 'object') {
 const output: Record<string, unknown> = {};
 for (const key of Object.keys(value as Record<string, unknown>)) {
 // Reading a property can run a getter, and a getter can throw. Logging must never be
 // able to fail the request it is describing, so each read is guarded individually
 // rather than the loop as a whole — one hostile property should not hide the rest.
 let entry: unknown;
 try {
 entry = (value as Record<string, unknown>)[key];
 } catch {
 output[key] = '[unreadable]';
 continue;
 }

 if (SENSITIVE_KEY_PATTERN.test(key)) {
 output[key] = REDACTED;
 } else if (DOCUMENT_CONTENT_KEYS.test(key)) {
 output[key] =
 typeof entry === 'string' ? `[document-content: ${entry.length} chars]` : REDACTED;
 } else {
 output[key] = redact(entry, depth + 1);
 }
 }
 return output;
 }

 // Functions, symbols — never meaningful in a log.
 return `[${typeof value}]`;
}

function redactString(value: string): string {
 let output = value;
 for (const pattern of VALUE_PATTERNS) {
 output = output.replace(pattern, REDACTED);
 }
 return output.length > MAX_STRING_LENGTH
 ? `${output.slice(0, MAX_STRING_LENGTH)}…[+${output.length - MAX_STRING_LENGTH} chars]`
 : output;
}

export function redactContext(context: Record<string, unknown>): Record<string, unknown> {
 return redact(context) as Record<string, unknown>;
}
