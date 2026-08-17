import type { Route } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants/routes';
import { ArrowRightIcon } from '@/shared/ui';

import type { GuideGroup } from '../application';

export interface GuideHubProps {
  groups: readonly GuideGroup[];
  eyebrow: string;
  heading: string;
  lede: string;
}

function GuideCard({
  slug,
  heading,
  description,
}: {
  slug: string;
  heading: string;
  description: string;
}) {
  return (
    <Link
      href={ROUTES.guide(slug) as Route}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border-strong/50 bg-surface-1/40 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-lg"
    >
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-brand-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-text-primary transition-colors group-hover:text-brand-primary">
          {heading}
        </h3>
        <ArrowRightIcon
          aria-hidden
          className="mt-1 size-4 shrink-0 text-text-tertiary transition-transform duration-300 ease-brand group-hover:translate-x-1 group-hover:text-brand-primary"
        />
      </div>
      <p className="relative z-10 text-sm leading-relaxed text-text-secondary">{description}</p>
    </Link>
  );
}

export function GuideHub({ groups, eyebrow, heading, lede }: GuideHubProps) {
  return (
    <>
      <section className="relative w-full overflow-hidden border-b border-border-strong/30 bg-surface-1/20 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem]" />
        <div className="pointer-events-none absolute top-0 right-1/4 -z-10 h-[300px] w-[600px] rounded-full bg-brand-primary/10 blur-[120px]" />

        <div className="relative z-10 mx-auto flex w-[95%] flex-col gap-6 md:w-[90%] lg:w-[80%]">
          <div className="flex max-w-3xl flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-primary uppercase shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary"></span>
              </span>
              {eyebrow}
            </span>
            <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-text-primary md:text-5xl lg:text-6xl">
              {heading}
            </h1>
            <p className="text-base leading-relaxed font-medium text-text-secondary md:text-lg">
              {lede}
            </p>
          </div>

          {groups.length > 1 ? (
            <nav aria-label="Guide categories" className="mt-8 flex flex-wrap gap-2">
              {groups.map((group) => (
                <a
                  key={group.category}
                  href={`#${group.category}`}
                  className="rounded-full border border-border-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-text-secondary shadow-sm transition-all duration-300 hover:border-brand-primary hover:text-brand-primary hover:shadow-md"
                >
                  {group.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <div className="bg-canvas">
        {groups.map((group) => (
          <section
            key={group.category}
            className="relative w-full border-b border-border-strong/30 py-16 last:border-0 md:py-24"
          >
            <div className="mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
              <h2
                id={group.category}
                className="mb-8 scroll-mt-32 text-xs font-bold tracking-widest text-text-primary uppercase"
              >
                {group.label}
              </h2>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.guides.map((guide) => (
                  <li key={guide.slug} className="contents">
                    <GuideCard
                      slug={guide.slug}
                      heading={guide.heading}
                      description={guide.description}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
