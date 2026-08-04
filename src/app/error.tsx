'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { devConfig } from '@/config';
import { ERROR_REPORTER } from '@/core/container';
import { useOptionalContainer } from '@/core/container/context';
import { isAppError, normalizeError } from '@/core/errors';
import { ROUTES } from '@/shared/constants';
import { Button, Container, ErrorState, Text } from '@/shared/ui';

/**
 * The segment error boundary (requirements 4, 5).
 *
 * Catches anything thrown while rendering a page, a nested layout, `loading.tsx` or
 * `not-found.tsx` **below this segment**. It does not catch errors in the layout of its own
 * segment — that is what `global-error.tsx` is for — and it does not catch errors in event
 * handlers or in `setTimeout` callbacks, because React does not route those through error
 * boundaries at all. Those reach `instrumentation-client.ts` instead.
 *
 * ### `unstable_retry` and not `reset`
 *
 * `reset()` re-renders the boundary's children with the state it already has, which for a
 * Server Component means rendering the same failed payload again. `unstable_retry()` (Next
 * 16.2) asks the server for a fresh render, which is what a user pressing "Try again"
 * actually means. `reset` still exists for the narrow case of clearing client state without
 * re-fetching; this is not that case.
 *
 * ### Why the message is a key, not a string
 *
 * A caught error may have come from anywhere, including a database driver. Rendering
 * `error.message` would put upstream internals — table names, query fragments, occasionally
 * a connection string — on a user's screen. `AppError` carries a `messageKey` chosen by the
 * code that raised it, and the raw message is shown only when `devConfig` says we are in
 * development.
 */
export default function SegmentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  /**
   * Reporting is opt-in on the container being present, not required.
   *
   * If the thing that failed *was* the composition root, a boundary that resolved from it
   * would throw while handling an error — turning a recoverable page into `global-error`.
   * Degrading to "no report" is strictly better than that: the server already reported this
   * error through `onRequestError` if it originated there.
   */
  const container = useOptionalContainer();

  useEffect(() => {
    container?.resolve(ERROR_REPORTER).report(error, {
      boundary: 'segment',
      digest: error.digest,
      route: typeof window === 'undefined' ? undefined : window.location.pathname,
    });
  }, [container, error]);

  const appError = normalizeError(error);

  return (
    <Container as="main" className="flex flex-1 flex-col justify-center py-24">
      <ErrorState
        title="Something went wrong on our end"
        description={
          appError.retryable
            ? 'This looks temporary. Trying again will usually work.'
            : 'We have been notified and are looking into it. Your documents are safe.'
        }
        /**
         * The correlation ID is the entire point of showing an error page rather than a
         * blank one: a user can quote it to support, and it resolves to the exact log line
         * and the exact report. `digest` is React's own hash of the server-side error and is
         * the fallback when the failure never reached our own error type.
         */
        correlationId={appError.correlationId ?? error.digest}
        action={
          <>
            <Button onClick={unstable_retry}>Try again</Button>
            <Button variant="secondary" asChild>
              <Link href={ROUTES.home}>Go home</Link>
            </Button>
          </>
        }
      />

      {/*
       * The engineer-facing message, in development only. `devConfig.showTechnicalErrors`
       * is a compile-time constant in a production build, so this branch and the string
       * inside it are removed by dead-code elimination rather than merely hidden.
       */}
      {devConfig.showTechnicalErrors && (
        <Text
          size="sm"
          tone="tertiary"
          className="mx-auto mt-6 max-w-measure text-center font-mono"
        >
          {isAppError(error) ? `${error.code}: ${error.message}` : error.message}
        </Text>
      )}
    </Container>
  );
}
