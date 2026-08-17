import type { Route } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { Button, ScrollReveal } from '@/shared/ui';

import type { GuideGroup } from '../../application';

const EXAMPLES_PER_CATEGORY = 3;

export interface LandingCoverageProps {
  groups: readonly GuideGroup[];
}

export function LandingCoverage({ groups }: LandingCoverageProps) {
  if (groups.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden border-t border-border-strong/30 bg-canvas py-24">
      <div className="pointer-events-none absolute top-0 right-0 h-[60%] w-[60%] bg-[radial-gradient(ellipse_at_top_right,rgba(var(--brand-primary-rgb),0.06),transparent_60%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[40%] w-[40%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(var(--brand-secondary-rgb),0.04),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex w-[95%] flex-col gap-16 px-6 md:w-[90%] lg:w-[80%]">
        <ScrollReveal variant="fade-up" className="flex max-w-3xl flex-col gap-4">
          <span className="text-xs font-extrabold tracking-widest text-brand-solid uppercase dark:text-brand-primary">
            Document Recognition Engine
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary md:text-5xl">
            It has seen your document type before
          </h2>
          <p className="text-base leading-relaxed text-text-secondary md:text-lg">
            Every one of these has its own guide — what the document is, what it typically costs
            people, and the deadline hiding in it.
          </p>
        </ScrollReveal>

        <ScrollReveal
          variant="stagger-children"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {groups.map((group) => (
            <div
              key={group.category}
              className="reveal-item group/card relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border-strong/60 bg-surface-1 p-7 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-[0_12px_40px_-10px_rgba(var(--brand-primary-rgb),0.15)]"
            >
              {/* Premium Hover Blob */}
              <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-bl-[100px] bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 transition-opacity duration-700 group-hover/card:opacity-100" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-2 transition-colors duration-500 group-hover/card:border-brand-primary/30 group-hover/card:bg-brand-primary/5">
                  <svg
                    className="size-4.5 text-text-tertiary transition-colors group-hover/card:text-brand-solid dark:group-hover/card:text-brand-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-text-primary">
                  {group.label}
                </h3>
              </div>

              <ul className="relative z-10 mt-1 flex flex-col gap-3">
                {group.guides.slice(0, EXAMPLES_PER_CATEGORY).map((guide) => (
                  <li key={guide.slug} className="group/item flex items-start gap-2.5">
                    <svg
                      className="mt-0.5 size-4 text-border-strong transition-colors group-hover/card:text-brand-primary/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <Link
                      href={ROUTES.guide(guide.slug) as Route}
                      className="line-clamp-1 flex-1 text-sm font-medium text-text-secondary transition-colors group-hover/item:text-brand-solid dark:group-hover/item:text-brand-primary"
                    >
                      {guide.heading}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.2}>
          <Button
            variant="premium"
            className="group/link shadow-2xl shadow-brand-primary/20"
            asChild
          >
            <Link href={ROUTES.useCases}>
              Browse all {groups.reduce((acc, g) => acc + g.guides.length, 0)} document guides
              <svg
                className="ml-2 size-4 transition-transform group-hover/link:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
