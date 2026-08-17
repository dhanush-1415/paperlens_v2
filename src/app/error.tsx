'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { devConfig } from '@/config';
import { ERROR_REPORTER } from '@/core/container';
import { useOptionalContainer } from '@/core/container/context';
import { isAppError, normalizeError } from '@/core/errors';
import { ROUTES } from '@/shared/constants';

export default function SegmentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const container = useOptionalContainer();

  useEffect(() => {
    container?.resolve(ERROR_REPORTER).report(error, {
      boundary: 'segment',
      digest: error.digest,
      route: typeof window === 'undefined' ? undefined : window.location.pathname,
    });
  }, [container, error]);

  const appError = normalizeError(error);
  const correlationId = appError.correlationId ?? error.digest;

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] w-full items-center justify-center overflow-hidden bg-canvas py-12 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--risk-critical-rgb),0.03),transparent_70%)]" />
      <div className="pointer-events-none absolute top-1/4 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-risk-critical/10 blur-[100px]" />

      <main className="relative z-10 mx-auto flex w-[95%] max-w-2xl flex-col items-center md:w-[90%] lg:w-[80%]">
        <div className="relative flex w-full flex-col items-center gap-8 overflow-hidden rounded-3xl border border-border-strong/50 bg-surface-1/60 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-risk-critical/40 to-transparent opacity-50" />

          <div className="flex size-16 items-center justify-center rounded-2xl border border-risk-critical/30 bg-gradient-to-br from-risk-critical/20 to-risk-critical/5 text-risk-critical shadow-[0_0_20px_-5px_rgba(var(--risk-critical-rgb),0.2)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary md:text-3xl">
              Something went wrong on our end
            </h1>
            <p className="mx-auto max-w-lg text-base leading-relaxed font-medium text-text-secondary">
              {appError.retryable
                ? 'This looks temporary. Trying again will usually work.'
                : 'We have been notified and are looking into it. Your documents are safe.'}
            </p>
          </div>

          {correlationId && (
            <div className="rounded-xl border border-border-strong/50 bg-surface-raised px-4 py-2 text-xs text-text-tertiary">
              Error ID: {correlationId}
            </div>
          )}

          <div className="mt-2 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <button
              onClick={unstable_retry}
              className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-bold text-canvas shadow-[0_0_20px_-5px_rgba(var(--brand-primary-rgb),0.5)] transition-all hover:scale-[1.02] hover:bg-brand-primary-hover"
            >
              Try again
            </button>
            <Link
              href={ROUTES.home}
              className="bg-surface-3 inline-flex items-center justify-center rounded-xl border border-border-strong px-6 py-3 text-sm font-bold text-text-primary transition-all hover:bg-surface-raised"
            >
              Go home
            </Link>
          </div>
        </div>

        {devConfig.showTechnicalErrors && (
          <div className="mt-8 max-w-full overflow-auto rounded-xl border border-risk-critical/20 bg-risk-critical/5 p-4">
            <p className="text-xs break-words text-risk-critical">
              {isAppError(error) ? `${error.code}: ${error.message}` : error.message}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
