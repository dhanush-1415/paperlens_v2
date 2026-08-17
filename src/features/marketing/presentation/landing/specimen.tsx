'use client';

/**
 * The sample analysis — the section that does the selling.
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { DocumentExcerpt, RiskBadge, ScrollReveal } from '@/shared/ui';

import type { RiskTone } from '@/shared/ui/tone';

export interface LandingSpecimenProps {
  /** Anchor target for the hero's secondary action. */
  id: string;
}

interface Finding {
  readonly level: RiskTone;
  readonly title: string;
  readonly body: string;
  /** The consequence in numbers, when there is one. Rendered with tabular figures. */
  readonly consequence?: string;
}

const FINDINGS: readonly Finding[] = [
  {
    level: 'critical',
    title: 'A single late payment costs $160',
    body: 'Five percent of the monthly rent, charged the moment the 5th passes. The clause explicitly removes the grace period most tenants assume they have.',
    consequence: '$160 per occurrence',
  },
  {
    level: 'caution',
    title: 'The lease renews itself unless you act first',
    body: 'It rolls into another 12-month term automatically. Written notice is required at least 60 days before expiry — which puts the real deadline two months before the date on the front page.',
    consequence: 'Notice due 1 Nov 2026',
  },
  {
    level: 'safe',
    title: 'The deposit terms are ordinary',
    body: 'One month held, returned within 30 days of move-out, itemised deductions. Nothing here differs from what state law already requires.',
  },
];

function FindingRow({ level, title, body, consequence }: Finding) {
  return (
    <li className="finding-row group relative mb-4 flex flex-col gap-3 overflow-hidden rounded-2xl border border-border-strong/40 bg-canvas px-6 py-6 shadow-sm transition-shadow last:mb-0 hover:shadow-md">
      {/* Subtle hover gradient */}
      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-brand-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex flex-wrap items-center gap-3">
        <RiskBadge level={level} />
        {consequence ? (
          <span className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-[11px] font-bold tracking-widest text-text-tertiary uppercase">
            {consequence}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        <h4 className="text-base font-extrabold tracking-tight text-text-primary transition-colors group-hover:text-brand-solid dark:group-hover:text-brand-primary">
          {title}
        </h4>
        <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
      </div>
    </li>
  );
}

export function LandingSpecimen({ id }: LandingSpecimenProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Animate the left column excerpts
      if (leftColRef.current) {
        gsap.from(leftColRef.current.querySelectorAll('.document-excerpt-wrapper'), {
          scrollTrigger: {
            trigger: leftColRef.current,
            start: 'top 105%',
            toggleActions: 'play none none none',
            fastScrollEnd: true,
          },
          y: 40,
          opacity: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power3.out',
        });
      }

      // Animate the right column findings
      if (rightColRef.current) {
        gsap.from(rightColRef.current.querySelectorAll('.finding-row'), {
          scrollTrigger: {
            trigger: rightColRef.current,
            start: 'top 105%',
            toggleActions: 'play none none none',
            fastScrollEnd: true,
          },
          x: 40,
          opacity: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power3.out',
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id={id}
      className="relative w-full scroll-mt-20 overflow-hidden border-y border-border-strong/30 bg-surface-1 py-24 md:py-32"
      ref={sectionRef}
    >
      {/* Premium Decorative Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-border-strong)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/5 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-[95%] flex-col gap-16 px-4 md:w-[90%] md:px-6 lg:w-[80%]">
        <ScrollReveal variant="fade-up" className="flex max-w-3xl flex-col gap-4">
          <span className="text-xs font-extrabold tracking-widest text-brand-solid uppercase dark:text-brand-primary">
            Interactive Specimen
          </span>
          <h2 className="text-3xl leading-[1.1] font-extrabold tracking-tight text-text-primary md:text-5xl">
            One clause in. Three things you can act on, out.
          </h2>
          <p className="text-base leading-relaxed text-text-secondary md:text-lg">
            This is the whole product in one screen: the passage exactly as it appears in the
            document, and what it means for the person who has to sign it.
          </p>
        </ScrollReveal>

        {/* Dashboard Frame */}
        <div className="relative grid grid-cols-1 gap-0 overflow-hidden rounded-[2.5rem] border border-border-strong/60 bg-surface-overlay/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl lg:grid-cols-2">
          {/* Glass edge highlight */}
          <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10" />

          {/* Left Column: From the Document */}
          <div
            className="relative flex flex-col gap-8 border-b border-border-strong/50 bg-canvas/40 p-8 md:p-12 lg:border-r lg:border-b-0"
            ref={leftColRef}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-text-tertiary uppercase">
                <svg
                  className="size-4 text-brand-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Source Document
              </span>
            </div>

            <div className="flex w-full flex-col gap-8">
              <div className="document-excerpt-wrapper w-full">
                <DocumentExcerpt level="critical" source="Clause 7.2 — Late payment">
                  If rent is not received by the fifth (5th) day of each month, Tenant shall pay a
                  late charge equal to <mark>five percent (5%) of the monthly rent</mark>.{' '}
                  <mark>No grace period shall apply</mark>, and acceptance of a late payment shall
                  not constitute a waiver of this provision.
                </DocumentExcerpt>
              </div>
              <div className="document-excerpt-wrapper w-full">
                <DocumentExcerpt level="caution" source="Clause 11.1 — Term and renewal">
                  This Lease shall{' '}
                  <mark>automatically renew for successive twelve (12) month terms</mark> unless
                  either party provides written notice of non-renewal{' '}
                  <mark>not less than sixty (60) days prior</mark> to the expiration of the
                  then-current term.
                </DocumentExcerpt>
              </div>
            </div>
          </div>

          {/* Right Column: What PaperLens Returns */}
          <div className="relative flex flex-col gap-8 bg-surface-1/30 p-8 md:p-12">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-text-tertiary uppercase">
                <svg
                  className="size-4 text-brand-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                AI Analysis Output
              </span>
            </div>

            <ul className="flex w-full flex-col" ref={rightColRef}>
              {FINDINGS.map((finding) => (
                <FindingRow key={finding.title} {...finding} />
              ))}
            </ul>
          </div>
        </div>

        <p className="mx-auto max-w-2xl text-center text-xs font-medium text-text-tertiary">
          A specimen lease written for this page, not a customer&rsquo;s document. Your files are
          deleted after analysis, are never shown to anyone, and are never used to train a model.
        </p>
      </div>
    </section>
  );
}
