import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/config/env.server';
import { getServerContainer } from '@/server/bootstrap';
import { SESSION_STORE } from '@/core/container';
import { LIFETIME_SECONDS } from '@/shared/constants/time';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/shared/constants/routes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? DEFAULT_AUTHENTICATED_ROUTE;
  const baseUrl = serverEnv.APP_URL;

  if (code) {
    const supabaseUrl = serverEnv.SUPABASE_URL;
    const supabaseKey = serverEnv.SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        // Successfully exchanged code for session token.
        // Now securely store it in the paperlens custom SessionStore.
        const container = getServerContainer();
        const store = container.resolve(SESSION_STORE);
        await store.write(data.session.access_token, LIFETIME_SECONDS.session);
      }
    }
  }

  return NextResponse.redirect(`${baseUrl}${next}`);
}
