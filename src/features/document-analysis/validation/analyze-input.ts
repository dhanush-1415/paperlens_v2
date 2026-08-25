/**
 * The schema for the analysis form (requirement 20).
 *
 * ### Why the schema lives in the feature and the primitives live in `shared`
 *
 * `documentTextSchema` encodes a platform limit — how much text this system will accept —
 * and three features quote it. The *composition* below encodes this form's contract: these
 * fields, this shape, these names. Sharing the composition would couple two forms that merely
 * happen to look alike today; sharing only the primitives keeps the limit in one place while
 * letting each form evolve.
 *
 * ### One schema, both sides
 *
 * The same object validates the client-side pre-submit check and the Server Action. Not to
 * save typing — because two schemas drift, and when they drift the client accepts something
 * the server rejects, which is the specific failure that looks to a user like the button not
 * working. The client copy is a courtesy; the server copy is the one that decides.
 */

import { z } from 'zod';

import { documentTextSchema, optionalTextSchema } from '@/shared/validation';

import { DOCUMENT_TYPES } from '../domain';

/**
 * Message *keys*, not messages.
 *
 * `validation.document.tooShort` is resolved by the `Translator` at the point of render. A
 * literal English sentence here would be a string the i18n layer cannot reach — and one that
 * gets copy-edited in a schema file, where no writer will ever look for it.
 */
export const analyzeDocumentSchema = z.object({
  text: documentTextSchema,
  documentType: z.enum(DOCUMENT_TYPES, { message: 'validation.required' }),
  tone: z.enum(['simple', 'professional']).optional(),
  title: optionalTextSchema(120),
});

export type AnalyzeDocumentFormValues = z.infer<typeof analyzeDocumentSchema>;

/**
 * Field names as data.
 *
 * The `<textarea name="text">` in the form and the `text` key in the schema have to agree, and
 * nothing checks that they do — a renamed field produces an empty value and a confusing
 * "required" error rather than a compile failure. Deriving both from this record makes the
 * agreement structural.
 */
export const ANALYZE_FIELDS = {
  text: 'text',
  documentType: 'documentType',
  title: 'title',
  tone: 'tone',
} as const satisfies Record<keyof AnalyzeDocumentFormValues, string>;
