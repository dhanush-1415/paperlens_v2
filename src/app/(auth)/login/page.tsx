import type { Metadata } from 'next';
import { Suspense } from 'react';

import { isDevelopment } from '@/config';
import { DEMO_USERS } from '@/core/auth';
import { QUERY_PARAMS, sanitizeRedirectTo } from '@/shared/constants/query-params';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/shared/constants/routes';
import { Alert, Card, CardContent, Container, Heading, Section, Text } from '@/shared/ui';

import { SignInForm } from './sign-in-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

/**
 * `/login`.
 *
 * It exists primarily so the proxy's protected-route redirect lands somewhere real: a
 * redirect target that 404s turns "you need to sign in" into "the site is broken", and that
 * failure only appears when someone hits a protected route signed out — which is exactly the
 * path nobody tests by hand.
 *
 * The form is backed by `InMemoryAuthProvider`, and the page says so on screen in development
 * rather than only in a comment. A demo credential printed in a UI is a promise that this is
 * not a real authentication system; a demo credential hidden in a source file is how one ends
 * up in production.
 */

async function SignIn({ searchParams }: { readonly searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const raw = params[QUERY_PARAMS.redirectTo];

  /**
   * Sanitised here *and* again in the action. Twice, on purpose: this call decides what the
   * hidden field contains, and the action's call decides what is actually navigated to. Only
   * the second one is load-bearing — the first is so a tampered URL never even reaches the
   * markup.
   */
  const redirectTo = sanitizeRedirectTo(
    typeof raw === 'string' ? raw : undefined,
    DEFAULT_AUTHENTICATED_ROUTE,
  );

  return <SignInForm redirectTo={redirectTo} />;
}

export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <Container>
      <Section spacing="xl" className="flex flex-col items-center">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Heading level={1} size="lg">
              Sign in
            </Heading>
            <Text tone="secondary">Your documents stay yours. We never sell or train on them.</Text>
          </div>

          {/*
           * `searchParams` is request data, so it needs a boundary under `cacheComponents`.
           * The heading above it is part of the static shell.
           */}
          <Suspense fallback={<Card><CardContent>Loading…</CardContent></Card>}>
            <SignIn searchParams={props.searchParams} />
          </Suspense>

          {isDevelopment ? (
            <Alert tone="info" title="Development build — fake authentication">
              <Text size="sm">
                Sessions come from <code className="font-mono">InMemoryAuthProvider</code> and die
                with the server process. Sign in as{' '}
                <code className="font-mono">{DEMO_USERS[0]?.email}</code> with{' '}
                <code className="font-mono">{DEMO_USERS[0]?.password}</code>.
              </Text>
            </Alert>
          ) : null}
        </div>
      </Section>
    </Container>
  );
}
