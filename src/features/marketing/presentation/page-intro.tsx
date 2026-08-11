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

  useGSAP(() => {
    gsap.fromTo(
      '.intro-stagger',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );
  }, { scope: container });

 return (
  <section ref={container} className="force-dark relative w-full pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-canvas">
    {/* Background Ambience */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--brand-primary-rgb),0.15),transparent_70%)] pointer-events-none" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
    
    <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent opacity-50" />

    <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10 flex flex-col items-center text-center gap-6">
 <span className="intro-stagger inline-flex items-center gap-2 border border-brand-primary/20 bg-brand-primary/5 rounded-full px-4 py-1.5 text-xs font-bold text-brand-primary tracking-widest uppercase shadow-sm">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
 </span>
 {eyebrow}
 </span>
 
 <h1 className="intro-stagger max-w-4xl text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-text-primary via-text-primary to-brand-primary/80 leading-[1.1] pb-2">
 {heading}
 </h1>
 
 <p className="intro-stagger max-w-2xl text-base md:text-lg text-text-secondary leading-relaxed font-medium">
 {lede}
 </p>
 
 {children && (
 <div className="intro-stagger mt-6 flex flex-col items-center gap-4">
 {children}
 </div>
 )}
 </div>
 </section>
 );
}
