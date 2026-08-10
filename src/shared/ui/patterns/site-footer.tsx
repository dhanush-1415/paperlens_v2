import Link from 'next/link';

import type { Route } from 'next';

import { cn } from '@/shared/ui/cn';

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
 className,
}: SiteFooterProps) {
 return (
 <footer className={cn('relative mt-auto overflow-hidden bg-canvas', className)}>
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--brand-primary-rgb),0.03),transparent_60%)] pointer-events-none" />
 <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent opacity-50" />
 
 <div className="mx-auto w-[95%] md:w-[90%] lg:w-[80%] pt-16 pb-12 lg:pt-24 lg:pb-16 relative z-10">
 <div className="grid gap-12 md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] md:gap-8">
 <div className="max-w-xs flex flex-col gap-4">
 <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-text-primary">
 <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-canvas shadow-[0_0_15px_-3px_rgba(var(--brand-primary-rgb),0.4)]">
 {productName[0]}
 </span>
 {productName}
 </Link>
 <p className="text-sm text-text-secondary leading-relaxed">
 {tagline}
 </p>
 </div>

 {groups.map((group) => (
 <nav key={group.title} aria-label={group.title}>
 <h2 className="text-xs font-bold tracking-widest text-text-primary uppercase mb-5">
 {group.title}
 </h2>
 <ul className="flex flex-col gap-3">
 {group.links.map((link) => (
 <li key={`${link.href}${link.label}`}>
 <FooterAnchor link={link} />
 </li>
 ))}
 </ul>
 </nav>
 ))}
 </div>

 <div className="mt-16 flex flex-col gap-6 border-t border-border-strong/30 pt-8 sm:flex-row sm:items-center sm:justify-between">
 <p className="text-xs text-text-tertiary">
 © <span className="tabular">{year}</span> {productName}. All rights reserved.
 </p>
 <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
 {legal.map((link) => (
 <li key={link.href}>
 <Link
 href={link.href}
 className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
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
