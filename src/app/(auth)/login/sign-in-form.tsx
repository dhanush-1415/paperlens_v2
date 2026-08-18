'use client';

import { useActionState, useState } from 'react';

import { type SerializedAppError } from '@/core/errors/app-error';
import { type Result } from '@/core/result/result';
import { signInAction } from '@/server/actions/auth';
import { createBrowserSupabaseClient } from '@/shared/contexts/auth-context';
import { Alert, Button, Field, Input, Text } from '@/shared/ui';

type FormState = Result<never, SerializedAppError> | null;

export interface SignInFormProps {
  readonly redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(signInAction, null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    const supabase = createBrowserSupabaseClient();
    const callbackUrl = new URL(`${window.location.origin}/api/auth/callback`);
    if (redirectTo) callbackUrl.searchParams.set('next', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    });

    if (error) {
      alert(error.message);
      setIsGoogleLoading(false);
    }
  }

  const error = state !== null && !state.ok ? state.error : null;
  const fieldError = (name: string) => error?.fieldErrors?.[name]?.[0];

  return (
    <div className="flex w-full flex-col gap-5">
      <form action={formAction} className="flex w-full flex-col gap-5">
        {error && !error.fieldErrors ? (
          <Alert tone="critical" title="Could not sign you in">
            <Text size="sm">{error.messageKey}</Text>
          </Alert>
        ) : null}

        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

        <div className="flex flex-col gap-4">
          <Field label="Email" error={fieldError('email')} required>
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

          <Field label="Password" error={fieldError('password')} required>
            {(field) => (
              <Input
                {...field}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-border-strong/50 bg-surface-2/50 px-4 py-2.5 transition-all placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rounded-md p-1 text-text-tertiary transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        className="size-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="size-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                }
              />
            )}
          </Field>
        </div>

        <Button
          variant="premium"
          size="lg"
          fullWidth
          type="submit"
          loading={isPending}
          className="mt-2"
        >
          Sign in
        </Button>
      </form>

      <div className="my-2 flex items-center gap-4">
        <div className="h-px flex-1 bg-border-strong"></div>
        <span className="text-xs font-medium text-text-tertiary">OR</span>
        <div className="h-px flex-1 bg-border-strong"></div>
      </div>

      <div className="w-full">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          className="rounded-full"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isPending || isGoogleLoading}
          loading={isGoogleLoading}
          startIcon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              aria-hidden="true"
              focusable="false"
              className="shrink-0"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
          }
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
