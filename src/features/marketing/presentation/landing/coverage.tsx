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
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--brand-primary-rgb),0.03),transparent_70%)] pointer-events-none" />
 
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-6 relative z-10 flex flex-col gap-12">
 <div className="flex flex-col gap-3 max-w-2xl">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">Document Recognition</span>
 <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 It has seen your document type before
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed">
 Every one of these has its own guide — what the document is, what it typically costs people, and the deadline hiding in it.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {groups.map((group) => (
 <div 
 key={group.category} 
 className="flex flex-col gap-4 rounded-2xl border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl p-6 transition-all duration-300 hover:border-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/5 group/card relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
 <h3 className="text-sm font-bold text-text-primary tracking-tight relative z-10">
 {group.label}
 </h3>
 <ul className="flex flex-col gap-2 relative z-10">
 {group.guides.slice(0, EXAMPLES_PER_CATEGORY).map((guide) => (
 <li key={guide.slug} className="flex items-center gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-border-strong group-hover/card:bg-brand-primary/60 transition-colors" />
 <Link
 href={ROUTES.guide(guide.slug) as Route}
 className="text-xs font-medium text-text-secondary hover:text-brand-primary transition-colors truncate"
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
 className="group inline-flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-brand-primary w-max transition-colors"
 >
 Browse every document guide
 <svg className="size-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
 </svg>
 </Link>
 </div>
 </section>
 );
}
