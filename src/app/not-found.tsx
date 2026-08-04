import type { Metadata } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants';
import { Button, Container, EmptyState, SearchIcon } from '@/shared/ui';

/**
 * 404 — the page for a URL that does not resolve.
 *
 * Reached two ways: any unmatched URL in the application, and an explicit `notFound()` call
 * from a Server Component that looked something up and found nothing. The second is by far
 * the more common in practice — a document ID that was deleted, a share link that expired.
 *
 * ### Where this sits in the tree
 *
 * Between `loading.tsx` and `page.tsx`: it renders inside the `<Suspense>` boundary that
 * `loading.tsx` creates and inside the error boundary that `error.tsx` creates for the same
 * segment. So a throw *while rendering this page* is still caught, which is why it is safe
 * for it to use the design system.
 *
 * ### The status code
 *
 * 404 for a normal response; **200 for a streamed one**, because the headers are already on
 * the wire by the time `notFound()` is called. That is a framework property, not a bug, and
 * it is why route-level correctness for crawlers depends on the page resolving its data
 * before it starts streaming rather than on this file.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Container as="main" className="flex flex-1 flex-col justify-center py-24">
      <EmptyState
        icon={<SearchIcon className="size-5" />}
        title="We couldn't find that page"
        description="The link may be out of date, or the document it pointed to may have been deleted. Nothing in your vault has changed."
        action={
          <Button asChild>
            <Link href={ROUTES.home}>Back to home</Link>
          </Button>
        }
      />
    </Container>
  );
}
