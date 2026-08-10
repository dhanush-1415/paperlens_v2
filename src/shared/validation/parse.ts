import type { z } from 'zod';

import { AppError, validationError } from '@/core/errors/app-error';
import { toFieldErrors } from '@/core/errors/normalize';
import { err, ok, type Result } from '@/core/result/result';

/**
 * Parsing helpers (requirement 20).
 *
 * `schema.parse()` throws a `ZodError`, which is the wrong currency for the data path — it
 * forces a try/catch at every boundary and carries a shape the UI cannot consume. These
 * return `Result<T, AppError>` with field errors already keyed by dotted path, which is
 * exactly what `useActionState` and the `FormField` component expect.
 *
 * `.safeParse()` alone is not enough: it returns `ZodError` too, so every call site would
 * repeat the flattening. Repeating it once per form is how two forms end up disagreeing
 * about whether the key is `user.email` or `email`.
 */

export function parse<TSchema extends z.ZodType>(
 schema: TSchema,
 input: unknown,
): Result<z.output<TSchema>, AppError> {
 const result = schema.safeParse(input);
 return result.success
 ? ok(result.data)
 : err(validationError(toFieldErrors(result.error), { cause: result.error }));
}

export async function parseAsync<TSchema extends z.ZodType>(
 schema: TSchema,
 input: unknown,
): Promise<Result<z.output<TSchema>, AppError>> {
 const result = await schema.safeParseAsync(input);
 return result.success
 ? ok(result.data)
 : err(validationError(toFieldErrors(result.error), { cause: result.error }));
}

/**
 * Parse a `FormData` submission.
 *
 * `Object.fromEntries` loses repeated keys — a multi-select or a checkbox group collapses to
 * its last value, silently. Repeated keys are collected into arrays here so that never
 * happens, and `File` entries pass through untouched for `uploadFileSchema`.
 */
export function parseFormData<TSchema extends z.ZodType>(
 schema: TSchema,
 formData: FormData,
): Result<z.output<TSchema>, AppError> {
 return parse(schema, formDataToObject(formData));
}

export function formDataToObject(formData: FormData): Record<string, unknown> {
 const output: Record<string, unknown> = {};

 for (const [key, value] of formData.entries()) {
 const existing = output[key];
 if (existing === undefined) {
 output[key] = value;
 } else if (Array.isArray(existing)) {
 existing.push(value);
 } else {
 output[key] = [existing, value];
 }
 }

 return output;
}

/**
 * Parse `searchParams`.
 *
 * In Next 16 `searchParams` is a Promise that resolves to
 * `Record<string, string | string[] | undefined>` — await it before calling this. Schemas
 * for URL state should use `.catch()` on every field so a malformed URL degrades to a
 * default instead of erroring; see `paginationSchema`.
 */
export function parseSearchParams<TSchema extends z.ZodType>(
 schema: TSchema,
 searchParams: Record<string, string | string[] | undefined>,
): z.output<TSchema> {
 return schema.parse(searchParams) as z.output<TSchema>;
}

/**
 * Validate data crossing a trust boundary — an upstream response, a webhook, a cache read.
 *
 * Distinct from user-input parsing on purpose: a failure here is not the user's fault and is
 * not a form error. It means a contract was broken, which is a `UPSTREAM_CONTRACT_VIOLATION`
 * worth reporting, not a red label under a text input.
 */
export function parseContract<TSchema extends z.ZodType>(
 schema: TSchema,
 input: unknown,
 source: string,
): Result<z.output<TSchema>, AppError> {
 const result = schema.safeParse(input);
 if (result.success) return ok(result.data);

 return err(
 new AppError('UPSTREAM_CONTRACT_VIOLATION', {
 message: `Contract violation from "${source}"`,
 cause: result.error,
 context: { source, issues: toFieldErrors(result.error) },
 }),
 );
}
