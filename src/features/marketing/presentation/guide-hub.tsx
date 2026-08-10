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
 className="group flex flex-col gap-3 p-6 rounded-2xl bg-surface-1/40 border border-border-strong/50 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30 hover:-translate-y-1 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="flex items-start justify-between gap-3 relative z-10">
 <h3 className="text-base font-bold text-text-primary group-hover:text-brand-primary transition-colors">
 {heading}
 </h3>
 <ArrowRightIcon
 aria-hidden
 className="mt-1 size-4 shrink-0 text-text-tertiary transition-transform duration-300 ease-brand group-hover:translate-x-1 group-hover:text-brand-primary"
 />
 </div>
 <p className="text-sm text-text-secondary leading-relaxed relative z-10">
 {description}
 </p>
 </Link>
 );
}

export function GuideHub({ groups, eyebrow, heading, lede }: GuideHubProps) {
 return (
 <>
 <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-border-strong/30 bg-surface-1/20">
 <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--border-strong-rgb),0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
 <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10 flex flex-col gap-6">
 <div className="flex flex-col gap-6 max-w-3xl">
 <span className="inline-flex w-fit items-center gap-2 border border-brand-primary/20 bg-brand-primary/5 rounded-full px-4 py-1.5 text-xs font-bold text-brand-primary tracking-widest uppercase shadow-sm">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
 </span>
 {eyebrow}
 </span>
 <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
 {heading}
 </h1>
 <p className="text-base md:text-lg text-text-secondary leading-relaxed font-medium">
 {lede}
 </p>
 </div>

 {groups.length > 1 ? (
 <nav aria-label="Guide categories" className="mt-8 flex flex-wrap gap-2">
 {groups.map((group) => (
 <a
 key={group.category}
 href={`#${group.category}`}
 className="rounded-full border border-border-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-text-secondary transition-all duration-300 hover:border-brand-primary hover:text-brand-primary shadow-sm hover:shadow-md"
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
 <section key={group.category} className="w-full py-16 md:py-24 border-b border-border-strong/30 last:border-0 relative">
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto">
 <h2 id={group.category} className="text-xs font-bold tracking-widest text-text-primary uppercase mb-8 scroll-mt-32">
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
