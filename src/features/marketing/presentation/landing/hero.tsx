'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ROUTES } from '@/shared/constants/routes';
import { ArrowRightIcon, Button } from '@/shared/ui';

export interface LandingHeroProps {
  ctaLabel: string;
  reassurance: string;
  specimenId: string;
}

// Ensure GSAP plugins are registered if needed, but core gsap is enough here.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export function LandingHero({ ctaLabel, reassurance, specimenId }: LandingHeroProps) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Elegant stagger fade-up for text elements
      gsap.fromTo(
        '.hero-stagger',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.1 },
      );

      // Subtle parallax float for the document cards
      gsap.fromTo(
        '.hero-card-left',
        { x: -40, y: 40, opacity: 0, rotation: -16 },
        { x: 0, y: 0, opacity: 1, rotation: -12, duration: 1.4, ease: 'back.out(1.2)', delay: 0.4 },
      );
      gsap.fromTo(
        '.hero-card-right',
        { x: 40, y: 40, opacity: 0, rotation: 12 },
        { x: 0, y: 0, opacity: 1, rotation: 6, duration: 1.4, ease: 'back.out(1.2)', delay: 0.6 },
      );

      // Continuous floating animation
      gsap.to('.hero-card-left', {
        y: '-=10',
        rotation: '-=2',
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 1.8,
      });
      gsap.to('.hero-card-right', {
        y: '-=12',
        rotation: '+=2',
        duration: 3.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 2,
      });
    },
    { scope: container },
  );

  return (
    <section
      ref={container}
      className="relative w-full overflow-hidden bg-gradient-to-b from-canvas via-surface-1/30 to-canvas pt-12 pb-24 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32"
    >
      {/* Ambient decorative blobs */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-brand-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-brand-secondary/5 blur-[100px]" />

      <div className="mx-auto w-[95%] px-5 sm:px-6 md:w-[90%] lg:w-[80%] lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Copywriting & Actions */}
          <div className="relative z-10 flex flex-col gap-6 text-left lg:col-span-7">
            {/* Announcement Pill */}
            <div className="hero-stagger inline-flex items-center gap-2 self-start rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4.5 py-1.5 text-xs font-semibold text-brand-solid shadow-sm transition-colors hover:border-brand-primary/30 dark:text-brand-primary">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-brand-primary" />
              <span>Next-Gen Document Intelligence</span>
              <span className="rounded-full bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-solid uppercase dark:text-brand-primary">
                V2.1
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-stagger text-4xl leading-[1.1] font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Turn Document Chaos <br />
              into{' '}
              <span className="bg-gradient-to-r from-brand-solid via-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Actionable Data, Instantly.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="hero-stagger max-w-xl text-base leading-relaxed font-normal text-text-secondary sm:text-lg">
              PaperLens uses proprietary AI to automatically scan, extract, and organize information
              from physical and digital documents—eliminating manual entry.
            </p>

            {/* CTAs */}
            <div className="hero-stagger mt-2 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Button
                variant="premium"
                className="group h-14 px-8 text-sm font-bold shadow-xl shadow-brand-primary/30"
                asChild
              >
                <Link href={ROUTES.scan}>
                  Start Your Free Trial Today
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Link
                href={ROUTES.login}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-surface-1/40 px-8 py-4 text-sm font-semibold text-text-primary backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-surface-2/60 active:scale-[0.98]"
              >
                Sign Up for a Free Demo
              </Link>
            </div>

            {/* Trust points */}
            <div className="hero-stagger mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border-subtle pt-6 text-xs font-semibold text-text-tertiary">
              <div className="flex items-center gap-2">
                <svg
                  className="size-4.5 text-brand-solid"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>Zero Model Training</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="size-4.5 text-brand-solid"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Zero-Knowledge Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="size-4.5 text-brand-solid"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>0.8s Parser Engine</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek illustrative product demonstration graphic */}
          <div className="relative flex w-full items-center justify-center lg:col-span-5">
            <div className="relative flex aspect-square w-full max-w-lg items-center justify-center">
              {/* Decorative back grid */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

              {/* The "Physical Document Ingestion" zone */}
              <div className="hero-card-left group absolute top-[10%] left-[-5%] flex h-[240px] w-[180px] flex-col gap-3 rounded-xl border border-border-strong/80 bg-surface-raised p-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <div className="h-3 w-16 rounded bg-border-strong" />
                  <div className="flex size-4 items-center justify-center rounded-full bg-brand-primary/20">
                    <div className="size-1.5 rounded-full bg-brand-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-2 w-full rounded bg-border-subtle" />
                  <div className="h-2 w-[90%] rounded bg-border-subtle" />
                  <div className="h-2 w-[95%] rounded bg-border-subtle" />
                  <div className="h-2 w-[60%] rounded bg-border-subtle" />
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-2">
                  <div className="h-2 w-10 rounded bg-border-subtle" />
                  <div className="h-2 w-6 rounded bg-border-subtle" />
                </div>

                {/* Laser/scanner line simulating processing */}
                <div className="absolute top-[30%] right-0 left-0 h-1 animate-scan-document bg-gradient-to-r from-brand-primary/0 via-brand-primary to-brand-primary/0 shadow-[0_0_10px_2px_rgba(91,140,255,0.5)]" />
              </div>

              {/* Floating connector line representing AI parsing */}
              <svg
                className="hero-stagger pointer-events-none absolute top-[30%] left-[30%] hidden h-[100px] w-[180px] text-brand-primary opacity-40 md:block"
                viewBox="0 0 100 100"
                fill="none"
              >
                <path
                  d="M0,50 C40,50 60,10 100,10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-dash"
                />
              </svg>

              {/* The "Structured Data" Dashboard UI card */}
              <div className="hero-card-right absolute right-[-5%] bottom-[8%] flex h-[320px] w-[260px] flex-col gap-4 rounded-2xl border border-brand-primary/30 bg-surface-1/80 p-5 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-wider text-brand-solid uppercase dark:text-brand-primary">
                      Extracted Output
                    </span>
                    <span className="text-xs font-bold text-text-primary">
                      Commercial Lease Agreement
                    </span>
                  </div>
                  <div className="flex h-5 items-center rounded-full border border-risk-safe-border bg-risk-safe-bg px-2 text-[9px] font-extrabold text-risk-safe-fg">
                    Verified
                  </div>
                </div>

                {/* Structured Fields */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1 rounded-lg border border-border-subtle/50 bg-surface-2/40 p-2">
                    <span className="text-[9px] font-semibold text-text-tertiary uppercase">
                      Lessor / Owner
                    </span>
                    <span className="text-[11px] font-semibold text-text-primary">
                      Aetrium Holdings LLC
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border-subtle/50 bg-surface-2/40 p-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-semibold text-text-tertiary uppercase">
                        Rent Term
                      </span>
                      <span className="text-[11px] font-semibold text-text-primary">60 Months</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-[9px] font-semibold text-text-tertiary uppercase">
                        Monthly Base
                      </span>
                      <span className="text-[11px] font-bold text-brand-solid dark:text-brand-primary">
                        $12,480.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro Chart Visualization */}
                <div className="mt-auto flex flex-col gap-2 border-t border-border-subtle/70 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-text-tertiary uppercase">
                      Escalation Forecast
                    </span>
                    <span className="text-[9px] font-bold text-text-primary">+3% Annually</span>
                  </div>
                  <div className="flex h-12 w-full items-end gap-1.5">
                    <div className="h-[40%] w-full rounded-t bg-brand-primary/20 transition-all duration-300 hover:bg-brand-primary" />
                    <div className="h-[52%] w-full rounded-t bg-brand-primary/20 transition-all duration-300 hover:bg-brand-primary" />
                    <div className="h-[65%] w-full rounded-t bg-brand-primary/20 transition-all duration-300 hover:bg-brand-primary" />
                    <div className="h-[80%] w-full rounded-t bg-brand-primary/20 transition-all duration-300 hover:bg-brand-primary" />
                    <div className="h-[95%] w-full rounded-t bg-brand-primary" />
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
