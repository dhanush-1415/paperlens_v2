import type { Metadata } from 'next';
import { Suspense } from 'react';

import { QUERY_PARAMS, sanitizeRedirectTo } from '@/shared/constants/query-params';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/shared/constants/routes';
import { Card, CardContent, Container } from '@/shared/ui';

import { SignUpForm } from './sign-up-form';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = {
  title: 'Create Account',
  robots: { index: false, follow: false },
};

async function SignUp({
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

  return <SignUpForm redirectTo={redirectTo} />;
}

export default function SignUpPage(props: PageProps<'/signup'>) {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Create Account
          </h1>
          <p className="text-sm leading-relaxed font-medium text-text-secondary">
            Start analyzing documents securely in seconds.
          </p>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent>Loading…</CardContent>
            </Card>
          }
        >
          <SignUp searchParams={props.searchParams} />
        </Suspense>

        <p className="mt-2 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link
            href={(ROUTES as any).login}
            className="font-bold text-brand-primary transition-all hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
