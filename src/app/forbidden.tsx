import type { Metadata } from 'next';
import Link from 'next/link';

import { appConfig } from '@/config';
import { ROUTES } from '@/shared/constants';
import { AlertTriangleIcon, Button, Container, StatusBlock, Text } from '@/shared/ui';

/**
 * 403 — signed in, but not permitted (requirement 3).
 *
 * Thrown by `requirePermission()` in `core/auth/dal.ts` when the session is valid and the
 * RBAC matrix in `core/auth/policy.ts` says no.
 *
 * ### The distinction this page depends on
 *
 * A permission can fail for two different reasons, and conflating them is how a paywall
 * ends up filed as a bug:
 *
 * · **The role does not allow it** — a member trying to delete an organisation. That is a
 *   genuine 403 and this is the page for it.
 * · **The plan does not include it** — a free user opening a Pro feature. That is not an
 *   error; it is the product working. `requirePermission` detects it via `planWouldAllow()`
 *   and redirects to pricing instead of rendering this.
 *
 * So by the time a user reaches this page, upgrading will not help them, and the copy says
 * so rather than offering a plan they do not need.
 *
 * Like `unauthorized.tsx`, this file receives **no props**.
 */
export const metadata: Metadata = {
  title: 'Access denied',
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  return (
    <Container as="main" className="flex flex-1 flex-col justify-center py-24">
      {/* `neutral` for the same reason as `unauthorized.tsx`: the risk palette belongs to the
          user's document, not to our access control. */}
      <StatusBlock
        tone="neutral"
        icon={<AlertTriangleIcon className="size-5" />}
        title="You don't have access to this"
        description="Your account is signed in, but this action needs a permission your role doesn't include. An administrator on your team can grant it."
        actions={
          <Button variant="secondary" asChild>
            <Link href={ROUTES.home}>Back to home</Link>
          </Button>
        }
        footer={
          <Text size="sm" tone="tertiary">
            Believe this is a mistake?{' '}
            {/* A `mailto:` is an external scheme, so it is a plain anchor — `next/link` is
                for in-app navigation and `typedRoutes` would reject this href. */}
            <a className="underline underline-offset-4" href={`mailto:${appConfig.support.email}`}>
              {appConfig.support.email}
            </a>
          </Text>
        }
      />
    </Container>
  );
}
