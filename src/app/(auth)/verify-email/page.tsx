import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';

import { Card, CardContent } from '@/shared/ui';
import { ROUTES } from '@/shared/constants/routes';

import { VerifyEmailForm } from './verify-email-form';

export const metadata: Metadata = {
  title: 'Verify Email',
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email : '';

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-strong/50 bg-surface-2 shadow-inner">
            <svg className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
              Verify your email
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed font-medium">
              We sent a 6-digit code to{' '}
              {email ? (
                <span className="font-bold text-text-primary">{email}</span>
              ) : (
                'your email address'
              )}.
            </p>
          </div>
        </div>

        <Suspense fallback={<Card><CardContent>Loading…</CardContent></Card>}>
          <VerifyEmailForm />
        </Suspense>

        <div className="mt-2">
          <Link 
            href={(ROUTES as any).login}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold text-text-tertiary hover:text-text-primary transition-colors hover:-translate-x-1 duration-300 w-full"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
