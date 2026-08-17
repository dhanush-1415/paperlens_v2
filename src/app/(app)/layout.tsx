import { Suspense } from 'react';

import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';
import { TRANSLATOR } from '@/core/container';
import { signOutFormAction } from '@/server/actions/auth';
import { getPublicSession, getRequestScope } from '@/server/bootstrap';
import { ROUTES } from '@/shared/constants/routes';
import {
  Button,
  Container,
  Skeleton,
  Text,
  ThemeToggle,
  AppSidebar,
  AppTopBar,
  AppBreadcrumbs,
  ProfileDropdown,
} from '@/shared/ui';

import Link from 'next/link';
import { AuthProvider } from '@/shared/contexts/auth-context';
import { VaultChat } from '@/features/vault';

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
  const supabase = createClient(
    serverEnv.SUPABASE_URL as string,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const {
    data: { user },
  } = await supabase.auth.admin.getUserById(session.userId);
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
      <div className="flex w-full min-w-0 flex-1 flex-col">
        <div className="h-16 border-b border-border-subtle bg-surface-1" />
        <main className="relative flex-1" />
      </div>
    </div>
  );
}

async function DynamicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const t = getRequestScope().resolve(TRANSLATOR);
  const themeLabels = {
    label: t.t('theme.label'),
    light: t.t('theme.light'),
    dark: t.t('theme.dark'),
    system: t.t('theme.system'),
  };

  const session = await getPublicSession();
  const role = session?.role || 'user';
  const plan = session?.plan || 'free';

  // Fetch real scans used
  let scansUsed = 0;
  let scansLimit = 0;
  if (session?.userId) {
    try {
      const { connection } = await import('next/server');
      await connection();
      const { getUserPlan } = await import('@/server/dal/plan');
      const { subscription, plan: dbPlan } = await getUserPlan();
      scansUsed = subscription.scansUsed;
      scansLimit = dbPlan.quotaScansPerMonth;
    } catch (e) {
      // Ignored for unauthenticated or DB issues
    }
  }

  const isLimitReached = scansLimit > 0 && scansUsed >= scansLimit;

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
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <AppTopBar themeLabels={themeLabels} sessionChip={<SessionChip session={session} />} />
          {isLimitReached && (
            <div className="sticky top-16 z-30 flex flex-row items-center justify-between gap-3 bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-600 px-3 py-2.5 shadow-[0_4px_20px_-5px_rgba(225,29,72,0.5)] sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden size-10 shrink-0 animate-pulse items-center justify-center rounded-full bg-white text-rose-600 shadow-[0_0_15px_rgba(255,255,255,0.4)] sm:flex">
                  <span className="text-xl font-black">!</span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <Text
                    size="sm"
                    className="leading-tight font-extrabold tracking-tight text-white uppercase sm:truncate sm:text-base"
                  >
                    Workspace Scan Limit Exceeded
                  </Text>
                  <Text
                    size="xs"
                    className="mt-0.5 hidden font-bold text-white/90 drop-shadow-sm sm:block"
                  >
                    Your {plan} tier has reached its maximum capacity. Upgrade to unlock unmetered
                    multi-page analysis.
                  </Text>
                  <Text size="2xs" className="mt-0.5 truncate font-medium text-white/90 sm:hidden">
                    Upgrade to continue
                  </Text>
                </div>
              </div>
              <Button
                asChild
                variant="primary"
                size="sm"
                className="group h-8 shrink-0 rounded-full bg-white px-3 text-[11px] font-bold tracking-wide text-rose-600 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:bg-surface-1 sm:h-12 sm:rounded-control sm:px-6 sm:text-[15px] sm:font-black"
              >
                <Link href={ROUTES.billing}>
                  UPGRADE{' '}
                  <span className="ml-2 hidden transition-transform group-hover:translate-x-1 sm:inline">
                    →
                  </span>
                </Link>
              </Button>
            </div>
          )}
          <main className="relative flex-1">
            <div className="w-full p-4 sm:p-6 lg:p-8">
              <AppBreadcrumbs />
              {children}
            </div>
          </main>
          <VaultChat />
        </div>
      </div>
    </AuthProvider>
  );
}

import { connection } from 'next/server';

export default async function AppLayout({ children }: any) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <DynamicShell>{children}</DynamicShell>
    </Suspense>
  );
}
