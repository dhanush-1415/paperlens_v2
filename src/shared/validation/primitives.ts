import { z } from 'zod';

import { INPUT_LIMITS } from '../constants/limits';
import {
  E164_PHONE,
  PASSWORD_DIGIT,
  PASSWORD_LOWERCASE,
  PASSWORD_UPPERCASE,
  SHARE_TOKEN,
  SLUG,
} from '../constants/regex';

/**
 * Validation primitives (requirement 20).
 *
 * One definition per concept, composed everywhere. The alternative — each form declaring
 * `z.string().email()` with its own message — means "email address" is validated eight
 * slightly different ways and the error copy is inconsistent across the product.
 *
 * These are Zod 4: `z.email()` and `z.uuid()` are top-level functions now, not methods on
 * `z.string()`. The old chained form still type-checks in places and is deprecated; do not
 * copy it in from older examples.
 *
 * Messages are **keys**, not sentences. They resolve through `core/i18n`, which is what
 * makes the product translatable without revisiting every schema. The keys read as prose so
 * an untranslated fallback is still comprehensible.
 */

// ── Scalars ───────────────────────────────────────────────────────────────────────────────

export const uuidSchema = z.uuid({ message: 'validation.uuid' });

/**
 * Email address.
 *
 * Normalization runs **before** validation, via `.pipe()`. The obvious chain —
 * `z.email().trim().toLowerCase()` — reads as if it trims first, but Zod runs checks and
 * transforms in declaration order, so the format check would see the raw input and reject
 * ` ada@example.com ` outright. A trailing space from autofill or a copy-paste is one of
 * the most common things a real sign-up form receives; rejecting it as "not a valid email"
 * is a support ticket, not a validation.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z.email({ message: 'validation.email' }).max(254, { message: 'validation.email.tooLong' }), // RFC 5321 maximum
  );

export const slugSchema = z
  .string()
  .min(1, { message: 'validation.required' })
  .max(80, { message: 'validation.tooLong' })
  .regex(SLUG, { message: 'validation.slug' });

export const shareTokenSchema = z.string().regex(SHARE_TOKEN, { message: 'validation.shareToken' });

export const phoneSchema = z.string().trim().regex(E164_PHONE, { message: 'validation.phone' });

export const urlSchema = z
  .url({ message: 'validation.url' })
  .refine((value) => value.startsWith('http://') || value.startsWith('https://'), {
    message: 'validation.url.protocol',
  });

export const isoDateSchema = z.iso.date({ message: 'validation.date' });
export const isoDateTimeSchema = z.iso.datetime({ message: 'validation.dateTime' });

/**
 * Password.
 *
 * Composition rules are checked as separate refinements so a user gets one message per
 * missing requirement, rather than a single "password is invalid" that leaves them
 * guessing. Length before composition — length is the one that actually matters.
 */
export const passwordSchema = z
  .string()
  .min(12, { message: 'validation.password.tooShort' })
  .max(128, { message: 'validation.password.tooLong' })
  .refine((value) => PASSWORD_LOWERCASE.test(value), { message: 'validation.password.lowercase' })
  .refine((value) => PASSWORD_UPPERCASE.test(value), { message: 'validation.password.uppercase' })
  .refine((value) => PASSWORD_DIGIT.test(value), { message: 'validation.password.digit' });

// ── Text ──────────────────────────────────────────────────────────────────────────────────

/** Required free text with a length ceiling. Trimmed first, so " " is empty. */
export function textSchema(options: { min?: number; max: number; label?: string }) {
  const { min = 1, max } = options;
  return z
    .string()
    .trim()
    .min(min, { message: min === 1 ? 'validation.required' : 'validation.tooShort' })
    .max(max, { message: 'validation.tooLong' });
}

/** Optional free text. Empty string normalises to `undefined`, never to `''`. */
export function optionalTextSchema(max: number) {
  return z
    .string()
    .trim()
    .max(max, { message: 'validation.tooLong' })
    .optional()
    .transform((value) => (value === '' ? undefined : value));
}

export const documentTextSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.minDocumentChars, { message: 'validation.document.tooShort' })
  .max(INPUT_LIMITS.maxDocumentChars, { message: 'validation.document.tooLong' });

export const searchQuerySchema = z
  .string()
  .trim()
  .max(INPUT_LIMITS.maxSearchQueryLength, { message: 'validation.tooLong' });

// ── Pagination and sorting ────────────────────────────────────────────────────────────────

/**
 * Page parameters read from the URL.
 *
 * `coerce` because `searchParams` values are always strings, and `catch` because a
 * hand-edited `?page=banana` should show page one, not a 500. This is the one place in the
 * codebase where swallowing a validation failure is right: the input is a URL a stranger
 * can type.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20),
});

export const sortOrderSchema = z.enum(['asc', 'desc']).catch('desc');

// ── Files ─────────────────────────────────────────────────────────────────────────────────

/**
 * Uploaded file.
 *
 * MIME type is checked against an allowlist, never a denylist — a denylist is a list of
 * the attacks you have already thought of. Note the browser-reported type is a *hint*: the
 * server must sniff the actual content before trusting it.
 */
export const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'text/plain',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
] as const;

export const uploadFileSchema = z
  .instanceof(File, { message: 'validation.file.required' })
  .refine((file) => file.size > 0, { message: 'validation.file.empty' })
  .refine((file) => file.size <= INPUT_LIMITS.maxUploadBytes, {
    message: 'validation.file.tooLarge',
  })
  .refine((file) => (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type), {
    message: 'validation.file.unsupportedType',
  });

// ── Form helpers ──────────────────────────────────────────────────────────────────────────

/** An HTML checkbox submits `"on"` or nothing at all. */
export const checkboxSchema = z
  .union([z.literal('on'), z.literal('true'), z.boolean(), z.undefined()])
  .transform((value) => value === 'on' || value === 'true' || value === true);

/** Terms acceptance — a checkbox that must be true. */
export const acceptedSchema = checkboxSchema.refine((value) => value, {
  message: 'validation.mustAccept',
});
