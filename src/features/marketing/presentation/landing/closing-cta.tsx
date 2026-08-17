import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { ScrollReveal } from '@/shared/ui';

export interface LandingClosingCtaProps {
  ctaLabel: string;
  reassurance: string;
}

export function LandingClosingCta({ ctaLabel, reassurance }: LandingClosingCtaProps) {
  return (
    <section className="force-dark relative w-full overflow-hidden bg-canvas py-24">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(var(--brand-primary-rgb),0.05)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto w-[95%] px-6 md:w-[90%] lg:w-[80%]">
        <div className="group relative flex flex-col items-center gap-10 overflow-hidden rounded-[3rem] border border-border-strong/50 bg-surface-1/50 p-10 text-center shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)] backdrop-blur-3xl md:p-16 lg:p-20">
          {/* Internal premium glowing orbs */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-primary/20 opacity-60 blur-[100px] transition-opacity duration-700 group-hover:opacity-100" />
          <div className="bg-brand-accent/15 pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-[100px]" />

          <ScrollReveal variant="fade-up" className="relative z-10 flex max-w-3xl flex-col gap-5">
            <h2 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-text-primary md:text-5xl lg:text-6xl">
              Stop guessing. <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-brand-primary to-brand-primary/60 bg-clip-text text-transparent">
                Start knowing.
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
              Upload any complex contract, notice, or lease below. We'll instantly translate
              legalese into simple English, extract deadlines, and flag hidden fees.{' '}
              <strong className="text-text-primary">First scan is 100% free.</strong>
            </p>
          </ScrollReveal>

          {/* Upload Dropzone */}
          <ScrollReveal variant="fade-up" delay={0.2} className="w-full max-w-4xl">
            <Link
              href={ROUTES.scan}
              className="group/drop relative z-10 flex w-full transform cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-border-strong bg-surface-2/30 px-12 py-8 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/60 hover:bg-surface-2/60 hover:shadow-[0_0_40px_-10px_rgba(var(--brand-primary-rgb),0.3)]"
            >
              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/10 p-4 text-brand-primary shadow-inner transition-all duration-500 group-hover/drop:scale-110 group-hover/drop:bg-brand-primary group-hover/drop:text-text-on-brand">
                <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <div className="mt-1 flex flex-col gap-1 text-center">
                <span className="text-xl font-bold text-text-primary md:text-2xl">
                  Drop your document here
                </span>
                <span className="mt-1 text-sm font-semibold text-brand-primary underline-offset-4 group-hover/drop:underline">
                  or click to browse files
                </span>
                <span className="mt-2 text-xs tracking-wide text-text-tertiary">
                  Supports PDF, PNG, JPEG, DOCX (up to 10MB)
                </span>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal
            variant="fade-up"
            delay={0.3}
            className="relative z-10 mt-2 flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-2 rounded-full border border-risk-safe/20 bg-risk-safe/10 px-5 py-2.5 text-xs font-bold text-risk-safe shadow-sm backdrop-blur-sm">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Bank-grade encryption. Files are automatically deleted after analysis.
            </div>
            <p className="text-xs font-medium text-text-tertiary">{reassurance}</p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
