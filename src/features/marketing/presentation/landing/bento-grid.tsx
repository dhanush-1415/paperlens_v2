'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heading, Text } from '@/shared/ui';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export interface LandingBentoGridProps {
  id?: string;
}

export function LandingBentoGrid({ id = 'features' }: LandingBentoGridProps) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.bento-card',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container.current,
            start: 'top 105%',
            toggleActions: 'play none none none',
            fastScrollEnd: true,
          },
        },
      );
    },
    { scope: container },
  );

  return (
    <section
      ref={container}
      id={id}
      className="force-dark relative w-full overflow-hidden bg-canvas py-24"
    >
      {/* Background Glows */}
      <div className="pointer-events-none absolute top-[30%] -right-[10%] h-[500px] w-[500px] rounded-full bg-brand-primary/5 blur-[120px]" />
      <div className="bg-brand-accent/5 pointer-events-none absolute bottom-[10%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[150px]" />

      <div className="relative z-10 mx-auto flex w-[95%] flex-col gap-12 px-6 md:w-[90%] lg:w-[80%]">
        {/* Header */}
        <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
          <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
            The Ultimate Unfair Advantage
          </span>
          <Heading level={2} size="display-md" className="tracking-tight text-text-primary">
            Never Be Blind-Sided Again.
          </Heading>
          <Text tone="secondary" size="md" className="leading-relaxed">
            PaperLens doesn't just read documents; it weaponizes them for you. We highlight exactly
            what they don't want you to notice. Protect your business and personal assets in
            seconds.
          </Text>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Risk Radar */}
          <div
            tabIndex={0}
            aria-label="Feature: Financial Risk Radar"
            className="bento-card group relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border-strong/50 bg-surface-1/40 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/10 focus:ring-2 focus:ring-brand-primary focus:outline-none md:col-span-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col gap-2">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-risk-critical-bg text-risk-critical shadow-sm ring-1 ring-risk-critical-border">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-text-primary">
                Financial Risk Radar
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-text-secondary">
                Automatically isolates penalty clauses, fee escalations, and liability traps before
                you sign anything. Find the gotchas before they find you.
              </p>
            </div>

            {/* Mockup Element */}
            <div className="relative z-10 mt-4 rounded-xl border border-border-subtle bg-surface-2 p-4 shadow-inner">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-risk-critical" />
                <span className="text-xs font-semibold text-risk-critical">
                  Critical Risk Detected: Hidden Fee
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-border-strong/40" />
                <div className="h-2 w-4/5 rounded bg-border-strong/40" />
              </div>
            </div>
          </div>

          {/* Card 2: Deadline Extraction */}
          <div
            tabIndex={0}
            aria-label="Feature: Timeline Engine"
            className="bento-card group hover:shadow-brand-accent/10 hover:border-brand-accent/30 focus:ring-brand-accent relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border-strong/50 bg-surface-1/40 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl focus:ring-2 focus:outline-none md:col-span-1"
          >
            <div className="from-brand-accent/5 absolute inset-0 bg-gradient-to-bl to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col gap-2">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-risk-caution-bg text-risk-caution shadow-sm ring-1 ring-risk-caution-border">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-text-primary">
                Timeline Engine
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                Never miss a cancellation window again. We extract hidden auto-renewal dates
                instantly.
              </p>
            </div>

            <div className="relative z-10 mt-auto flex flex-col gap-2 border-t border-border-subtle pt-6">
              <span className="text-xs font-bold text-text-primary">Next Deadline</span>
              <span className="text-brand-accent text-2xl">Nov 01</span>
            </div>
          </div>

          {/* Card 3: AI Chat */}
          <div
            tabIndex={0}
            aria-label="Feature: Interrogate Documents"
            className="bento-card group relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border-strong/50 bg-surface-1/40 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-risk-safe/30 hover:shadow-2xl hover:shadow-risk-safe/10 focus:ring-2 focus:ring-risk-safe focus:outline-none md:col-span-1"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-risk-safe/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col gap-2">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-risk-safe-bg text-risk-safe shadow-sm ring-1 ring-risk-safe-border">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-text-primary">
                Interrogate Documents
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                Chat with your file. Ask "Can I get out of this?" and get an answer with exact page
                citations.
              </p>
            </div>
          </div>

          {/* Card 4: Plain English Translation */}
          <div
            tabIndex={0}
            aria-label="Feature: Legalese to English Translation"
            className="bento-card group relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border-strong/50 bg-surface-1/40 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/10 focus:ring-2 focus:ring-brand-primary focus:outline-none md:col-span-2"
          >
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10 flex flex-col gap-2">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm ring-1 ring-brand-primary/20">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-text-primary">
                Legalese to English
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-text-secondary">
                Instantly converts dense, deceptive contracts into simple, actionable bullet points
                that anyone can understand.
              </p>
            </div>

            {/* Mockup Element */}
            <div className="relative z-10 mt-4 flex flex-col items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-2 p-4 shadow-inner md:flex-row">
              <div className="w-full rounded-lg border border-border-subtle bg-canvas p-3 text-[10px] text-text-tertiary blur-[1px] md:w-1/2">
                Whereas the party of the first part hereby agrees to indemnify and hold harmless...
              </div>
              <svg
                className="size-5 flex-shrink-0 text-brand-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
              <div className="w-full rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-3 text-xs font-medium text-brand-primary md:w-1/2">
                You are responsible for all damages.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
