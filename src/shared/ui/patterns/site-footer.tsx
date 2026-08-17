import Link from 'next/link';

import type { Route } from 'next';

import { cn } from '@/shared/ui/cn';
import { PaperLensLogo } from '@/shared/ui/paperlens-logo';

export interface FooterLink {
  readonly href: Route;
  readonly label: string;
  readonly external?: boolean;
}

export interface FooterGroup {
  readonly title: string;
  readonly links: readonly FooterLink[];
}

export interface SiteFooterProps {
  productName: string;
  tagline: string;
  groups: readonly FooterGroup[];
  legal: readonly FooterLink[];
  year: number;
  ctaHref?: Route;
  ctaLabel?: string;
  className?: string;
}

function FooterAnchor({ link }: { link: FooterLink }) {
  const className = cn(
    'inline-flex min-h-11 items-center py-1 text-sm md:min-h-0 md:py-0',
    'text-text-secondary transition-all duration-300 ease-brand',
    'hover:translate-x-1 hover:text-text-primary',
  );

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function SiteFooter({
  productName,
  tagline,
  groups,
  legal,
  year,
  ctaHref,
  ctaLabel,
  className,
}: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'relative mt-auto overflow-hidden border-t border-border-strong/30 bg-surface-1',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.08),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-[95%] max-w-7xl pt-16 pb-16 lg:pt-24 lg:pb-24">
        <div className="grid gap-16 md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] md:gap-8">
          <div className="flex max-w-xs flex-col items-start gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <PaperLensLogo size="lg" />
            </Link>
            <p className="pr-4 text-sm leading-relaxed text-text-secondary">{tagline}</p>
            {ctaHref && ctaLabel && (
              <div className="mt-2">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-tertiary bg-[length:200%_auto] px-6 py-3 text-sm font-bold whitespace-nowrap text-text-on-brand shadow-xl shadow-brand-primary/30 transition-all duration-500 ease-out hover:scale-105 hover:bg-[position:right_center] active:scale-95"
                >
                  {ctaLabel}
                </Link>
              </div>
            )}
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-6 text-[11px] font-bold tracking-[0.2em] text-text-primary uppercase">
                {group.title}
              </h2>
              <ul className="flex flex-col gap-4">
                {group.links.map((link) => (
                  <li key={`${link.href}${link.label}`}>
                    <FooterAnchor link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-border-strong/30 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-text-tertiary">
            © <span className="tabular">{year}</span> {productName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {legal.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs font-medium text-text-tertiary transition-colors hover:text-brand-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
