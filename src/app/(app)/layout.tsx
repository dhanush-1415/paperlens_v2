import { Suspense } from 'react';

import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';
import { TRANSLATOR } from '@/core/container';
import { signOutFormAction } from '@/server/actions/auth';
import { getPublicSession, getRequestScope } from '@/server/bootstrap';
import { ROUTES } from '@/shared/constants/routes';
import { Button, Container, Skeleton, Text, ThemeToggle, AppSidebar, AppTopBar, AppBreadcrumbs, ProfileDropdown } from '@/shared/ui';

import Link from 'next/link';
import { AuthProvider } from '@/shared/contexts/auth-context';

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

async function SessionChip({ session }: { session: any }) {
  if (!session) {
    return (
      <Button asChild size="sm" variant="ghost">
        <Link href={ROUTES.login}>Sign in</Link>
      </Button>
    );
  }

  const { serverEnv } = await import('@/config/env.server');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(serverEnv.SUPABASE_URL as string, serverEnv.SUPABASE_SERVICE_ROLE_KEY as string);
  
  const { data: { user } } = await supabase.auth.admin.getUserById(session.userId);
  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <ProfileDropdown
      userName={userName}
      userEmail={user?.email || 'user@example.com'}
      userInitials={userInitials}
      signOutAction={signOutFormAction}
    />
  );
}

function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="w-64 border-r border-border-subtle bg-surface-1" />
      <div className="flex w-full flex-1 flex-col min-w-0">
        <div className="h-16 border-b border-border-subtle bg-surface-1" />
        <main className="flex-1 relative" />
      </div>
    </div>
  );
}

async function DynamicShell({ children, themeLabels }: { children: React.ReactNode, themeLabels: any }) {
  const session = await getPublicSession();
  const role = session?.role || 'user';
  const plan = session?.plan || 'free';

  // Fetch real scans used
  let scansUsed = 0;
  if (session?.userId) {
    const { connection } = await import('next/server');
    await connection();
    const { getUserPlan } = await import('@/server/dal/plan');
    const { subscription } = await getUserPlan();
    scansUsed = subscription.scansUsed;
  }

  return (
    <AuthProvider initialUser={session}>
      <div className="flex min-h-screen bg-canvas">
        <AppSidebar
          role={role as any}
          plan={plan as any}
          scansUsed={scansUsed}
          productName={tenant.productName}
          signOutAction={signOutFormAction}
        />
        <div className="flex w-full flex-1 flex-col min-w-0">
          <AppTopBar
            themeLabels={themeLabels}
            sessionChip={<SessionChip session={session} />}
          />
          <main className="flex-1 relative">
            <div className="p-4 sm:p-6 lg:p-8 w-full">
              <AppBreadcrumbs />
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default function AppLayout({ children }: LayoutProps<'/'>) {
  const t = getRequestScope().resolve(TRANSLATOR);
  
  const themeLabels = {
    label: t.t('theme.label'),
    light: t.t('theme.light'),
    dark: t.t('theme.dark'),
    system: t.t('theme.system'),
  };

  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <DynamicShell themeLabels={themeLabels}>
        {children}
      </DynamicShell>
    </Suspense>
  );
}
