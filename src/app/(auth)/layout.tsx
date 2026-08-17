import { TRANSLATOR } from '@/core/container';
import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';
import { getRequestScope } from '@/server/bootstrap';
import { CookieConsent, SiteHeader } from '@/shared/ui';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { AuthAnimation } from './auth-animation';
import { PaperLensLogo } from '@/shared/ui/paperlens-logo';
import { siteNavItems } from '@/features/marketing';
import { getPublicSession } from '@/server/bootstrap';
import { Suspense } from 'react';
import { connection } from 'next/server';

const tenant = resolveTenant(serverEnv.TENANT_ID);

async function AuthDynamicShell({ children, t }: { children: React.ReactNode; t: any }) {
  await connection();
  const session = await getPublicSession();

  return (
    <AuthAnimation>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <SiteHeader
          productName={tenant.productName}
          items={siteNavItems(t)}
          signInHref={ROUTES.login}
          ctaHref={ROUTES.scan}
          dashboardHref={ROUTES.welcome}
          isAuthenticated={!!session}
          forceSolid={true}
          labels={{
            menu: t.t('nav.menu'),
            closeMenu: t.t('nav.closeMenu'),
            signIn: t.t('common.signIn'),
            cta: t.t('cta.analyze'),
            ctaNote: t.t('cta.reassurance'),
            theme: t.t('theme.label'),
            themeOptions: {
              light: t.t('theme.light'),
              dark: t.t('theme.dark'),
              system: t.t('theme.system'),
            },
          }}
        />
      </div>
      <div className="flex min-h-screen w-full bg-canvas">
        {/* Left Pane - Brand / Imagery (Hidden on Mobile) */}
        <div className="relative hidden w-1/2 flex-col justify-center gap-24 overflow-hidden bg-brand-primary p-12 text-white lg:flex lg:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-white/5 blur-[100px]" />

          <div className="auth-text-stagger relative z-10">
            <Link href="/" className="group flex w-fit items-center gap-3">
              <PaperLensLogo size="xl" showText={false} />
              <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                {tenant.productName}
              </span>
            </Link>
          </div>

          <div className="relative z-10 flex max-w-lg flex-col gap-6">
            <h2 className="auth-text-stagger text-4xl leading-[1.1] font-extrabold tracking-tight md:text-5xl">
              Turn complex documents into clear answers.
            </h2>
            <p className="auth-text-stagger text-lg leading-relaxed font-medium text-white/80">
              Join thousands of professionals securely analyzing contracts, compliance reports, and
              legal documents in seconds.
            </p>

            <div className="auth-text-stagger mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-brand-primary bg-white/20 text-xs font-bold shadow-sm backdrop-blur-sm"
                  >
                    User
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex gap-1 text-amber-300">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs font-medium text-white/70">
                  Trusted by enterprise teams
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane - Form Content */}
        <main
          id="main"
          className="relative flex flex-1 flex-col items-center justify-center p-6 pt-24 md:p-12 lg:p-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--brand-primary-rgb),0.05),transparent_60%)] lg:hidden" />

          <div className="auth-box relative z-10 w-full max-w-[440px] rounded-3xl border border-border-strong bg-surface-1 p-8 shadow-none sm:shadow-[0_8px_40px_rgb(0,0,0,0.08)] md:p-10 sm:dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
            {children}
          </div>
        </main>

        <CookieConsent
          policyHref={ROUTES.cookies as any}
          labels={{
            title: t.t('consent.title'),
            body: t.t('consent.body'),
            accept: t.t('consent.acceptAll'),
            reject: t.t('consent.rejectAll'),
            policyLink: t.t('footer.cookies'),
          }}
        />
      </div>
    </AuthAnimation>
  );
}

export default async function AuthLayout({ children }: any) {
  const scope = getRequestScope();
  const t = scope.resolve(TRANSLATOR);

  return (
    <Suspense fallback={null}>
      <AuthDynamicShell t={t}>{children}</AuthDynamicShell>
    </Suspense>
  );
}
