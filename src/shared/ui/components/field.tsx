/**
 * Field — label + control + description + error, wired correctly, once.
 *
 * Getting a form field accessible takes six things that must all agree: a `for`/`id` pair, an
 * `aria-describedby` listing *both* the description and the error, `aria-invalid` matching
 * whether an error is actually shown, `role="alert"` on the error so it is announced when it
 * appears, and a `required` attribute that matches the visual marker. Hand-written per field,
 * some subset is always wrong — usually `aria-describedby`, which people set to the error and
 * silently drop the description.
 *
 * This component owns all six. Every form control in the product is wrapped in it.
 *
 * ### Why a render prop rather than context
 *
 * Context would require `'use client'`, which would drag every server-rendered form into the
 * client bundle for nothing. `useId` is available in Server Components in React 19, so the
 * whole thing composes on the server as long as the wiring is passed explicitly:
 *
 * ```tsx
 * <Field label="Work email" description="We never share it." error={state.errors?.email?.[0]} required>
 * {(field) => <Input {...field} name="email" type="email" autoComplete="email" />}
 * </Field>
 * ```
 *
 * The spread is not optional. A control that ignores `field` renders an unlabelled input, and
 * that is caught the first time anyone runs `getByLabelText` against it.
 */

import { useId, type ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { Label } from './label';

/** Exactly what a control must spread onto itself. */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  required: boolean | undefined;
}

export interface FieldProps {
  /** Visible label text. Never omit it — a placeholder is not a label. */
  label: ReactNode;
  /** Static helper text. Shown whether or not there is an error. */
  description?: ReactNode;
  /**
   * The error message, or `undefined` when valid.
   *
   * Typically `state.errors?.fieldName?.[0]` from a `useActionState` result — see
   * `shared/validation`, which maps a zod `flatten()` into exactly that shape.
   */
  error?: string;
  required?: boolean;
  className?: string;
  children: (field: FieldControlProps) => ReactNode;
}

export function Field({
  label,
  description,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  /**
   * Both ids, in visual order, filtered for what is actually rendered.
   *
   * Order matters: assistive technology reads `aria-describedby` in the order given, so the
   * description ("we never share it") is announced before the error ("invalid address"),
   * which is the order they appear on screen.
   */
  const describedBy =
    [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required: required || undefined,
      })}

      {description ? (
        <p id={descriptionId} className="text-2xs text-text-tertiary">
          {description}
        </p>
      ) : null}

      {error ? (
        /**
         * `role="alert"` rather than `aria-live="polite"`: a validation failure is the direct
         * result of the user's own submit, so interrupting is correct — waiting for a pause
         * means they have already moved focus somewhere else by the time it is read.
         */
        <p id={errorId} role="alert" className="text-2xs font-medium text-risk-critical-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
