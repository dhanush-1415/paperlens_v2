import { createClient } from '@supabase/supabase-js';

import { AppError, unauthenticatedError } from '../errors/app-error';
import { err, ok, type Result } from '../result/result';
import { LIFETIME_SECONDS } from '@/shared/constants/time';

import type {
  AuthProvider,
  Credentials,
  Session,
  SessionStore,
  SignUpInput,
} from './types';

export interface SupabaseAuthOptions {
  supabaseUrl: string;
  supabaseKey: string;
  store: SessionStore;
  now: () => Date;
}

export function createSupabaseAuthProvider(options: SupabaseAuthOptions): AuthProvider {
  const { supabaseUrl, supabaseKey, store, now } = options;
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  function mapUserToSession(user: any): Session {
    return {
      userId: user.id,
      role: user.user_metadata?.role || 'user',
      plan: user.user_metadata?.plan || 'free',
      emailVerified: user.email_confirmed_at != null,
      sessionId: user.id,
      expiresAt: new Date(now().getTime() + LIFETIME_SECONDS.session * 1_000).toISOString(),
    };
  }

  return {
    name: 'supabase',

    async getSession(): Promise<Result<Session | null, AppError>> {
      const token = await store.read();
      if (!token) return ok(null);

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        return ok(null); 
      }

      return ok(mapUserToSession(data.user));
    },

    async signIn(credentials: Credentials): Promise<Result<Session, AppError>> {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.session) {
        return err(new AppError('INVALID_CREDENTIALS', { message: error?.message || 'Sign in failed' }));
      }

      const session = mapUserToSession(data.user);
      await store.write(data.session.access_token, LIFETIME_SECONDS.session);
      return ok(session);
    },

    async signUp(input: SignUpInput): Promise<Result<Session, AppError>> {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            display_name: input.displayName,
          }
        }
      });

      if (error) {
        return err(new AppError('INTERNAL_ERROR', { message: error.message }));
      }

      if (!data.user) {
        return err(new AppError('INTERNAL_ERROR', { message: 'Signup failed to return user' }));
      }

      const session = mapUserToSession(data.user);
      
      if (data.session) {
        await store.write(data.session.access_token, LIFETIME_SECONDS.session);
      }
      
      return ok(session);
    },

    async signOut(): Promise<Result<void, AppError>> {
      const token = await store.read();
      if (token) {
        const { error } = await supabase.auth.admin.signOut(token).catch(() => ({ error: null }));
        // Ignore errors, we still want to clear the local store
      }
      await store.clear();
      return ok(undefined);
    },

    async refresh(): Promise<Result<Session, AppError>> {
      const sessionResult = await this.getSession();
      if (!sessionResult.ok || !sessionResult.value) {
        return err(unauthenticatedError('No session to refresh'));
      }
      
      const token = await store.read();
      if (token) {
        await store.write(token, LIFETIME_SECONDS.session);
      }
      return ok(sessionResult.value);
    },

    async requestPasswordReset(email: string): Promise<Result<void, AppError>> {
      await supabase.auth.resetPasswordForEmail(email);
      return ok(undefined);
    },

    async confirmPasswordReset(): Promise<Result<void, AppError>> {
      return err(new AppError('NOT_IMPLEMENTED', { message: 'Not implemented in this adapter' }));
    },

    async verifyEmail(token: string): Promise<Result<void, AppError>> {
      return err(new AppError('NOT_IMPLEMENTED', { message: 'Use verifyOtp instead' }));
    },

    async verifyOtp(email: string, token: string): Promise<Result<Session, AppError>> {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
      if (error || !data.session) {
        return err(new AppError('INVALID_CREDENTIALS', { message: error?.message || 'Invalid or expired code.' }));
      }
      
      const session = mapUserToSession(data.user);
      await store.write(data.session.access_token, LIFETIME_SECONDS.session);
      return ok(session);
    },

    async resendOtp(email: string): Promise<Result<void, AppError>> {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        return err(new AppError('INTERNAL_ERROR', { message: error.message }));
      }
      return ok(undefined);
    }
  };
}
