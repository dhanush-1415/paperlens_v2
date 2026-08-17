import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { Button, ScrollReveal } from '@/shared/ui';

export function LandingAssurances() {
  return (
    <section className="relative w-full overflow-hidden border-b border-border-strong/30 bg-canvas py-24">
      <div className="relative z-10 mx-auto w-[95%] px-6 md:w-[90%] lg:w-[80%]">
        <ScrollReveal
          variant="fade-up"
          className="force-dark group relative grid grid-cols-1 items-center gap-12 overflow-hidden rounded-[2.5rem] border border-border-strong/50 bg-canvas p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] md:p-14 lg:grid-cols-5"
        >
          {/* Glowing vault ambient light */}
          <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(var(--risk-safe-rgb),0.15)_0%,transparent_60%)] blur-[100px] transition-colors duration-1000 group-hover:bg-[radial-gradient(circle,rgba(var(--risk-safe-rgb),0.2)_0%,transparent_60%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(var(--brand-primary-rgb),0.1)_0%,transparent_60%)] blur-[100px]" />

          <div className="relative z-10 flex flex-col gap-6 lg:col-span-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-risk-safe uppercase">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Bank-Grade Security Architecture
            </div>

            <h2 className="text-3xl leading-[1.15] font-extrabold tracking-tight text-text-primary md:text-4xl lg:text-5xl">
              The Privacy Vault. <br className="hidden md:block" />
              Because your data is <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-risk-safe to-risk-safe/70 bg-clip-text text-transparent">
                none of our business.
              </span>
            </h2>

            <p className="max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
              PaperLens is engineered around absolute data sovereignty. Uploads process inside
              ephemeral server memories and automatically self-destruct once your session closes.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <span className="rounded-xl border border-border-strong bg-surface-2 px-5 py-2.5 text-xs font-bold text-text-primary shadow-lg backdrop-blur-md">
                SOC2 Type II
              </span>
              <span className="rounded-xl border border-border-strong bg-surface-2 px-5 py-2.5 text-xs font-bold text-text-primary shadow-lg backdrop-blur-md">
                GDPR Compliant
              </span>
              <span className="rounded-xl border border-border-strong bg-surface-2 px-5 py-2.5 text-xs font-bold text-text-primary shadow-lg backdrop-blur-md">
                256-Bit AES
              </span>
            </div>

            <Button variant="premium" className="group/link mt-4 w-max" asChild>
              <Link href={ROUTES.security}>
                How we handle documents, in detail
                <svg
                  className="size-4 transition-transform group-hover/link:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </Button>
          </div>

          {/* Terminal / System Status Window */}
          <div className="relative z-10 flex w-full flex-col gap-4 overflow-hidden rounded-3xl border border-border-strong/50 bg-surface-overlay/80 p-8 text-sm text-text-secondary shadow-2xl ring-1 ring-white/5 backdrop-blur-xl lg:col-span-2">
            <div className="mb-2 flex items-center justify-between border-b border-border-strong pb-5 font-bold text-text-primary">
              <span className="flex items-center gap-2">
                <svg
                  className="size-4.5 text-risk-safe"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                SECURITY PROTOCOL
              </span>
              <span className="flex items-center gap-2 rounded-full border border-risk-safe/30 bg-risk-safe/10 px-2 py-1 text-[10px] tracking-widest text-risk-safe">
                <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-risk-safe" />
                NOMINAL
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="size-4 shrink-0 text-risk-safe"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="truncate">TLS 1.3 in-transit / AES-256 at-rest</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="size-4 shrink-0 text-risk-safe"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="truncate">Zero-knowledge database isolation</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="size-4 shrink-0 text-risk-safe"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="truncate">No document model training, ever</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="size-4 shrink-0 text-risk-safe"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="truncate">Self-destruct sequence on tab close</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
