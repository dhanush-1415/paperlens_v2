import Link from 'next/link';

import { ROUTES } from '@/shared/constants/routes';
import { ArrowRightIcon } from '@/shared/ui';

interface Limit {
  readonly title: string;
  readonly body: string;
}

const LIMITS: readonly Limit[] = [
  {
    title: 'It is not legal advice, and it cannot be',
    body: 'It tells you what a document says and what a clause usually means. It does not know your circumstances, your jurisdiction’s most recent case law, or what you should do about any of it. Where the stakes are high, this is a way to reach a lawyer already knowing which three clauses to ask about — which is a cheaper hour than the one that starts with reading.',
  },
  {
    title: 'It can misread a bad scan',
    body: 'A photograph taken at an angle in poor light, a fax of a fax, handwriting in a margin — character recognition on any of those can drop a digit or a “not”. This is why every finding shows the passage it came from: a misread is visible in one glance, rather than hidden inside a confident summary.',
  },
  {
    title: 'It only knows what is in the document',
    body: 'A clause can be unremarkable on the page and ruinous because of a side letter, a prior agreement, or a conversation you had in a car park. Nothing that is not in the file you gave it is part of the analysis, and it does not guess at what might be.',
  },
  {
    title: 'It does not tell you what to sign',
    body: 'It will tell you that a clause renews automatically, that the notice window closes in six weeks, and what that costs if you miss it. Whether the deal is worth it is a judgement about your life, and no software has the standing to make it for you.',
  },
];

export function HowItWorksLimits() {
  return (
    <section
      aria-labelledby="limits-heading"
      className="relative w-full overflow-hidden bg-canvas py-24"
    >
      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-brand-primary/5 blur-[140px]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="relative flex flex-col gap-6 lg:col-span-5">
            <div className="sticky top-24">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-primary uppercase shadow-sm">
                Honest limits
              </span>
              <h2
                id="limits-heading"
                className="mt-6 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
              >
                What it will not do for you
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
                Written down here, before you rely on it, rather than in the terms you agree to
                without reading.
              </p>
              <Link
                href={ROUTES.security}
                className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary transition-colors hover:text-brand-primary-hover"
              >
                How your documents are handled
                <ArrowRightIcon
                  aria-hidden
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-col gap-4">
              {LIMITS.map((limit) => (
                <div
                  key={limit.title}
                  className="group/limit relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-border-strong bg-surface-1 p-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-2xl"
                >
                  <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-brand-primary/5 opacity-0 blur-[30px] transition-opacity duration-700 group-hover/limit:opacity-100" />
                  <h3 className="z-10 text-xl font-bold text-text-primary">{limit.title}</h3>
                  <p className="z-10 text-sm leading-relaxed text-text-secondary md:text-base">
                    {limit.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
