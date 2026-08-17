'use client';

import { useActionState, useId, useState } from 'react';

import { type SerializedAppError } from '@/core/errors/app-error';
import { type Result } from '@/core/result/result';
import { INPUT_LIMITS } from '@/shared/constants/limits';
import { interpolate } from '@/shared/utils/string';
import { Alert, Button, Field, Input, Select, Text, TONE_TEXT, Textarea } from '@/shared/ui';

import { DOCUMENT_TYPE_LABEL } from '../constants';
import { DOCUMENT_TYPES, type DocumentType } from '../domain';
import { ANALYZE_FIELDS } from '../validation';
import { analyzeDocumentAction } from './actions';

/**
 * The paste box.
 *
 * ### Why this is one of very few Client Components in the feature
 *
 * It needs three things the server cannot give it: a pending state while the action runs, a
 * live character count, and focus management on error. Everything else on the page — the
 * report, the score, the flag text — is rendered on the server and ships as markup. The
 * boundary is drawn as tightly as it can be, because every component inside it is JavaScript
 * a user downloads before they can do anything.
 *
 * ### `useActionState`, not `useState` + `fetch`
 *
 * The form works before hydration. React wires an un-hydrated `<form action={…}>` to a real
 * POST, so a user on a slow connection who types and submits during the JavaScript download
 * still gets their analysis — they just do not see the spinner. Hand-rolling the submit with
 * `onSubmit` + `fetch` would break that, silently, for exactly the users who need it most.
 *
 * ### Why the labels are props
 *
 * Resolved by the `Translator` on the server and passed down (requirement 29). Importing the
 * dictionary here would ship every string in it to the browser and give this component a
 * locale opinion it has no business having. The prop makes it translation-agnostic: it
 * renders what it is handed.
 *
 * Every label is a **string**, including the one with numbers in it. A `(count, max) => string`
 * formatter would be the obvious shape and is not serializable — React rejects it with
 * "Functions cannot be passed directly to Client Components", and it is right to: a function
 * prop would mean the formatting lives on the server while the number it formats only exists
 * in the browser. `{count}` / `{max}` placeholders are the same syntax the dictionary uses, so
 * a translator can move the number to wherever the sentence needs it.
 */

export interface AnalysisFormLabels {
  readonly documentLabel: string;
  readonly documentDescription: string;
  readonly documentPlaceholder: string;
  readonly typeLabel: string;
  readonly titleLabel: string;
  readonly titleDescription: string;
  readonly titlePlaceholder: string;
  readonly submit: string;
  readonly submitting: string;
  readonly errorTitle: string;
  /**
   * A template, not a formatted string and not a formatter. Understands `{count}` and `{max}`,
   * so word order and separator are the translator's decision rather than this file's.
   */
  readonly counter: string;
}

export interface AnalysisFormProps {
  readonly labels: AnalysisFormLabels;
  readonly defaultDocumentType?: DocumentType;
}

/**
 * The action never resolves to a value on success — it redirects. So the only state this form
 * ever holds is a failure, and `null` for "not submitted yet".
 */
type FormState = Result<never, SerializedAppError> | null;

function fieldError(state: FormState, field: string): string | undefined {
  if (state === null || state.ok) return undefined;
  return state.error.fieldErrors?.[field]?.[0];
}

export function AnalysisForm({ labels, defaultDocumentType = 'other' }: AnalysisFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    analyzeDocumentAction,
    null,
  );

  const [charCount, setCharCount] = useState(0);
  const counterId = useId();

  /**
   * A non-field error — rate limited, upstream down, unauthenticated. Field errors already
   * render against their inputs; showing them twice would be noise, so this is only for the
   * failures that belong to the submission as a whole.
   */
  const generalError =
    state !== null && !state.ok && state.error.fieldErrors === undefined ? state.error : null;

  const overLimit = charCount > INPUT_LIMITS.maxDocumentChars;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {generalError ? (
        <Alert tone="critical" title={labels.errorTitle}>
          <Text size="sm">{generalError.messageKey}</Text>
          {/*
           * The correlation id, shown deliberately. It is the only thing that connects what
           * the user saw to the line in the server log that explains it — without it a support
           * conversation is "it broke yesterday, around lunchtime". It identifies a request,
           * not a person, so there is nothing to leak.
           */}
          {generalError.correlationId ? (
            <Text size="xs" tone="tertiary" className="mt-2">
              {generalError.correlationId}
            </Text>
          ) : null}
        </Alert>
      ) : null}

      <Field
        label={labels.documentLabel}
        description={labels.documentDescription}
        error={fieldError(state, ANALYZE_FIELDS.text)}
        required
      >
        {(field) => (
          <Textarea
            {...field}
            name={ANALYZE_FIELDS.text}
            variant="document"
            rows={14}
            placeholder={labels.documentPlaceholder}
            /*
             * `maxLength` is not set. Truncating a pasted contract at 200,000 characters
             * without saying so would silently analyse a partial document and report it as
             * complete — a wrong answer presented confidently. The counter warns instead, and
             * the server rejects.
             */
            aria-describedby={[field['aria-describedby'], counterId].filter(Boolean).join(' ')}
            onChange={(event) => setCharCount(event.currentTarget.value.length)}
          />
        )}
      </Field>

      {/*
       * `aria-live="polite"` rather than `assertive`: a character counter that interrupts a
       * screen reader on every keystroke is unusable. Polite queues the announcement until
       * the user pauses, which is when the number is worth hearing.
       */}
      <Text
        id={counterId}
        as="span"
        size="xs"
        tone="tertiary"
        className={overLimit ? TONE_TEXT.critical : undefined}
        aria-live="polite"
      >
        {interpolate(labels.counter, {
          count: charCount.toLocaleString(),
          max: INPUT_LIMITS.maxDocumentChars.toLocaleString(),
        })}
      </Text>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={labels.typeLabel} error={fieldError(state, ANALYZE_FIELDS.documentType)}>
          {(field) => (
            <Select
              {...field}
              name={ANALYZE_FIELDS.documentType}
              defaultValue={defaultDocumentType}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_LABEL[type]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label={labels.titleLabel}
          description={labels.titleDescription}
          error={fieldError(state, ANALYZE_FIELDS.title)}
        >
          {(field) => (
            <Input {...field} name={ANALYZE_FIELDS.title} placeholder={labels.titlePlaceholder} />
          )}
        </Field>
      </div>

      <div>
        <Button type="submit" size="lg" loading={isPending} disabled={overLimit}>
          {isPending ? labels.submitting : labels.submit}
        </Button>
      </div>
    </form>
  );
}
