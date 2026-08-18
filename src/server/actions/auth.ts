'use server';

import { redirect } from 'next/navigation';

import { ANALYTICS, AUTH_PROVIDER, CLOCK, RATE_LIMITER } from '@/core/container';
import { AppError, rateLimitError } from '@/core/errors/app-error';
import { serverEnv } from '@/config/env.server';
import { unwrapOrThrow } from '@/core/result/result';
import { sanitizeRedirectTo } from '@/shared/constants/query-params';
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  DEFAULT_UNAUTHENTICATED_ROUTE,
} from '@/shared/constants/routes';
import { emailSchema, parseFormData } from '@/shared/validation';
import { z } from 'zod';

import { action, getServerContainer } from '../bootstrap';

/**
 * Session lifecycle actions (requirement 3).
 *
 * ### Why these live in `server/actions/` and not in a feature
 *
 * Authentication is not a feature — it is a precondition of most of them. A
 * `features/auth/` module would be imported by every other feature, which is exactly the
 * coupling the feature-module rule exists to prevent (siblings never import siblings). The
 * capability lives in `core/auth` as a port, the wiring lives in the container, and the two
 * request-shaped entry points live here, at the composition root, where anything may reach
 * them without creating an edge between features.
 *
 * ### What is deliberately not here
 *
 * Registration, password reset and email verification. The in-memory provider returns
 * `NOT_IMPLEMENTED` for the last two by design — they need a real provider to send a real
 * email, and a fake that pretends to would be worse than an honest error. When a provider is
 * bound, they are added here and no caller changes.
 */

const SIGN_IN_SCOPE = 'auth.login';

const signInSchema = z.object({
  email: emailSchema,
  /**
   * Presence only — deliberately **not** `passwordSchema`.
   *
   * The strength rules belong on registration, where they shape a password being created.
   * Applying them at sign-in does two harmful things: it tells an attacker the policy before
   * they have an account, and it rejects a password that predates the current rules with
   * "must contain an uppercase letter" instead of letting the provider answer. A sign-in form
   * has exactly one verdict to give, and the provider gives it.
   */
  password: z.string().min(1, { message: 'validation.required' }),
  /**
   * Carried through the form as a hidden field rather than read from `searchParams`.
   *
   * A Server Action has no URL of its own — it is a POST to whatever page invoked it, and
   * `useSearchParams` is a client hook. Putting the value in the form is the only way it
   * survives the round trip, and it is sanitised on the way out regardless, because a hidden
   * field is user input like any other.
   */
  redirectTo: z.string().optional(),
});

export const signInAction = action(
  'auth.signIn',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const container = getServerContainer();

    /**
     * Rate limiting first, and keyed on the submitted email rather than the user id — there
     * is no user id yet, and that is the point: this is the limit that turns credential
     * stuffing from cheap into pointless. Ten attempts per five minutes per address, from
     * `RATE_LIMITS['auth.login']`.
     *
     * A real deployment adds an IP-keyed limit alongside this one, because an attacker
     * spraying one password across ten thousand addresses never trips a per-address counter.
     * That needs a distributed limiter and a trustworthy client IP, both of which are
     * infrastructure this scaffold does not assume — noted here rather than silently missing.
     */
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();

    const decision = await container.resolve(RATE_LIMITER).consume(SIGN_IN_SCOPE, email);

    if (!decision.allowed) {
      const nowMs = container.resolve(CLOCK)().getTime();
      throw rateLimitError(
        Math.max(1, Math.ceil((decision.resetAt - nowMs) / 1_000)),
        SIGN_IN_SCOPE,
      );
    }

    const input = unwrapOrThrow(parseFormData(signInSchema, formData));

    /**
     * `signIn` returns `err(INVALID_CREDENTIALS)` for both "no such account" and "wrong
     * password" — one message, so the form cannot be used to enumerate who has an account.
     *
     * The `Result` is inspected rather than unwrapped straight away, because a failed sign-in
     * is a *measured* outcome: `signin.failed` is how a spike in credential stuffing becomes
     * visible on a dashboard instead of only in a log file. Note the payload carries a coarse
     * reason and nothing else — no email, no attempted password, no IP. An analytics pipeline
     * is the last place a credential should be able to appear.
     */
    const attempt = await container.resolve(AUTH_PROVIDER).signIn(input);

    if (!attempt.ok) {
      container.resolve(ANALYTICS).track('signin.failed', { reason: 'credentials' });
      throw attempt.error;
    }

    /**
     * No `userId` in the payload. `signin.completed` answers "how many sign-ins today", and
     * attaching an identifier to it turns an aggregate into a behavioural record of one
     * person — see the consent gate in `core/analytics`.
     */
    container.resolve(ANALYTICS).track('signin.completed', { method: 'email' });

    /**
     * `sanitizeRedirectTo` accepts only same-origin absolute paths. Without it, the hidden
     * field is an open redirect: the victim signs in on the real domain and is handed to the
     * attacker's, having just proved to themselves that the site is genuine.
     */
    redirect(sanitizeRedirectTo(input.redirectTo, DEFAULT_AUTHENTICATED_ROUTE));
  },
);

const SIGN_UP_SCOPE = 'auth.register';

const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, { message: 'validation.minLength' }),
  displayName: z.string().optional(),
  redirectTo: z.string().optional(),
  acceptedTerms: z.literal('on', {
    errorMap: () => ({ message: 'You must accept the Terms and Privacy Policy to continue.' }),
  } as any),
});

export const signUpAction = action(
  'auth.signUp',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const container = getServerContainer();

    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const decision = await container.resolve(RATE_LIMITER).consume(SIGN_UP_SCOPE, email);

    if (!decision.allowed) {
      const nowMs = container.resolve(CLOCK)().getTime();
      throw rateLimitError(
        Math.max(1, Math.ceil((decision.resetAt - nowMs) / 1_000)),
        SIGN_UP_SCOPE,
      );
    }

    const input = unwrapOrThrow(parseFormData(signUpSchema, formData));

    const attempt = await container.resolve(AUTH_PROVIDER).signUp({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      acceptedTerms: true,
    });

    if (!attempt.ok) {
      container.resolve(ANALYTICS).track('signup.failed', { reason: 'credentials' });
      throw attempt.error;
    }

    container.resolve(ANALYTICS).track('signup.completed', { method: 'email' });
    redirect(`/verify-email?email=${encodeURIComponent(input.email)}`);
  },
);

export const verifyOtpAction = action(
  'auth.verifyOtp',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const email = String(formData.get('email') ?? '').trim();
    const token = String(formData.get('token') ?? '').trim();

    if (!email || !token) {
      throw new AppError('VALIDATION_FAILED', {
        message: 'Email and verification code are required',
      });
    }

    const container = getServerContainer();
    const attempt = await container.resolve(AUTH_PROVIDER).verifyOtp(email, token);

    if (!attempt.ok) {
      throw attempt.error;
    }

    redirect(DEFAULT_AUTHENTICATED_ROUTE);
  },
);

export const resendOtpAction = action(
  'auth.resendOtp',
  async (_previous: unknown, formData: FormData): Promise<{ success: boolean }> => {
    const email = String(formData.get('email') ?? '').trim();

    if (!email) {
      throw new AppError('VALIDATION_FAILED', { message: 'Email address is required' });
    }

    const container = getServerContainer();
    const attempt = await container.resolve(AUTH_PROVIDER).resendOtp(email);

    if (!attempt.ok) {
      throw attempt.error;
    }

    return { success: true };
  },
);

export const signInWithGoogleAction = action(
  'auth.google',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const next = sanitizeRedirectTo(
      formData.get('redirectTo') as string | undefined,
      DEFAULT_AUTHENTICATED_ROUTE,
    );

    const supabaseUrl = serverEnv.SUPABASE_URL;
    const supabaseKey = serverEnv.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new AppError('INTERNAL_ERROR', { message: 'Supabase credentials missing for OAuth.' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${serverEnv.APP_URL}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error || !data.url) {
      throw new AppError('INTERNAL_ERROR', {
        message: error?.message || 'Failed to initialize Google auth',
      });
    }

    redirect(data.url);
  },
);

export async function signInWithGoogleFormAction(formData: FormData): Promise<void> {
  await signInWithGoogleAction(null, formData);
}

const RESET_SCOPE = 'auth.passwordReset';

export const forgotPasswordAction = action(
  'auth.passwordReset',
  async (_previous: unknown, formData: FormData): Promise<{ success: boolean }> => {
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();

    if (!email) {
      throw new AppError('VALIDATION_FAILED', { message: 'Email address is required' });
    }

    const container = getServerContainer();
    const decision = await container.resolve(RATE_LIMITER).consume(RESET_SCOPE, email);

    if (!decision.allowed) {
      const nowMs = container.resolve(CLOCK)().getTime();
      throw rateLimitError(Math.max(1, Math.ceil((decision.resetAt - nowMs) / 1_000)), RESET_SCOPE);
    }

    const attempt = await container.resolve(AUTH_PROVIDER).requestPasswordReset(email);

    if (!attempt.ok) {
      // Intentionally swallow "user not found" errors in production to prevent email enumeration,
      // but log or handle internal errors
      if (attempt.error.code !== 'INVALID_CREDENTIALS' && attempt.error.code !== 'NOT_FOUND') {
        throw attempt.error;
      }
    }

    return { success: true };
  },
);

export async function checkEmailAvailabilityAction(email: string): Promise<{ available: boolean }> {
  if (!email) return { available: true };

  const supabaseUrl = serverEnv.SUPABASE_URL;
  const serviceKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return { available: true };

  try {
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&per_page=10`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: 'no-store',
      },
    );

    if (!res.ok) return { available: true };

    const { users = [] } = (await res.json()) as { users?: { email: string }[] };

    const taken = users.some((u) => u.email?.toLowerCase() === email.toLowerCase());
    return { available: !taken };
  } catch {
    return { available: true };
  }
}

export const signOutAction = action('auth.signOut', async (): Promise<never> => {
  const container = getServerContainer();

  /**
   * Sign-out is best-effort by design: the `Result` is discarded rather than thrown.
   *
   * If the provider fails to revoke server-side, the user still wants the cookie gone and the
   * navigation to happen — showing them an error page while they remain signed in on a shared
   * machine is the worst possible outcome. The failure is still logged by the provider; what
   * it must not do is block the exit.
   */
  await container.resolve(AUTH_PROVIDER).signOut();

  /*
   * No analytics event. `AnalyticsEventMap` has no sign-out, and the fix for that is to add
   * one to the registry after deciding what question it answers — not to invent a name here.
   * The registry being the only place event names exist is what stops the same event being
   * fired under three spellings.
   */

  redirect(DEFAULT_UNAUTHENTICATED_ROUTE);
});

/**
 * `<form action={…}>` adapter for sign-out.
 *
 * React types a form action as `(formData: FormData) => void | Promise<void>`, and everything
 * `action()` produces returns `ActionResult<T>` — that is the whole point of the wrapper, and
 * it is why the two do not meet without an adapter.
 *
 * A non-JS form post has nowhere to put a returned value anyway: the response *is* the
 * redirect. So this discards the result rather than pretending to handle it. The failure path
 * is still covered — `withActionErrors` has already logged and reported by the time the value
 * gets here — and the redirect propagates because it is a thrown control-flow signal, not a
 * return value.
 *
 * A form that needs to *render* its failure uses `useActionState` and gets the `ActionResult`
 * directly; see `sign-in-form.tsx`. This adapter exists only for the fire-and-navigate case.
 */
export async function signOutFormAction(): Promise<void> {
  await signOutAction();
}

/*
 * Nothing else is exported from this file, and that is a constraint rather than a preference.
 *
 * Every export from a `'use server'` module becomes a callable POST endpoint with a stable
 * id, reachable by anyone who can read the client bundle. A helper that only builds a URL
 * would become an RPC call for no reason — so URL construction stays in `shared/constants/
 * routes.ts` and pages compose it themselves.
 */
