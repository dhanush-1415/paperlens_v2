import { TRANSLATOR } from '@/core/container';
import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';
import { getRequestScope } from '@/server/bootstrap';
import { CookieConsent } from '@/shared/ui';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { AuthAnimation } from './auth-animation';
import { PaperLensLogo } from '@/shared/ui/paperlens-logo';

const tenant = resolveTenant(serverEnv.TENANT_ID);

export default async function AuthLayout({ children }: LayoutProps<'/'>) {
  const scope = getRequestScope();
  const t = scope.resolve(TRANSLATOR);

  return (
    <AuthAnimation>
      <div className="flex w-full bg-canvas">
      {/* Left Pane - Brand / Imagery (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-brand-primary relative overflow-hidden flex-col justify-center gap-24 p-12 lg:p-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 auth-text-stagger">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <PaperLensLogo size="xl" showText={false} />
            <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">{tenant.productName}</span>
          </Link>
        </div>

        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] auth-text-stagger">
            Turn complex documents into clear answers.
          </h2>
          <p className="text-lg text-white/80 leading-relaxed font-medium auth-text-stagger">
            Join thousands of professionals securely analyzing contracts, compliance reports, and legal documents in seconds.
          </p>
          
          <div className="flex items-center gap-4 mt-8 auth-text-stagger">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-primary bg-white/20 backdrop-blur-sm overflow-hidden flex items-center justify-center text-xs font-bold shadow-sm">
                  User
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-1 text-amber-300">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <span className="text-xs font-medium text-white/70">Trusted by enterprise teams</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Form Content */}
      <main id="main" className="flex-1 flex flex-col justify-center items-center relative p-6 md:p-12 lg:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--brand-primary-rgb),0.05),transparent_60%)] pointer-events-none lg:hidden" />
        
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 flex lg:hidden z-20">
          <Link href="/" className="flex items-center gap-3">
            <PaperLensLogo size="sm" showText={true} />
          </Link>
        </div>

        <div className="auth-box w-full max-w-[440px] relative z-10 bg-surface-1 border border-border-strong rounded-3xl p-8 md:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
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
