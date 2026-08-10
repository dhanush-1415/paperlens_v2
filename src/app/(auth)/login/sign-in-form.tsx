'use client';

import { useActionState } from 'react';

import { type SerializedAppError } from '@/core/errors/app-error';
import { type Result } from '@/core/result/result';
import { signInAction } from '@/server/actions/auth';
import { Alert, Button, Field, Input, Text } from '@/shared/ui';

type FormState = Result<never, SerializedAppError> | null;

export interface SignInFormProps {
 readonly redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
 const [state, formAction, isPending] = useActionState<FormState, FormData>(signInAction, null);

 const error = state !== null && !state.ok ? state.error : null;
 const fieldError = (name: string) => error?.fieldErrors?.[name]?.[0];

 return (
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
 className="bg-surface-2/50 border-border-strong/50 focus:border-brand-primary focus:ring-brand-primary/20 transition-all rounded-xl py-2.5 px-4"
 />
 )}
 </Field>

 <Field label="Password" error={fieldError('password')} required>
 {(field) => (
 <Input 
 {...field} 
 name="password" 
 type="password" 
 autoComplete="current-password"
 className="bg-surface-2/50 border-border-strong/50 focus:border-brand-primary focus:ring-brand-primary/20 transition-all rounded-xl py-2.5 px-4"
 />
 )}
 </Field>
 </div>

 <button 
 type="submit" 
 disabled={isPending}
 className="mt-2 w-full flex items-center justify-center rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-canvas shadow-[0_0_20px_-5px_rgba(var(--brand-primary-rgb),0.5)] transition-all hover:bg-brand-primary-hover hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
 >
 {isPending ? (
 <span className="flex items-center gap-2">
 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-canvas" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 Signing in…
 </span>
 ) : 'Sign in'}
 </button>
 </form>
 );
}
