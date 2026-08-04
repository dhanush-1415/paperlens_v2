'use client';

import { useActionState } from 'react';

import { type SerializedAppError } from '@/core/errors/app-error';
import { type Result } from '@/core/result/result';
import { signInAction } from '@/server/actions/auth';
import { Alert, Button, Field, Input, Text } from '@/shared/ui';

/**
 * The sign-in form.
 *
 * ### Why this component lives under `app/` and not in a feature
 *
 * `app/` is routing only — but "routing only" bans *business logic and data access*, not a
 * route-private view. This component holds neither: it renders inputs and posts them to a
 * Server Action. There is no `features/auth/`, and there should not be: every other feature
 * would import it, which is precisely the sibling coupling the module rule forbids.
 * Authentication is a capability of the platform (`core/auth`), wired at the composition root
 * (`server/actions/auth.ts`), and this is its one screen.
 *
 * The test for whether a component may be co-located in `app/`: would a second route ever
 * render it? If yes, it belongs in `shared/ui` or a feature. This one would not.
 */

type FormState = Result<never, SerializedAppError> | null;

export interface SignInFormProps {
  /**
   * Where to land after signing in. Comes from the proxy's `?redirectTo=`, sanitised again on
   * the server before it is used — a hidden field is user input, and the fact that we put it
   * there ourselves is not something the server can verify.
   */
  readonly redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(signInAction, null);

  const error = state !== null && !state.ok ? state.error : null;
  const fieldError = (name: string) => error?.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      {/*
       * Only non-field errors surface here. `INVALID_CREDENTIALS` has no `fieldErrors`, so it
       * renders as one message for the form as a whole — which is also the correct security
       * behaviour: pinning "wrong password" to the password input tells an attacker the email
       * was right.
       */}
      {error && !error.fieldErrors ? (
        <Alert tone="critical" title="Could not sign you in">
          <Text size="sm">{error.messageKey}</Text>
        </Alert>
      ) : null}

      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      <Field label="Email" error={fieldError('email')} required>
        {(field) => (
          <Input
            {...field}
            name="email"
            type="email"
            autoComplete="email"
            /*
             * `autoFocus` on a page whose only purpose is this form. The usual objection —
             * that it steals focus from the content — does not apply when the form *is* the
             * content.
             */
            autoFocus
          />
        )}
      </Field>

      <Field label="Password" error={fieldError('password')} required>
        {(field) => (
          <Input {...field} name="password" type="password" autoComplete="current-password" />
        )}
      </Field>

      <Button type="submit" size="lg" loading={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
