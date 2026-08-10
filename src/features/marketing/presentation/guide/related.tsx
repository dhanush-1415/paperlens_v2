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
 <section aria-labelledby="guide-related-heading" className="w-full py-24 relative overflow-hidden bg-surface-1/40 border-b border-border-strong/30">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.03),transparent_70%)] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="flex flex-col gap-4 max-w-2xl mb-12">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">Related guides</span>
 <h2 id="guide-related-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 More {categoryLabel} guides
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
 If the one in your hand is not quite this, it may be one of these.
 </p>
 </div>

 <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {guides.map((guide) => (
 <li key={guide.slug} className="contents">
 <Link
 href={ROUTES.guide(guide.slug) as Route}
 className="group flex flex-col gap-3 p-6 rounded-2xl bg-surface-1/50 border border-border-strong/50 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30 hover:-translate-y-1 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="flex items-start justify-between gap-3 relative z-10">
 <h4 className="text-base font-bold text-text-primary group-hover:text-brand-primary transition-colors">
 {guide.heading}
 </h4>
 <ArrowRightIcon
 aria-hidden
 className="mt-1 size-4 shrink-0 text-text-tertiary transition-transform duration-300 ease-brand group-hover:translate-x-1 group-hover:text-brand-primary"
 />
 </div>
 <p className="text-sm text-text-secondary leading-relaxed relative z-10">
 {guide.description}
 </p>
 </Link>
 </li>
 ))}
 </ul>

 <Link
 href={ROUTES.useCases}
 className="group mt-12 inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-brand-primary-hover transition-colors"
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
