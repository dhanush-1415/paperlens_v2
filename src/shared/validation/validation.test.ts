import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { isErr, isOk } from '@/core/result/result';

import { INPUT_LIMITS } from '../constants/limits';
import { formDataToObject, parse, parseAsync, parseContract, parseFormData } from './parse';
import {
  acceptedSchema,
  checkboxSchema,
  documentTextSchema,
  emailSchema,
  optionalTextSchema,
  paginationSchema,
  passwordSchema,
  phoneSchema,
  searchQuerySchema,
  slugSchema,
  sortOrderSchema,
  textSchema,
  urlSchema,
  uuidSchema,
} from './primitives';

/**
 * Validation.
 *
 * Two properties are being pinned. First, that every primitive's failure message is a
 * **message key** rather than an English sentence — that is what makes the product
 * translatable, and it is trivially broken by one `z.string().email()` written inline.
 * Second, that parsing yields a `Result` rather than throwing, because a `ZodError` is the
 * wrong currency for the data path.
 */

function messagesFor(schema: z.ZodType, input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('every message is a key', () => {
  it.each([
    ['uuid', uuidSchema, 'nope'],
    ['email', emailSchema, 'nope'],
    ['slug', slugSchema, 'Not A Slug'],
    ['phone', phoneSchema, '555'],
    ['url', urlSchema, 'nope'],
    ['password', passwordSchema, 'short'],
    ['document', documentTextSchema, 'too short'],
  ])('%s', (_name, schema, invalid) => {
    const messages = messagesFor(schema, invalid);

    expect(messages.length).toBeGreaterThan(0);
    // Dotted, lowercase-initial, no spaces. An English sentence here would render
    // untranslated in every locale and would not be caught by any type.
    for (const message of messages) {
      expect(message, message).toMatch(/^validation\.[a-zA-Z.]+$/);
    }
  });
});

describe('scalars', () => {
  it('normalizes an email rather than merely accepting it', () => {
    // Trimmed and lowercased at the schema, so no call site has to remember — and so two
    // sign-ups differing only in case cannot become two accounts.
    expect(emailSchema.parse('  Ada@Example.COM ')).toBe('ada@example.com');
  });

  it('rejects an email past the RFC 5321 maximum', () => {
    expect(messagesFor(emailSchema, `${'a'.repeat(250)}@example.com`)).toContain(
      'validation.email.tooLong',
    );
  });

  it('accepts a well-formed uuid and slug', () => {
    expect(isOk(parse(uuidSchema, '3f2504e0-4f89-41d3-9a0c-0305e82c3301'))).toBe(true);
    expect(slugSchema.parse('a-valid-slug-123')).toBe('a-valid-slug-123');
  });

  it('requires a real scheme on a URL, not merely a parseable one', () => {
    // `z.url()` accepts `ftp://` and, in some versions, `javascript:`. The refinement is the
    // point: a URL that is valid is not the same as a URL that is safe to put in an href.
    expect(messagesFor(urlSchema, 'ftp://example.com')).toContain('validation.url.protocol');
    expect(isOk(parse(urlSchema, 'https://example.com'))).toBe(true);
  });

  it('reports one message per unmet password rule', () => {
    // A single "password is invalid" leaves the user guessing which rule they missed.
    const messages = messagesFor(passwordSchema, 'alllowercaseletters');

    expect(messages).toContain('validation.password.uppercase');
    expect(messages).toContain('validation.password.digit');
    expect(messages).not.toContain('validation.password.lowercase');
  });

  it('accepts a password that meets every rule', () => {
    expect(isOk(parse(passwordSchema, 'CorrectHorse42Battery'))).toBe(true);
  });

  it('accepts E.164 phone numbers only', () => {
    expect(isOk(parse(phoneSchema, '+14155552671'))).toBe(true);
    expect(isErr(parse(phoneSchema, '(415) 555-2671'))).toBe(true);
  });
});

describe('text', () => {
  it('trims before measuring, so whitespace is not content', () => {
    expect(messagesFor(textSchema({ max: 10 }), '     ')).toContain('validation.required');
  });

  it('distinguishes "required" from "too short"', () => {
    // A field with a real minimum needs a message that states one; reusing `required` there
    // tells the user to fill in a field they already filled in.
    expect(messagesFor(textSchema({ max: 100, min: 5 }), 'abc')).toContain('validation.tooShort');
  });

  it('normalizes optional empty text to undefined, never to an empty string', () => {
    // `''` and `undefined` reaching the same column is how a "cleared" field ends up stored
    // as an empty string in one code path and null in another.
    expect(optionalTextSchema(50).parse('   ')).toBeUndefined();
    expect(optionalTextSchema(50).parse('hi')).toBe('hi');
    expect(messagesFor(optionalTextSchema(3), 'far too long')).toContain('validation.tooLong');
  });

  it('bounds document text at both ends using the shared limits', () => {
    const short = 'x'.repeat(INPUT_LIMITS.minDocumentChars - 1);
    const long = 'x'.repeat(INPUT_LIMITS.maxDocumentChars + 1);

    expect(messagesFor(documentTextSchema, short)).toContain('validation.document.tooShort');
    expect(messagesFor(documentTextSchema, long)).toContain('validation.document.tooLong');
    expect(isOk(parse(documentTextSchema, 'x'.repeat(INPUT_LIMITS.minDocumentChars)))).toBe(true);
  });

  it('caps a search query', () => {
    expect(
      messagesFor(searchQuerySchema, 'x'.repeat(INPUT_LIMITS.maxSearchQueryLength + 1)),
    ).toContain('validation.tooLong');
  });
});

describe('URL state', () => {
  it('coerces string search params to numbers', () => {
    expect(paginationSchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('falls back to defaults for a hand-edited URL instead of erroring', () => {
    // The one place in the codebase where swallowing a validation failure is right: the
    // input is a URL a stranger can type, and a 500 is a worse answer than page one.
    expect(paginationSchema.parse({ page: 'banana', pageSize: '-4' })).toEqual({
      page: 1,
      pageSize: 20,
    });
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(sortOrderSchema.parse('sideways')).toBe('desc');
    expect(sortOrderSchema.parse('asc')).toBe('asc');
  });
});

describe('form helpers', () => {
  it('reads an HTML checkbox in all the shapes a browser sends', () => {
    // A checkbox submits `"on"` when ticked and *nothing at all* when not — the absent case
    // is the one that gets missed, and it is the one that means "false".
    expect(checkboxSchema.parse('on')).toBe(true);
    expect(checkboxSchema.parse('true')).toBe(true);
    expect(checkboxSchema.parse(true)).toBe(true);
    expect(checkboxSchema.parse(undefined)).toBe(false);
  });

  it('requires acceptance to be affirmative', () => {
    expect(acceptedSchema.parse('on')).toBe(true);
    expect(messagesFor(acceptedSchema, undefined)).toContain('validation.mustAccept');
  });
});

describe('parse → Result', () => {
  const schema = z.object({ email: emailSchema });

  it('returns ok with the parsed output', () => {
    const result = parse(schema, { email: 'ADA@example.com' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value.email).toBe('ada@example.com');
  });

  it('returns err with field errors keyed by dotted path', () => {
    const nested = z.object({ user: z.object({ email: emailSchema }) });
    const result = parse(nested, { user: { email: 'nope' } });

    expect(isErr(result)).toBe(true);
    // Flattening once, here, is what stops two forms disagreeing about whether the key is
    // `user.email` or `email`.
    if (isErr(result)) expect(Object.keys(result.error.fieldErrors ?? {})).toContain('user.email');
  });

  it('does not throw on invalid input', () => {
    expect(() => parse(schema, { email: 'nope' })).not.toThrow();
  });

  it('has an async form for schemas with async refinements', async () => {
    const asyncSchema = z.string().refine(async (value) => value.length > 2);

    expect(isOk(await parseAsync(asyncSchema, 'abc'))).toBe(true);
    expect(isErr(await parseAsync(asyncSchema, 'a'))).toBe(true);
  });
});

describe('FormData', () => {
  it('collects repeated keys into an array', () => {
    // `Object.fromEntries` keeps only the last value, so a multi-select silently collapses
    // to one option — a data-loss bug that no type catches.
    const formData = new FormData();
    formData.append('tag', 'a');
    formData.append('tag', 'b');
    formData.append('tag', 'c');
    formData.append('name', 'solo');

    expect(formDataToObject(formData)).toEqual({ tag: ['a', 'b', 'c'], name: 'solo' });
  });

  it('parses a submission through a schema', () => {
    const formData = new FormData();
    formData.set('email', ' Ada@Example.com ');

    const result = parseFormData(z.object({ email: emailSchema }), formData);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value.email).toBe('ada@example.com');
  });

  it('yields field errors from a submission', () => {
    const formData = new FormData();
    formData.set('email', 'nope');

    const result = parseFormData(z.object({ email: emailSchema }), formData);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.fieldErrors?.['email']?.[0]).toContain('validation.');
  });
});

describe('parseContract', () => {
  const schema = z.object({ id: z.string() });

  it('passes valid upstream data through', () => {
    expect(isOk(parseContract(schema, { id: 'x' }, 'analysis-api'))).toBe(true);
  });

  it('reports a broken contract as an upstream fault, not a form error', () => {
    // A malformed upstream response is not the user's mistake and must not render as a red
    // label under a text input. Different fault, different code, different destination.
    const result = parseContract(schema, { id: 42 }, 'analysis-api');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('UPSTREAM_CONTRACT_VIOLATION');
      expect(result.error.context?.['source']).toBe('analysis-api');
    }
  });
});
