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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-canvas">
      {/* Ambient Background Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.12),transparent_60%)]" />
      <div className="animate-pulse-slow pointer-events-none absolute -top-1/4 -right-1/4 -z-10 h-[800px] w-[800px] rounded-full bg-brand-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-1/4 -left-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-brand-primary/5 blur-[100px]" />

      {/* Large Watermark */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 text-[300px] font-black tracking-tighter text-border-subtle/30 select-none">
        404
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl animate-fade-in-up flex-col px-6 py-12 md:py-24">
        <div className="mb-10 flex justify-center">
          <Link
            href={ROUTES.home}
            className="group inline-flex items-center gap-3 text-2xl font-extrabold text-text-primary"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-canvas shadow-lg transition-transform duration-300 group-hover:scale-105">
              {tenant.productName[0]}
            </span>
            <span className="tracking-tight">{tenant.productName}</span>
          </Link>
        </div>

        <div className="mb-16 flex flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-1.5 text-sm font-bold tracking-widest text-brand-primary uppercase shadow-sm">
            Error 404
          </div>
          <h1 className="bg-gradient-to-br from-text-primary via-text-primary to-text-tertiary bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl">
            We couldn&rsquo;t find that page
          </h1>
          <p className="max-w-xl text-lg leading-relaxed font-medium text-text-secondary md:text-xl">
            The link may be out of date, or the document it pointed to may have been deleted.
            Nothing in your vault has changed.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-1">
          {EXITS.map((exit, index) => (
            <Link
              key={exit.href}
              href={exit.href}
              className="group relative flex items-center gap-6 rounded-3xl border border-border-strong/50 bg-surface-1/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-brand-primary/30 hover:bg-surface-1/80 hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-1 flex-col gap-1.5 text-left">
                <span className="text-lg font-bold text-text-primary transition-colors duration-300 group-hover:text-brand-primary">
                  {exit.title}
                </span>
                <span className="text-sm leading-relaxed font-medium text-text-secondary">
                  {exit.body}
                </span>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border-strong bg-surface-raised text-text-tertiary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-canvas group-hover:shadow-brand-primary/30">
                <ArrowRightIcon
                  aria-hidden
                  className="size-5 -rotate-45 transition-transform duration-300 group-hover:rotate-0"
                />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
