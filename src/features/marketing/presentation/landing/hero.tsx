'use client';

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { ArrowRightIcon } from '@/shared/ui';

export interface LandingHeroProps {
  ctaLabel: string;
  reassurance: string;
  specimenId: string;
}

export function LandingHero({ ctaLabel, reassurance, specimenId }: LandingHeroProps) {
  return (
    <section className="relative w-full pt-12 pb-24 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-canvas via-surface-1/30 to-canvas">
      {/* Ambient decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none -z-10" />

      <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Copywriting & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left relative z-10">
            {/* Announcement Pill */}
            <div className="inline-flex self-start items-center gap-2 border border-brand-primary/20 bg-brand-primary/5 rounded-full px-4.5 py-1.5 text-xs font-semibold text-brand-solid dark:text-brand-primary hover:border-brand-primary/30 transition-colors shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
              <span>Next-Gen Document Intelligence</span>
              <span className="text-[10px] bg-brand-primary/10 text-brand-solid dark:text-brand-primary px-1.5 py-0.5 rounded-full uppercase font-bold">V2.1</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-text-primary">
              Turn Document Chaos <br />
              into{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-solid via-brand-primary to-brand-secondary">
                Actionable Data, Instantly.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl font-normal">
              PaperLens uses proprietary AI to automatically scan, extract, and organize information from physical and digital documents—eliminating manual entry.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-2">
              <Link
                href={ROUTES.scan}
                className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-hover hover:to-brand-primary px-8 py-4 text-sm font-bold text-text-on-brand transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-brand-primary/30"
              >
                Start Your Free Trial Today
                <ArrowRightIcon className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-surface-1/40 hover:bg-surface-2/60 backdrop-blur-md px-8 py-4 text-sm font-semibold text-text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign Up for a Free Demo
              </a>
            </div>

            {/* Trust points */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-text-tertiary mt-6 border-t border-border-subtle pt-6">
              <div className="flex items-center gap-2">
                <svg className="size-4.5 text-brand-solid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Zero Model Training</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-4.5 text-brand-solid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Zero-Knowledge Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-4.5 text-brand-solid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>0.8s Parser Engine</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek illustrative product demonstration graphic */}
          <div className="lg:col-span-5 relative w-full flex justify-center items-center">
            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
              
              {/* Decorative back grid */}
              <div className="absolute inset-0 bg-[radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

              {/* The "Physical Document Ingestion" zone */}
              <div className="absolute top-[10%] left-[-5%] w-[180px] h-[240px] rounded-xl border border-border-strong/80 bg-surface-raised shadow-2xl p-4 rotate-[-12deg] hover:rotate-[-6deg] transition-transform duration-500 flex flex-col gap-3 group">
                <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                  <div className="h-3 w-16 bg-border-strong rounded" />
                  <div className="size-4 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-brand-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-2 w-full bg-border-subtle rounded" />
                  <div className="h-2 w-[90%] bg-border-subtle rounded" />
                  <div className="h-2 w-[95%] bg-border-subtle rounded" />
                  <div className="h-2 w-[60%] bg-border-subtle rounded" />
                </div>
                <div className="mt-auto border-t border-border-subtle pt-2 flex justify-between items-center">
                  <div className="h-2 w-10 bg-border-subtle rounded" />
                  <div className="h-2 w-6 bg-border-subtle rounded" />
                </div>
                
                {/* Laser/scanner line simulating processing */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-brand-primary/0 via-brand-primary to-brand-primary/0 top-[30%] shadow-[0_0_10px_2px_rgba(91,140,255,0.5)] animate-scan-document" />
              </div>

              {/* Floating connector line representing AI parsing */}
              <svg className="absolute w-[180px] h-[100px] top-[30%] left-[30%] text-brand-primary pointer-events-none opacity-40 hidden md:block" viewBox="0 0 100 100" fill="none">
                <path d="M0,50 C40,50 60,10 100,10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-dash" />
              </svg>

              {/* The "Structured Data" Dashboard UI card */}
              <div className="absolute bottom-[8%] right-[-5%] w-[260px] h-[320px] rounded-2xl border border-brand-primary/30 bg-surface-1/80 backdrop-blur-xl shadow-2xl p-5 rotate-[6deg] hover:rotate-[2deg] transition-transform duration-500 flex flex-col gap-4">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-brand-solid dark:text-brand-primary tracking-wider uppercase">Extracted Output</span>
                    <span className="text-xs font-bold text-text-primary">Commercial Lease Agreement</span>
                  </div>
                  <div className="h-5 px-2 bg-risk-safe-bg border border-risk-safe-border text-[9px] font-extrabold text-risk-safe-fg rounded-full flex items-center">
                    Verified
                  </div>
                </div>

                {/* Structured Fields */}
                <div className="flex flex-col gap-2.5">
                  <div className="p-2 rounded-lg bg-surface-2/40 border border-border-subtle/50 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-text-tertiary uppercase">Lessor / Owner</span>
                    <span className="text-[11px] font-semibold text-text-primary">Aetrium Holdings LLC</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-2/40 border border-border-subtle/50 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-semibold text-text-tertiary uppercase">Rent Term</span>
                      <span className="text-[11px] font-semibold text-text-primary">60 Months</span>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <span className="text-[9px] font-semibold text-text-tertiary uppercase">Monthly Base</span>
                      <span className="text-[11px] font-bold text-brand-solid dark:text-brand-primary">$12,480.00</span>
                    </div>
                  </div>
                </div>

                {/* Micro Chart Visualization */}
                <div className="mt-auto pt-3 border-t border-border-subtle/70 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-semibold text-text-tertiary uppercase">Escalation Forecast</span>
                    <span className="text-[9px] font-bold text-text-primary">+3% Annually</span>
                  </div>
                  <div className="h-12 w-full flex items-end gap-1.5">
                    <div className="w-full bg-brand-primary/20 rounded-t h-[40%] hover:bg-brand-primary transition-all duration-300" />
                    <div className="w-full bg-brand-primary/20 rounded-t h-[52%] hover:bg-brand-primary transition-all duration-300" />
                    <div className="w-full bg-brand-primary/20 rounded-t h-[65%] hover:bg-brand-primary transition-all duration-300" />
                    <div className="w-full bg-brand-primary/20 rounded-t h-[80%] hover:bg-brand-primary transition-all duration-300" />
                    <div className="w-full bg-brand-primary rounded-t h-[95%]" />
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
