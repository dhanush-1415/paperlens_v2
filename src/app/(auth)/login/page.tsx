import type { Metadata } from 'next';
import { Suspense } from 'react';

import { QUERY_PARAMS, sanitizeRedirectTo } from '@/shared/constants/query-params';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/shared/constants/routes';
import { Card, CardContent } from '@/shared/ui';

import { SignInForm } from './sign-in-form';
import { ROUTES } from '@/shared/constants/routes';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

async function SignIn({
  searchParams,
}: {
  readonly searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params[QUERY_PARAMS.redirectTo];

  const redirectTo = sanitizeRedirectTo(
    typeof raw === 'string' ? raw : undefined,
    DEFAULT_AUTHENTICATED_ROUTE,
  );

  return <SignInForm redirectTo={redirectTo} />;
}

export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Welcome back</h1>
          <p className="text-sm leading-relaxed font-medium text-text-secondary">
            Sign in to continue to PaperLens.
          </p>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent>Loading…</CardContent>
            </Card>
          }
        >
          <SignIn searchParams={props.searchParams} />
        </Suspense>

        <p className="mt-2 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link
            href={(ROUTES as any).signup}
            className="font-bold text-brand-primary transition-all hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
