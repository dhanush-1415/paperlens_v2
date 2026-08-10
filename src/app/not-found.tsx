import type { Metadata } from 'next';
import Link from 'next/link';

import { resolveTenant } from '@/config/tenant';
import { serverEnv } from '@/config/env.server';
import { ROUTES } from '@/shared/constants';
import { ArrowRightIcon } from '@/shared/ui';

export const metadata: Metadata = {
 title: 'Page not found',
 robots: { index: false, follow: false },
};

const tenant = resolveTenant(serverEnv.TENANT_ID);

const EXITS = [
 {
 href: ROUTES.scan,
 title: 'Analyze a document',
 body: 'Upload or paste what you have. No account needed to see the first read.',
 },
 {
 href: ROUTES.useCases,
 title: 'Browse document guides',
 body: 'Plain-English explanations of the notices and contracts people are handed most often.',
 },
 {
 href: ROUTES.home,
 title: `Back to ${tenant.productName}`,
 body: 'Start from the beginning.',
 },
] as const;

export default function NotFound() {
 return (
 <div className="relative min-h-[calc(100vh-8rem)] w-full flex flex-col overflow-hidden bg-canvas">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--brand-primary-rgb),0.05),transparent_50%)] pointer-events-none" />
 <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />

 <main className="flex-1 w-[95%] md:w-[90%] lg:w-[80%] mx-auto flex flex-col relative z-10 pt-12 pb-24">
 <div className="mb-16">
 <Link href={ROUTES.home} className="inline-flex items-center gap-2 text-xl font-extrabold text-text-primary">
 <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-canvas shadow-sm">
 {tenant.productName[0]}
 </span>
 {tenant.productName}
 </Link>
 </div>

 <div className="flex flex-col gap-12 max-w-2xl">
 <div className="flex flex-col gap-4">
 <span className="text-sm tracking-widest text-brand-primary font-bold uppercase">
 404 Error
 </span>
 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary">
 We couldn&rsquo;t find that page
 </h1>
 <p className="text-base md:text-lg text-text-secondary leading-relaxed font-medium">
 The link may be out of date, or the document it pointed to may have been deleted.
 Nothing in your vault has changed.
 </p>
 </div>

 <div className="flex flex-col rounded-3xl bg-surface-1/40 border border-border-strong/50 backdrop-blur-md shadow-sm overflow-hidden">
 <ul className="flex flex-col divide-y divide-border-subtle/50">
 {EXITS.map((exit) => (
 <li key={exit.href}>
 <Link
 href={exit.href}
 className="group flex items-center justify-between gap-4 p-6 transition-all duration-300 hover:bg-surface-1/60 hover:bg-brand-primary/5"
 >
 <span className="flex flex-col gap-1.5">
 <span className="text-base font-bold text-text-primary group-hover:text-brand-primary transition-colors">
 {exit.title}
 </span>
 <span className="text-sm text-text-secondary">
 {exit.body}
 </span>
 </span>
 <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised border border-border-strong text-text-tertiary group-hover:scale-110 group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-canvas transition-all shadow-sm">
 <ArrowRightIcon
 aria-hidden
 className="size-4"
 />
 </span>
 </Link>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </main>
 </div>
 );
}
