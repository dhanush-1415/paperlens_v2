import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

export function LandingAssurances() {
  return (
    <section className="w-full py-24 relative overflow-hidden bg-canvas border-b border-border-strong/30">
      <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-6 relative z-10">
        
        <div className="force-dark grid grid-cols-1 lg:grid-cols-5 gap-12 items-center border border-border-strong/50 bg-canvas rounded-[2.5rem] p-8 md:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          {/* Glowing vault ambient light */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(var(--risk-safe-rgb),0.15)_0%,transparent_60%)] rounded-full blur-[100px] pointer-events-none group-hover:bg-[radial-gradient(circle,rgba(var(--risk-safe-rgb),0.2)_0%,transparent_60%)] transition-colors duration-1000" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(var(--brand-primary-rgb),0.1)_0%,transparent_60%)] rounded-full blur-[100px] pointer-events-none" />
          
          <div className="lg:col-span-3 flex flex-col gap-6 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-risk-safe uppercase tracking-widest">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Bank-Grade Security Architecture
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary leading-[1.15]">
              The Privacy Vault. <br className="hidden md:block" />
              Because your data is <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-risk-safe to-risk-safe/70">none of our business.</span>
            </h2>
            
            <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-xl">
              PaperLens is engineered around absolute data sovereignty. Uploads process inside ephemeral server memories and automatically self-destruct once your session closes.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <span className="text-xs font-bold text-text-primary bg-surface-2 px-5 py-2.5 rounded-xl border border-border-strong shadow-lg backdrop-blur-md">SOC2 Type II</span>
              <span className="text-xs font-bold text-text-primary bg-surface-2 px-5 py-2.5 rounded-xl border border-border-strong shadow-lg backdrop-blur-md">GDPR Compliant</span>
              <span className="text-xs font-bold text-text-primary bg-surface-2 px-5 py-2.5 rounded-xl border border-border-strong shadow-lg backdrop-blur-md">256-Bit AES</span>
            </div>

            <Link
              href={ROUTES.security}
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-text-on-brand bg-brand-solid hover:bg-brand-solid-hover px-6 py-3 rounded-full w-max transition-all shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 group/link"
            >
              How we handle documents, in detail
              <svg className="size-4 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          
          {/* Terminal / System Status Window */}
          <div className="lg:col-span-2 flex flex-col gap-4 text-sm text-text-secondary border border-border-strong/50 bg-surface-overlay/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10 w-full overflow-hidden ring-1 ring-white/5">
            <div className="flex items-center justify-between border-b border-border-strong pb-5 mb-2 text-text-primary font-bold">
              <span className="flex items-center gap-2">
                <svg className="size-4.5 text-risk-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                SECURITY PROTOCOL
              </span>
              <span className="text-risk-safe flex items-center gap-2 text-[10px] tracking-widest border border-risk-safe/30 bg-risk-safe/10 px-2 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-safe animate-ping inline-block" />
                NOMINAL
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="size-4 text-risk-safe shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">TLS 1.3 in-transit / AES-256 at-rest</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="size-4 text-risk-safe shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">Zero-knowledge database isolation</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="size-4 text-risk-safe shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">No document model training, ever</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="size-4 text-risk-safe shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">Self-destruct sequence on tab close</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
