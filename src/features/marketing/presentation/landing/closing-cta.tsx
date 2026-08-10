import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

export interface LandingClosingCtaProps {
  ctaLabel: string;
  reassurance: string;
}

export function LandingClosingCta({ ctaLabel, reassurance }: LandingClosingCtaProps) {
  return (
    <section className="force-dark w-full py-24 relative overflow-hidden bg-canvas">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(var(--brand-primary-rgb),0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-[95%] md:w-[90%] lg:w-[70%] mx-auto px-6 relative z-10">
        <div className="border border-border-strong/50 bg-surface-1/50 backdrop-blur-3xl rounded-[3rem] p-10 md:p-16 lg:p-20 text-center flex flex-col items-center gap-10 relative overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)] group">
          {/* Internal premium glowing orbs */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 opacity-60 group-hover:opacity-100" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-accent/15 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col gap-5 relative z-10 max-w-3xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
              Stop guessing. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-primary/60">Start knowing.</span>
            </h2>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Upload any complex contract, notice, or lease below. We'll instantly translate legalese into simple English, extract deadlines, and flag hidden fees. <strong className="text-text-primary">First scan is 100% free.</strong>
            </p>
          </div>

          {/* Upload Dropzone */}
          <Link
            href={ROUTES.scan}
            className="relative z-10 border-2 border-dashed border-border-strong bg-surface-2/30 hover:bg-surface-2/60 hover:border-brand-primary/60 transition-all duration-500 rounded-[2.5rem] w-full max-w-xl p-12 flex flex-col items-center justify-center gap-5 cursor-pointer shadow-2xl hover:shadow-[0_0_40px_-10px_rgba(var(--brand-primary-rgb),0.3)] transform hover:-translate-y-1 group/drop"
          >
            <div className="p-5 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary transition-all duration-500 group-hover/drop:scale-110 group-hover/drop:bg-brand-primary group-hover/drop:text-text-on-brand shadow-inner">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5 text-center mt-2">
              <span className="text-2xl font-bold text-text-primary">Drop your document here</span>
              <span className="text-sm text-brand-primary font-semibold mt-1 group-hover/drop:underline underline-offset-4">or click to browse files</span>
              <span className="text-xs text-text-tertiary mt-3 tracking-wide">Supports PDF, PNG, JPEG, DOCX (up to 10MB)</span>
            </div>
          </Link>
          
          <div className="flex flex-col items-center gap-4 relative z-10 mt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-risk-safe bg-risk-safe/10 px-5 py-2.5 rounded-full border border-risk-safe/20 backdrop-blur-sm shadow-sm">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Bank-grade encryption. Files are automatically deleted after analysis.
            </div>
            <p className="text-xs font-medium text-text-tertiary">
              {reassurance}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
