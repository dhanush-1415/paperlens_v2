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
 <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-canvas">
 {/* Ambient Background Gradients */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.12),transparent_60%)] pointer-events-none" />
 <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
 <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

 {/* Large Watermark */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[300px] font-black tracking-tighter text-border-subtle/30 select-none pointer-events-none -z-10">
 404
 </div>

 <main className="flex flex-col relative z-10 w-full max-w-3xl px-6 py-12 md:py-24 mx-auto animate-fade-in-up">
 <div className="flex justify-center mb-10">
 <Link href={ROUTES.home} className="inline-flex items-center gap-3 text-2xl font-extrabold text-text-primary group">
 <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-canvas shadow-lg group-hover:scale-105 transition-transform duration-300">
 {tenant.productName[0]}
 </span>
 <span className="tracking-tight">{tenant.productName}</span>
 </Link>
 </div>

 <div className="flex flex-col items-center text-center gap-6 mb-16">
 <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-bold tracking-widest uppercase shadow-sm">
 Error 404
 </div>
 <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-text-primary via-text-primary to-text-tertiary">
 We couldn&rsquo;t find that page
 </h1>
 <p className="text-lg md:text-xl text-text-secondary leading-relaxed font-medium max-w-xl">
 The link may be out of date, or the document it pointed to may have been deleted.
 Nothing in your vault has changed.
 </p>
 </div>

 <div className="grid gap-4 sm:grid-cols-1 w-full max-w-2xl mx-auto">
 {EXITS.map((exit, index) => (
 <Link
 key={exit.href}
 href={exit.href}
 className="group relative flex items-center gap-6 p-6 rounded-3xl bg-surface-1/40 border border-border-strong/50 backdrop-blur-xl shadow-sm hover:shadow-md hover:bg-surface-1/80 hover:border-brand-primary/30 transition-all duration-300"
 style={{ animationDelay: `${index * 100}ms` }}
 >
 <div className="flex-1 flex flex-col gap-1.5 text-left">
 <span className="text-lg font-bold text-text-primary group-hover:text-brand-primary transition-colors duration-300">
 {exit.title}
 </span>
 <span className="text-sm text-text-secondary leading-relaxed font-medium">
 {exit.body}
 </span>
 </div>
 <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-raised border border-border-strong text-text-tertiary group-hover:scale-110 group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-canvas transition-all duration-300 shadow-sm group-hover:shadow-brand-primary/30">
 <ArrowRightIcon aria-hidden className="size-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
 </span>
 </Link>
 ))}
 </div>
 </main>
 </div>
 );
}
