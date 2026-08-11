import { Suspense } from 'react';

import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';
import { TRANSLATOR } from '@/core/container';
import { signOutFormAction } from '@/server/actions/auth';
import { getPublicSession, getRequestScope } from '@/server/bootstrap';
import { ROUTES } from '@/shared/constants/routes';
import { Button, Container, Skeleton, Text, ThemeToggle, AppSidebar, AppTopBar, AppBreadcrumbs } from '@/shared/ui';

import Link from 'next/link';

/**
 * The signed-in shell.
 *
 * A route group — `(app)` — so it wraps `/scan` and `/document/[id]` without adding a URL
 * segment. Marketing and legal pages get their own groups and their own chrome; sharing one
 * layout across both is how a product ends up with a "dashboard" header on its pricing page.
 *
 * ### Why the session read is inside `<Suspense>`
 *
 * `cacheComponents` is on. Reading the session touches `cookies()`, which is request data, and
 * anything that reads request data must be wrapped in a Suspense boundary or the whole route
 * refuses to prerender. The boundary is drawn around the identity chip alone, so everything
 * else in this header — the wordmark, the theme toggle, the nav — is part of the static shell
 * that ships from the edge before the server has looked at a cookie.
 *
 * That is the actual mechanism behind partial prerendering: not "some pages are static", but
 * "the dynamic part of every page is exactly as small as its Suspense boundary".
 *
 * ### Why there is no authorization here
 *
 * A layout is not a security boundary. It does not re-render on client navigation, and Next's
 * own documentation is explicit that a check in a layout does not protect the pages below it.
 * Each page verifies for itself through the DAL, and each Server Action verifies again. The
 * header reads the session only to decide what to draw.
 */

const tenant = resolveTenant(serverEnv.TENANT_ID);

async function SessionChip() {
 const session = await getPublicSession();

 if (!session) {
 return (
 <Button asChild size="sm" variant="ghost">
 <Link href={ROUTES.login}>Sign in</Link>
 </Button>
 );
 }

 return (
 <form action={signOutFormAction} className="flex items-center gap-3">
 {/*
 * The plan, not the email. A header is the most-screenshotted surface in any product,
 * and `PublicSession` deliberately carries no address for it to leak — see
 * `toPublicSession`, which is the only sanctioned way a session reaches a client.
 */}
 <Text as="span" size="xs" tone="tertiary" className="hidden sm:inline">
 {session.plan}
 </Text>
 <Button type="submit" size="sm" variant="ghost">
 Sign out
 </Button>
 </form>
 );
}

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const t = getRequestScope().resolve(TRANSLATOR);
  const session = await getPublicSession();

  // If no session, they shouldn't be in (app), but gracefully handle it.
  // We can pass default role/plan.
  const role = session?.role || 'user';
  const plan = session?.plan || 'free';

  const themeLabels = {
    label: t.t('theme.label'),
    light: t.t('theme.light'),
    dark: t.t('theme.dark'),
    system: t.t('theme.system'),
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar
        role={role as any}
        plan={plan as any}
        productName={tenant.productName}
        signOutAction={signOutFormAction}
      />
      <div className="flex w-full flex-1 flex-col min-w-0">
        <AppTopBar
          themeLabels={themeLabels}
          sessionChip={<SessionChip />}
        />
        <main className="flex-1 relative">
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
            <AppBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
