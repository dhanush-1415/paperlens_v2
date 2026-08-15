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
        'hover:text-text-primary hover:translate-x-1',
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
        <footer className={cn('relative mt-auto overflow-hidden bg-surface-1 border-t border-border-strong/30', className)}>
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />
            <div className="absolute top-0 inset-x-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.08),transparent_70%)] pointer-events-none" />

            <div className="mx-auto w-[95%] max-w-7xl pt-16 pb-16 lg:pt-24 lg:pb-24 relative z-10">
                <div className="grid gap-16 md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] md:gap-8">
                    <div className="max-w-xs flex flex-col gap-6 items-start">
                        <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-90">
                            <PaperLensLogo size="lg" />
                        </Link>
                        <p className="text-sm text-text-secondary leading-relaxed pr-4">
                            {tagline}
                        </p>
                        {ctaHref && ctaLabel && (
                            <div className="mt-2">
                                <Link 
                                    href={ctaHref} 
                                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-tertiary bg-[length:200%_auto] px-6 py-3 text-sm font-bold text-text-on-brand shadow-xl shadow-brand-primary/30 transition-all duration-500 ease-out hover:bg-[position:right_center] hover:scale-105 active:scale-95 whitespace-nowrap"
                                >
                                    {ctaLabel}
                                </Link>
                            </div>
                        )}
                    </div>

                    {groups.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h2 className="text-[11px] font-bold tracking-[0.2em] text-text-primary uppercase mb-6">
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
                    <p className="text-xs text-text-tertiary font-medium">
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
