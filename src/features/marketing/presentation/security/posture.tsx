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

function EntryList({
  entries,
  highlightHover,
}: {
  entries: readonly Entry[];
  highlightHover?: 'safe' | 'caution';
}) {
  return (
    <ul className="relative z-10 mt-8 flex flex-col gap-4">
      {entries.map((entry) => (
        <li
          key={entry.title}
          className={`posture-item flex flex-col gap-2 rounded-[1.5rem] border border-border-strong/50 bg-surface-2/40 px-7 py-6 transition-all duration-500 hover:shadow-lg ${highlightHover === 'safe' ? 'hover:border-risk-safe/40 hover:bg-risk-safe/5 hover:shadow-risk-safe/10' : 'hover:border-risk-caution/40 hover:bg-risk-caution/5 hover:shadow-risk-caution/10'}`}
        >
          <h4 className="text-base font-bold text-text-primary">{entry.title}</h4>
          <p className="text-sm leading-relaxed text-text-secondary">{entry.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function SecurityPosture({ contactEmail }: SecurityPostureProps) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
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
          },
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
          },
        );
      }, container);
      return () => ctx.revert();
    },
    { scope: container },
  );

  return (
    <section
      ref={container}
      aria-labelledby="posture-heading"
      className="relative w-full overflow-hidden bg-canvas py-24 md:py-32"
    >
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-brand-primary/5 blur-[120px]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="mb-16 flex max-w-2xl flex-col gap-4">
          <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
            Posture
          </span>
          <h2
            id="posture-heading"
            className="text-3xl leading-tight font-extrabold tracking-tight text-text-primary md:text-5xl"
          >
            What is in place, and what is not.
          </h2>
          <p className="text-base leading-relaxed font-medium text-text-secondary md:text-lg">
            The second list is the one worth reading. Every security page has the first.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="posture-column group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border-strong/50 bg-surface-1/40 p-10 shadow-sm backdrop-blur-2xl">
            <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-risk-safe/10 opacity-0 blur-[60px] transition-opacity duration-700 group-hover:opacity-100" />
            <h3 className="flex items-center gap-3 text-sm font-bold tracking-widest text-risk-safe uppercase">
              <span className="flex size-2 animate-pulse rounded-full bg-risk-safe shadow-[0_0_8px_rgba(var(--risk-safe-rgb),0.8)]" />
              In place today
            </h3>
            <EntryList entries={IN_PLACE} highlightHover="safe" />
          </div>

          <div className="posture-column group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border-strong/50 bg-surface-1/40 p-10 shadow-sm backdrop-blur-2xl">
            <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-risk-caution/10 opacity-0 blur-[60px] transition-opacity duration-700 group-hover:opacity-100" />
            <h3 className="flex items-center gap-3 text-sm font-bold tracking-widest text-risk-caution uppercase">
              <span className="flex size-2 rounded-full bg-risk-caution shadow-[0_0_8px_rgba(var(--risk-caution-rgb),0.8)]" />
              Not yet
            </h3>
            <EntryList entries={NOT_YET} highlightHover="caution" />
          </div>
        </div>

        <div className="posture-column group relative mt-16 flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 via-surface-1/50 to-transparent p-10 shadow-lg backdrop-blur-xl md:p-12">
          <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-brand-primary/10 blur-[80px] transition-colors duration-700 group-hover:bg-brand-primary/20" />
          <h4 className="relative z-10 text-2xl font-bold text-text-primary">Found something?</h4>
          <p className="relative z-10 max-w-3xl text-base leading-relaxed text-text-secondary">
            Write to{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="font-bold text-brand-primary transition-all hover:text-brand-primary-hover hover:underline"
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
