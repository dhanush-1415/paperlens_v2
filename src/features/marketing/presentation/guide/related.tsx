import type { Route } from 'next';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants/routes';
import { ArrowRightIcon } from '@/shared/ui';

import type { GuideSummary } from '../../domain';

export interface GuideRelatedProps {
  categoryLabel: string;
  guides: readonly GuideSummary[];
}

export function GuideRelated({ categoryLabel, guides }: GuideRelatedProps) {
  if (guides.length === 0) return null;

  return (
    <section
      aria-labelledby="guide-related-heading"
      className="relative w-full overflow-hidden border-b border-border-strong/30 bg-surface-1/40 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.03),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="mb-12 flex max-w-2xl flex-col gap-4">
          <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
            Related guides
          </span>
          <h2
            id="guide-related-heading"
            className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
          >
            More {categoryLabel} guides
          </h2>
          <p className="text-sm leading-relaxed font-medium text-text-secondary md:text-base">
            If the one in your hand is not quite this, it may be one of these.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <li key={guide.slug} className="contents">
              <Link
                href={ROUTES.guide(guide.slug) as Route}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border-strong/50 bg-surface-1/50 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-lg"
              >
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-brand-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <h4 className="text-base font-bold text-text-primary transition-colors group-hover:text-brand-primary">
                    {guide.heading}
                  </h4>
                  <ArrowRightIcon
                    aria-hidden
                    className="mt-1 size-4 shrink-0 text-text-tertiary transition-transform duration-300 ease-brand group-hover:translate-x-1 group-hover:text-brand-primary"
                  />
                </div>
                <p className="relative z-10 text-sm leading-relaxed text-text-secondary">
                  {guide.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={ROUTES.useCases}
          className="group mt-12 inline-flex items-center gap-2 text-sm font-bold text-brand-primary transition-colors hover:text-brand-primary-hover"
        >
          All document guides
          <ArrowRightIcon
            aria-hidden
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}
