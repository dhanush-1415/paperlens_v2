'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckIcon } from '@/shared/ui';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface Commitment {
 readonly title: string;
 readonly body: string;
}

const COMMITMENTS: readonly Commitment[] = [
 {
 title: 'Never used to train a model',
 body: 'Not ours, and not anyone else’s. Where analysis runs through a third-party model provider, it runs under terms that prohibit training on the content — and if that ever stops being true of a provider, we change the provider rather than the sentence.',
 },
 {
 title: 'Never sold, never shared, never brokered',
 body: 'Your documents and what is in them are not a data product. There is no advertising business here to feed, and no arrangement under which a third party receives your content in exchange for anything.',
 },
 {
 title: 'Not read by us',
 body: 'No one here browses documents. Access to production data is restricted, and the rare case where a person needs to look at something to fix a fault requires your explicit permission first — asked for at the time, about that document.',
 },
 {
 title: 'No dark patterns on the way out',
 body: 'Deleting a document takes one action. Closing an account takes one action and does not require an email to support, a phone call, or a page that asks four times whether you are sure.',
 },
];

export function SecurityCommitments() {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      '.commitment-card',
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  }, { scope: container });

 return (
 <section ref={container} aria-labelledby="commitments-heading" className="w-full py-24 relative overflow-hidden bg-canvas border-b border-border-strong/30">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--risk-safe-rgb),0.06),transparent_70%)] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="flex flex-col gap-4 max-w-2xl mb-16">
 <span className="text-xs uppercase font-bold tracking-widest text-risk-safe">Commitments</span>
 <h2 id="commitments-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
 Four promises we could be caught breaking.
 </h2>
 <p className="text-base md:text-lg text-text-secondary leading-relaxed font-medium">
 Which is the only kind worth printing. Each of these is a statement of fact about how
 the product operates, not an aspiration about how we feel.
 </p>
 </div>

 <ul className="grid gap-6 md:grid-cols-2 lg:gap-8">
 {COMMITMENTS.map((commitment) => (
 <li
 key={commitment.title}
 className="commitment-card flex gap-5 p-8 rounded-[2rem] bg-surface-1/40 border border-border-strong/50 backdrop-blur-xl shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-risk-safe/10 hover:border-risk-safe/40 hover:-translate-y-1 group overflow-hidden relative"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-risk-safe/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
 <span
 aria-hidden
 className="relative z-10 mt-1 flex size-12 shrink-0 items-center justify-center rounded-full border border-risk-safe/20 bg-risk-safe/10 text-risk-safe group-hover:scale-110 group-hover:bg-risk-safe group-hover:text-canvas transition-all duration-500 shadow-[0_0_15px_-3px_rgba(var(--risk-safe-rgb),0.3)]"
 >
 <CheckIcon className="size-6" />
 </span>
 <div className="relative z-10 flex min-w-0 flex-col gap-3">
 <h3 className="text-xl font-bold text-text-primary">
 {commitment.title}
 </h3>
 <p className="text-sm text-text-secondary leading-relaxed">
 {commitment.body}
 </p>
 </div>
 </li>
 ))}
 </ul>
 </div>
 </section>
 );
}
