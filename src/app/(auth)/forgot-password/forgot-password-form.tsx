'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailOpen } from 'lucide-react';

import { type SerializedAppError } from '@/core/errors/app-error';
import { type Result } from '@/core/result/result';
import { forgotPasswordAction } from '@/server/actions/auth';
import { Alert, Button, Field, Input, Text } from '@/shared/ui';
import { ROUTES } from '@/shared/constants/routes';

type FormState = Result<{ success: boolean }, SerializedAppError> | null;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    forgotPasswordAction,
    null,
  );
  const [email, setEmail] = useState('');

  const error = state !== null && !state.ok ? state.error : null;
  const success = state !== null && state.ok ? state.value.success : false;

  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-strong/50 bg-surface-2 shadow-inner">
          <MailOpen className="h-8 w-8 text-brand-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Check your inbox
          </h1>
          <p className="text-sm leading-relaxed font-medium text-text-secondary">
            We sent a secure reset link to{' '}
            <span className="font-bold text-text-primary">{email}</span>. It expires in 1 hour.
          </p>
        </div>

        <p className="mt-2 text-xs font-medium text-text-tertiary">
          Didn&apos;t receive it? Check your spam folder.
        </p>

        <Link href={(ROUTES as any).login} className="mt-4 w-full">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            startIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      {error ? (
        <Alert tone="critical" title="Reset failed">
          <Text size="sm">{error.messageKey}</Text>
        </Alert>
      ) : null}

      <Field label="Email address" required>
        {(field) => (
          <Input
            {...field}
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            placeholder="name@company.com"
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-border-strong/50 bg-surface-2/50 px-4 py-2.5 transition-all placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
          />
        )}
      </Field>

      <Button
        variant="premium"
        size="lg"
        fullWidth
        type="submit"
        loading={isPending}
        disabled={!email.trim() || isPending}
        className="mt-2"
      >
        Send reset link
      </Button>

      <div className="pt-2">
        <Link
          href={(ROUTES as any).login}
          className="flex items-center justify-center gap-2 text-sm font-bold text-text-secondary transition-colors duration-300 hover:-translate-x-1 hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
