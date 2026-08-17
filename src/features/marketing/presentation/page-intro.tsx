'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export interface MarketingPageIntroProps {
  /** The section of the site this page belongs to. Two or three words. */
  eyebrow: string;
  /** The page's `<h1>`. A claim or a promise — not the page's name. */
  heading: string;
  /** One or two sentences. What the page is about to argue. */
  lede: string;
  /** Optional actions or a note beneath the lede. */
  children?: ReactNode;
}

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export function MarketingPageIntro({ eyebrow, heading, lede, children }: MarketingPageIntroProps) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.intro-stagger',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
      );
    },
    { scope: container },
  );

  return (
    <section
      ref={container}
      className="force-dark relative w-full overflow-hidden bg-canvas pt-24 pb-20 md:pt-36 md:pb-28"
    >
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--brand-primary-rgb),0.15),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-brand-primary/10 blur-[140px]" />

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent opacity-50" />

      <div className="relative z-10 mx-auto flex w-[95%] flex-col items-center gap-6 text-center md:w-[90%] lg:w-[80%]">
        <span className="intro-stagger inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-primary uppercase shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary"></span>
          </span>
          {eyebrow}
        </span>

        <h1 className="intro-stagger max-w-4xl bg-gradient-to-br from-text-primary via-text-primary to-brand-primary/80 bg-clip-text pb-2 text-4xl leading-[1.1] font-extrabold tracking-tight text-transparent md:text-5xl lg:text-6xl">
          {heading}
        </h1>

        <p className="intro-stagger max-w-2xl text-base leading-relaxed font-medium text-text-secondary md:text-lg">
          {lede}
        </p>

        {children && (
          <div className="intro-stagger mt-6 flex flex-col items-center gap-4">{children}</div>
        )}
      </div>
    </section>
  );
}
