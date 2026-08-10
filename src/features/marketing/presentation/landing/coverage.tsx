import type { Route } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

import type { GuideGroup } from '../../application';

const EXAMPLES_PER_CATEGORY = 3;

export interface LandingCoverageProps {
 groups: readonly GuideGroup[];
}

export function LandingCoverage({ groups }: LandingCoverageProps) {
 if (groups.length === 0) return null;

  return (
    <section className="w-full py-24 relative overflow-hidden bg-canvas border-t border-border-strong/30">
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_top_right,rgba(var(--brand-primary-rgb),0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(var(--brand-secondary-rgb),0.04),transparent_60%)] pointer-events-none" />
      
      <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-6 relative z-10 flex flex-col gap-16">
        <div className="flex flex-col gap-4 max-w-3xl">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-solid dark:text-brand-primary">
            Document Recognition Engine
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary">
            It has seen your document type before
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Every one of these has its own guide — what the document is, what it typically costs people, and the deadline hiding in it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div 
              key={group.category} 
              className="flex flex-col gap-5 rounded-3xl border border-border-strong/60 bg-surface-1 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-7 transition-all duration-500 hover:border-brand-primary/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(var(--brand-primary-rgb),0.15)] group/card relative overflow-hidden"
            >
              {/* Premium Hover Blob */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-bl-[100px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="size-9 rounded-xl bg-surface-2 flex items-center justify-center border border-border-subtle group-hover/card:border-brand-primary/30 group-hover/card:bg-brand-primary/5 transition-colors duration-500">
                  <svg className="size-4.5 text-text-tertiary group-hover/card:text-brand-solid dark:group-hover/card:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-extrabold text-text-primary tracking-tight">
                  {group.label}
                </h3>
              </div>

              <ul className="flex flex-col gap-3 relative z-10 mt-1">
                {group.guides.slice(0, EXAMPLES_PER_CATEGORY).map((guide) => (
                  <li key={guide.slug} className="flex items-start gap-2.5 group/item">
                    <svg className="size-4 text-border-strong mt-0.5 group-hover/card:text-brand-primary/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <Link
                      href={ROUTES.guide(guide.slug) as Route}
                      className="text-sm font-medium text-text-secondary group-hover/item:text-brand-solid dark:group-hover/item:text-brand-primary transition-colors flex-1 line-clamp-1"
                    >
                      {guide.heading}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Link
          href={ROUTES.useCases}
          className="group inline-flex items-center gap-3 text-sm font-bold text-text-on-brand bg-brand-solid hover:bg-brand-solid-hover px-8 py-3.5 rounded-2xl w-max transition-all duration-300 shadow-xl shadow-brand-primary/20 hover:shadow-2xl hover:shadow-brand-primary/30 hover:-translate-y-0.5"
        >
          Browse all {groups.reduce((acc, g) => acc + g.guides.length, 0)} document guides
          <svg className="size-4.5 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
