import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

export interface LandingClosingCtaProps {
 ctaLabel: string;
 reassurance: string;
}

export function LandingClosingCta({ ctaLabel, reassurance }: LandingClosingCtaProps) {
 return (
 <section className="force-dark w-full pt-12 pb-24 relative overflow-hidden bg-canvas">
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-6">
 <div className="border border-brand-primary/40 bg-gradient-to-br from-brand-primary/10 via-surface-1/90 to-surface-2/80 rounded-[2.5rem] p-10 md:p-16 text-center flex flex-col items-center gap-8 relative overflow-hidden shadow-2xl">
 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
 
 <div className="flex flex-col gap-4 relative z-10 max-w-2xl">
 <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary">
 Stop guessing. Start knowing.
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed">
 Upload any complex contract, notice, or lease below. We'll instantly translate legalese into simple English, extract deadlines, and flag hidden fees. <strong>First scan is 100% free.</strong>
 </p>
 </div>

 <Link
 href={ROUTES.scan}
 className="relative z-10 border-2 border-dashed border-brand-primary/40 bg-surface-overlay/60 hover:bg-surface-overlay hover:border-brand-primary transition-all duration-300 rounded-3xl w-full max-w-xl p-10 md:p-12 flex flex-col items-center justify-center gap-4 cursor-pointer group shadow-2xl hover:shadow-brand-primary/20 transform hover:-translate-y-1"
 >
 <div className="p-4 rounded-full bg-brand-primary/10 text-brand-primary group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-canvas transition-all duration-300 shadow-inner">
 <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
 </svg>
 </div>
 <div className="flex flex-col gap-1 text-center mt-2">
 <span className="text-xl font-bold text-text-primary">Drop your document here</span>
 <span className="text-sm text-brand-primary font-medium mt-1">or click to browse files</span>
 <span className="text-xs text-text-tertiary mt-2">Supports PDF, PNG, JPEG, DOCX (up to 10MB)</span>
 </div>
 </Link>
 
 <div className="flex flex-col items-center gap-3 relative z-10">
 <div className="flex items-center gap-2 text-xs font-medium text-risk-safe bg-risk-safe-bg px-4 py-2 rounded-full border border-risk-safe-border">
 <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
 </svg>
 Bank-grade encryption. Files are automatically deleted after analysis.
 </div>
 <p className="text-xs text-text-tertiary mt-2">
 {reassurance}
 </p>
 </div>
 </div>
 </div>
 </section>
 );
}
