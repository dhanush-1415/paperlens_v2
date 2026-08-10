import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

export function LandingAssurances() {
 return (
 <section className="w-full py-24 relative overflow-hidden bg-canvas border-b border-border-strong/30">
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-6 relative z-10">
 
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-80 h-80 bg-risk-safe/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-risk-safe/20 transition-colors duration-1000" />
 
 <div className="lg:col-span-3 flex flex-col gap-6 relative z-10">
 <div className="inline-flex items-center gap-2 text-xs font-bold text-risk-safe uppercase tracking-widest">
 <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
 </svg>
 Bank-Grade Security Architecture
 </div>
 
 <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
 Privacy Vault. <br className="hidden md:block" />
 Because your data is <br className="hidden md:block" />
 <span className="text-risk-safe">none of our business.</span>
 </h2>
 
 <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-xl">
 PaperLens is engineered around absolute data sovereignty. Uploads process inside ephemeral server memories and automatically self-destruct once your session closes.
 </p>
 
 <div className="flex flex-wrap items-center gap-3 pt-2">
 <span className="text-xs font-bold text-text-primary bg-canvas px-4 py-2 rounded-xl border border-border-strong shadow-sm">SOC2 Type II</span>
 <span className="text-xs font-bold text-text-primary bg-canvas px-4 py-2 rounded-xl border border-border-strong shadow-sm">GDPR Compliant</span>
 <span className="text-xs font-bold text-text-primary bg-canvas px-4 py-2 rounded-xl border border-border-strong shadow-sm">256-Bit AES</span>
 </div>

 <Link
 href={ROUTES.security}
 className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover group/link w-max transition-colors"
 >
 How we handle documents, in detail
 <svg className="size-4 transition-transform group-hover/link:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
 </svg>
 </Link>
 </div>
 
 <div className="lg:col-span-2 flex flex-col gap-4 text-xs text-text-secondary border border-border-strong/50 bg-[#0a0a0a] rounded-2xl p-6 shadow-2xl relative z-10 w-full overflow-hidden">
 <div className="flex items-center justify-between border-b border-border-strong pb-4 mb-2 text-text-primary font-semibold">
 <span className="flex items-center gap-2">
 <svg className="size-4 text-risk-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
 </svg>
 SECURITY PROTOCOL
 </span>
 <span className="text-risk-safe flex items-center gap-1.5 text-[10px] tracking-widest">
 <span className="h-2 w-2 rounded-full bg-risk-safe animate-ping inline-block" />
 NOMINAL
 </span>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-risk-safe/80 shrink-0">✦</span>
 <span className="truncate">TLS 1.3 in-transit / AES-256 at-rest</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-risk-safe/80 shrink-0">✦</span>
 <span className="truncate">Zero-knowledge database isolation</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-risk-safe/80 shrink-0">✦</span>
 <span className="truncate">No document model training, ever</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-risk-safe/80 shrink-0">✦</span>
 <span className="truncate">Self-destruct sequence on tab close</span>
 </div>
 </div>
 </div>

 </div>
 </section>
 );
}
