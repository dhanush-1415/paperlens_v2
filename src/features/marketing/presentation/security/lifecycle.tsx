'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface Moment {
  readonly when: string;
  readonly title: string;
  readonly body: string;
}

const MOMENTS: readonly Moment[] = [
  {
    when: 'On the way',
    title: 'It travels encrypted',
    body: 'The upload runs over TLS from your browser to our servers. Nobody on the network in between — your café’s wifi, your employer’s proxy, your ISP — sees the contents of the file.',
  },
  {
    when: 'While it is read',
    title: 'It stays in memory',
    body: 'The text is extracted and analysed in the memory of the process handling your request. It is not written to a disk, a bucket or a table on the way through, and it is not copied anywhere for later.',
  },
  {
    when: 'When the analysis is done',
    title: 'It is discarded',
    body: 'The document and its extracted text go out of scope with the request. What you see on screen is the report; the source of it no longer exists on our side unless you asked us to keep it.',
  },
  {
    when: 'If you save it',
    title: 'It is stored under your account only',
    body: 'Saving is a choice you make per document. A saved document is encrypted at rest and readable only by the account that saved it — enforced at the data layer, so a bug in a page cannot serve one person’s document to another.',
  },
  {
    when: 'When you delete it',
    title: 'It is actually deleted',
    body: 'Not flagged as hidden and kept. The record is removed, and it drops out of backups as those age out on their normal cycle. Deleting your account deletes everything in it.',
  },
];

export function SecurityLifecycle() {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.lifecycle-step',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        },
      );
    },
    { scope: container },
  );

  return (
    <section
      ref={container}
      aria-labelledby="lifecycle-heading"
      className="relative w-full overflow-hidden border-b border-border-strong/30 bg-canvas py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(var(--brand-primary-rgb),0.05),transparent_60%)]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="mb-16 flex max-w-2xl flex-col gap-4">
          <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
            The life of a document
          </span>
          <h2
            id="lifecycle-heading"
            className="text-3xl leading-tight font-extrabold tracking-tight text-text-primary md:text-5xl"
          >
            Where your file is, at every moment.
          </h2>
          <p className="text-base leading-relaxed font-medium text-text-secondary md:text-lg">
            The honest version of this answer is short, so here is the whole of it rather than a
            summary with a link to a policy.
          </p>
        </div>

        <ol className="relative flex flex-col before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-gradient-to-b before:from-brand-primary/50 before:via-brand-primary/20 before:to-transparent lg:before:hidden">
          {MOMENTS.map((moment, index) => (
            <li
              key={moment.title}
              className="lifecycle-step group relative grid gap-4 border-b border-border-subtle/50 py-10 pl-14 last:border-0 lg:grid-cols-[16rem_1fr] lg:gap-16 lg:pl-0"
            >
              <div className="absolute top-12 left-0 flex items-center lg:static lg:mt-1">
                <span
                  aria-hidden
                  className="absolute left-0 z-10 flex size-10 -translate-x-[19px] items-center justify-center rounded-full border-2 border-canvas bg-surface-1 text-sm font-bold text-text-primary shadow-[0_0_15px_-3px_rgba(var(--brand-primary-rgb),0.3)] transition-all duration-500 group-hover:scale-110 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-canvas group-hover:shadow-[0_0_20px_0_rgba(var(--brand-primary-rgb),0.6)] lg:hidden lg:translate-x-0"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="hidden flex-col gap-1 lg:flex">
                  <span className="text-4xl font-extrabold text-border-strong/30 transition-colors duration-500 group-hover:text-brand-primary/20">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm font-bold tracking-widest text-brand-primary/80 uppercase transition-colors duration-500 group-hover:text-brand-primary">
                    {moment.when}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="mb-1 block text-xs font-bold tracking-widest text-brand-primary/80 uppercase transition-colors group-hover:text-brand-primary lg:hidden">
                  {moment.when}
                </p>
                <h3 className="text-2xl font-bold text-text-primary transition-colors duration-500 group-hover:text-brand-primary">
                  {moment.title}
                </h3>
                <p className="max-w-3xl text-base leading-relaxed text-text-secondary">
                  {moment.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
