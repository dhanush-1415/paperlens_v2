import Link from 'next/link';

import { ROUTES } from '@/shared/constants/routes';
import { ArrowRightIcon, ChevronRightIcon } from '@/shared/ui';

import type { DocumentGuide } from '../../domain';
import { GUIDE_SECTION_IDS } from './section-ids';

export interface GuideHeroProps {
  guide: DocumentGuide;
  ctaLabel: string;
  reassurance: string;
}

const JUMP_LINKS = [
  { id: GUIDE_SECTION_IDS.risks, label: 'What usually goes wrong' },
  { id: GUIDE_SECTION_IDS.checklist, label: 'What to do' },
  { id: GUIDE_SECTION_IDS.faq, label: 'Questions' },
] as const;

export function GuideHero({ guide, ctaLabel, reassurance }: GuideHeroProps) {
  return (
    <section className="relative w-full overflow-hidden border-b border-border-strong/30 bg-surface-1/20 pt-10 pb-16 sm:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute top-0 right-1/4 -z-10 h-[300px] w-[600px] rounded-full bg-brand-primary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-text-tertiary">
            <li>
              <Link href={ROUTES.home} className="transition-colors hover:text-text-primary">
                Home
              </Link>
            </li>
            <ChevronRightIcon aria-hidden className="size-3 shrink-0" />
            <li>
              <Link href={ROUTES.useCases} className="transition-colors hover:text-text-primary">
                Document guides
              </Link>
            </li>
            <ChevronRightIcon aria-hidden className="size-3 shrink-0" />
            <li aria-current="page" className="text-text-secondary">
              {guide.heading}
            </li>
          </ol>
        </nav>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div className="flex max-w-3xl flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-primary uppercase shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary"></span>
              </span>
              {guide.categoryLabel}
            </span>
            <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-text-primary md:text-5xl lg:text-6xl">
              {guide.heading}
            </h1>
            <p className="text-base leading-relaxed font-medium text-text-secondary md:text-lg">
              {guide.summary}
            </p>

            <nav aria-label="On this page" className="flex flex-wrap gap-2 pt-2">
              {JUMP_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="rounded-full border border-border-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-text-secondary shadow-sm transition-all duration-300 hover:border-brand-primary hover:text-brand-primary hover:shadow-md"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="lg:pt-2">
            <div className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 via-surface-1/60 to-surface-2/40 p-8 shadow-2xl backdrop-blur-xl transition-colors hover:border-brand-primary/40">
              <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-brand-primary/10 blur-[40px] transition-colors group-hover:bg-brand-primary/20" />
              <h3 className="relative z-10 text-lg font-bold text-text-primary">
                Have the document in front of you?
              </h3>
              <p className="relative z-10 text-sm leading-relaxed text-text-secondary">
                Upload it and get the clauses that cost money, each shown next to the passage it
                came from.
              </p>
              <Link
                href={ROUTES.scan}
                className="relative z-10 mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3.5 text-sm font-bold text-canvas shadow-[0_0_20px_-5px_rgba(var(--brand-primary-rgb),0.5)] transition-all hover:scale-[1.02] hover:bg-brand-primary-hover"
              >
                {ctaLabel}
                <ArrowRightIcon aria-hidden className="size-4" />
              </Link>
              <p className="relative z-10 text-center text-xs text-text-tertiary">{reassurance}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
