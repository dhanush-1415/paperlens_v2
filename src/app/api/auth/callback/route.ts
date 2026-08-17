import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/config/env.server';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/shared/constants/routes';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  // Only allow relative paths for `next` to prevent open-redirect attacks.
  const redirectTo = next && next.startsWith('/') ? next : DEFAULT_AUTHENTICATED_ROUTE;

  if (code) {
    // Build the response object first so we can write cookies directly onto it.
    const response = NextResponse.redirect(`${origin}${redirectTo}`);

    const supabaseUrl = serverEnv.SUPABASE_URL;
    const supabaseKey = serverEnv.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return response;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
