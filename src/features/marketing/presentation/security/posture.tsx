'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export interface SecurityPostureProps {
 contactEmail: string;
}

interface Entry {
 readonly title: string;
 readonly body: string;
}

const IN_PLACE: readonly Entry[] = [
 {
 title: 'Encrypted in transit and at rest',
 body: 'TLS for everything that crosses a network, including between our own services. Anything stored — a saved document, its analysis — is encrypted on disk.',
 },
 {
 title: 'Isolation enforced at the data layer',
 body: 'Which account may read which record is decided below the application, not by a check a page could forget to make. A bug in a route cannot serve one person’s document to another.',
 },
 {
 title: 'Least-privilege access',
 body: 'Production access is scoped to the people who need it for the job they are doing, granted for as long as they need it, and logged.',
 },
 {
 title: 'Dependencies watched',
 body: 'Third-party packages are pinned, scanned for known vulnerabilities on every build, and updated on a schedule rather than when something breaks.',
 },
];

const NOT_YET: readonly Entry[] = [
 {
 title: 'No SOC 2 report yet',
 body: 'We are a young product and have not completed an audit. If your procurement process requires one, tell us — knowing how many people are blocked on it is what decides when we start.',
 },
 {
 title: 'No HIPAA BAA',
 body: 'People do upload medical bills, and the analysis works. But we do not sign business associate agreements today, so PaperLens is not an appropriate place for a covered entity to process protected health information.',
 },
 {
 title: 'No published penetration test',
 body: 'Testing happens; a report you can read does not exist yet. When there is one worth publishing, it will be linked from this page rather than described on it.',
 },
];

function EntryList({ entries, highlightHover }: { entries: readonly Entry[], highlightHover?: 'safe' | 'caution' }) {
 return (
 <ul className="flex flex-col gap-4 mt-8 relative z-10">
 {entries.map((entry) => (
 <li 
 key={entry.title} 
 className={`posture-item flex flex-col gap-2 py-6 px-7 rounded-[1.5rem] bg-surface-2/40 border border-border-strong/50 transition-all duration-500 hover:shadow-lg ${highlightHover === 'safe' ? 'hover:border-risk-safe/40 hover:bg-risk-safe/5 hover:shadow-risk-safe/10' : 'hover:border-risk-caution/40 hover:bg-risk-caution/5 hover:shadow-risk-caution/10'}`}
 >
 <h4 className="text-base font-bold text-text-primary">
 {entry.title}
 </h4>
 <p className="text-sm text-text-secondary leading-relaxed">
 {entry.body}
 </p>
 </li>
 ))}
 </ul>
 );
}

export function SecurityPosture({ contactEmail }: SecurityPostureProps) {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.posture-column',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
      
      gsap.fromTo(
        '.posture-item',
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, container);
    return () => ctx.revert();
  }, { scope: container });

 return (
 <section ref={container} aria-labelledby="posture-heading" className="w-full py-24 md:py-32 relative overflow-hidden bg-canvas">
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="flex flex-col gap-4 max-w-2xl mb-16">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">Posture</span>
 <h2 id="posture-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
 What is in place, and what is not.
 </h2>
 <p className="text-base md:text-lg text-text-secondary leading-relaxed font-medium">
 The second list is the one worth reading. Every security page has the first.
 </p>
 </div>

 <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
 <div className="posture-column flex flex-col p-10 rounded-[2.5rem] bg-surface-1/40 border border-border-strong/50 backdrop-blur-2xl shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-risk-safe/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
 <h3 className="text-sm font-bold tracking-widest text-risk-safe uppercase flex items-center gap-3">
 <span className="flex size-2 rounded-full bg-risk-safe animate-pulse shadow-[0_0_8px_rgba(var(--risk-safe-rgb),0.8)]" />
 In place today
 </h3>
 <EntryList entries={IN_PLACE} highlightHover="safe" />
 </div>

 <div className="posture-column flex flex-col p-10 rounded-[2.5rem] bg-surface-1/40 border border-border-strong/50 backdrop-blur-2xl shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-risk-caution/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
 <h3 className="text-sm font-bold tracking-widest text-risk-caution uppercase flex items-center gap-3">
 <span className="flex size-2 rounded-full bg-risk-caution shadow-[0_0_8px_rgba(var(--risk-caution-rgb),0.8)]" />
 Not yet
 </h3>
 <EntryList entries={NOT_YET} highlightHover="caution" />
 </div>
 </div>

 <div className="posture-column mt-16 flex flex-col gap-4 rounded-[2rem] border border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 via-surface-1/50 to-transparent p-10 md:p-12 relative overflow-hidden shadow-lg backdrop-blur-xl group">
 <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-brand-primary/20 transition-colors duration-700" />
 <h4 className="text-2xl font-bold text-text-primary relative z-10">
 Found something?
 </h4>
 <p className="text-base text-text-secondary leading-relaxed max-w-3xl relative z-10">
 Write to{' '}
 <a
 href={`mailto:${contactEmail}`}
 className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline transition-all"
 >
 {contactEmail}
 </a>{' '}
 with enough detail to reproduce it. We will confirm receipt, keep you updated while we
 fix it, and credit you if you want to be credited. We will not threaten you with a
 lawyer for telling us about a bug.
 </p>
 </div>
 </div>
 </section>
 );
}
