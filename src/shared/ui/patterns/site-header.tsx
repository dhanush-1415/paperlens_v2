'use client';

/**
 * The public site's masthead.
 *
 * ### Why this is a pattern and not a component
 *
 * It knows there is a product with a name, a sign-in, and exactly one primary action. That is
 * product knowledge, so it lives here rather than in `../components`. It is still generic over
 * *which* links it shows — those arrive as data — because the day a page needs a reduced
 * header (checkout, a focused reading view) the answer must be "pass fewer items", not "fork
 * the component".
 *
 * ### Why it is a Client Component when most of it is static
 *
 * Three pieces genuinely need the browser: the mobile drawer's open state, the active-link
 * highlight (which depends on the current URL, and a layout does not re-render on client
 * navigation so the server cannot supply it), and the border that appears once the page has
 * scrolled. Splitting those into three islands around a server-rendered shell would mean four
 * modules and a prop-drilling problem to save perhaps 2KB on a component that is on every
 * page and therefore cached after the first one.
 *
 * Every prop is serializable data — strings and arrays of strings. Nothing is a function, and
 * that is not an accident: a callback prop passed from a Server Component is a build error
 * with a message that does not name the prop, and the fix is always "make it data".
 *
 * ### The scroll state
 *
 * `useScrolledDown` reads one shared passive listener. React re-renders exactly twice per page
 * — once when you leave the top, once when you return — because an unchanged snapshot bails
 * out. The tidier-looking alternative, an `IntersectionObserver` on a sentinel element, needs
 * the sentinel to live outside the sticky element to work, which means this component would
 * have to reach into its parent's markup. A listener that costs nothing is better than an
 * abstraction that leaks.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Route } from 'next';

import { cn } from '@/shared/ui/cn';

import { Button } from '../components/button';
import { Drawer } from '../components/drawer';
import { MenuIcon } from '../icons';
import { useScrolledDown } from '../primitives/use-scroll';
import { ThemeToggle } from '../theme/theme-toggle';
import type { ThemePreference } from '../theme/types';

export interface SiteNavItem {
 readonly href: Route;
 readonly label: string;
}

export interface SiteHeaderLabels {
 /** Accessible name for the hamburger. */
 readonly menu: string;
 readonly closeMenu: string;
 readonly signIn: string;
 /** The primary action. One per viewport, everywhere in this product. */
 readonly cta: string;
 readonly theme: string;
 readonly themeOptions: Record<ThemePreference, string>;
 /** Reassurance under the drawer's CTA. Kept short enough for a 390px screen. */
 readonly ctaNote: string;
}

export interface SiteHeaderProps {
 productName: string;
 items: readonly SiteNavItem[];
 signInHref: Route;
 ctaHref: Route;
 labels: SiteHeaderLabels;
 className?: string;
}

/**
 * True when `pathname` is inside `href`.
 *
 * Prefix matching, so `/for/irs-cp2000-notice` highlights the "Document guides" link. The
 * `href === '/'` case is special because every path is prefixed by `/` and the home link
 * would otherwise be permanently active.
 */
function isActive(pathname: string, href: string): boolean {
 if (href === '/') return pathname === '/';
 return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
 productName,
 items,
 signInHref,
 ctaHref,
 labels,
 className,
}: SiteHeaderProps) {
 const pathname = usePathname();
 const isScrolled = useScrolledDown();

 /**
 * The drawer's state is *which route it was opened on*, not a boolean.
 *
 * A plain boolean leaves the drawer standing open after a link inside it navigates: the new
 * page renders behind the panel, and the user's only way out is a close button they were
 * not looking for. The usual fix is an effect that resets the boolean when the pathname
 * changes — a render, then a second render to undo it, and a rule against it.
 *
 * Storing the pathname instead makes closing-on-navigation fall out of the definition of
 * "open". It costs nothing extra, and it covers the cases an `onClick` on each link would
 * miss: the back button, and whatever link someone adds to the drawer next year.
 */
 const [openedAt, setOpenedAt] = useState<string | null>(null);
 const isMenuOpen = openedAt === pathname;

 return (
 <header
 className={cn(
 'sticky top-0 z-40',
 /**
 * Translucent, and *only* translucent once scrolled.
 *
 * At the top of the page the header sits on the canvas and needs no separation, so
 * it stays fully transparent — the hero reads as one piece. The moment content
 * passes underneath, the blur and the hairline appear. Doing this with
 * `backdrop-blur` rather than an opaque fill is what keeps the brand gradient in a
 * hero visible through the bar instead of chopping it off at 64px.
 *
 * `supports-[backdrop-filter]` guards the transparency: a browser without backdrop
 * filters would render text over whatever is behind it. There, the bar is solid.
 */
 'transition-[background-color,border-color,backdrop-filter] duration-(--duration-standard) ease-brand',
 isScrolled
 ? [
 'border-b border-border-subtle bg-canvas/95',
 'supports-[backdrop-filter]:bg-canvas/70 supports-[backdrop-filter]:backdrop-blur-xl',
 ]
 : 'border-b border-transparent bg-transparent',
 className,
 )}
 >
 {/*
 The skip link. First focusable element in the document, invisible until focused.
 WCAG 2.4.1: without it a keyboard user tabs through every nav item on every page
 before reaching the content. `#main` is provided by the layout, not by this component.
 */}
 <a
 href="#main"
 className={cn(
 'sr-only focus-visible:not-sr-only',
 'focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50',
 'focus-visible:rounded-control focus-visible:bg-surface-raised focus-visible:px-4 focus-visible:py-2',
 'focus-visible:text-sm focus-visible:text-text-primary focus-visible:shadow-card',
 )}
 >
 Skip to content
 </a>

 <div className="mx-auto flex h-16 w-[95%] md:w-[90%] lg:w-[80%] items-center gap-6 px-5 sm:px-6 lg:px-8">
 <Link
 href="/"
 className={cn(
 // `min-h-11` with `inline-flex`: the wordmark is the most-tapped link in the
 // header and its text box is only 20px tall, which is a miss on a phone. The row
 // is 64px and centred, so the larger hit area costs nothing visually.
 'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control',
 ' text-xl font-bold leading-none text-text-primary',
 'transition-opacity duration-(--duration-micro) hover:opacity-80',
 )}
 >
 <svg className="size-6 text-brand-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
   <circle cx="12" cy="13" r="4" className="stroke-brand-secondary fill-canvas/80" strokeWidth={2} />
 </svg>
 <span>{productName}</span>
 </Link>

 {/*
 `md` is the breakpoint, not `lg`: at 768px there is room for five items at this
 size, and pushing the drawer up to 1024px means tablet users get a mobile
 interaction on a screen with 300px of unused header.
 */}
 <nav aria-label="Primary" className="hidden min-w-0 flex-1 md:block">
 <ul className="flex items-center gap-1">
 {items.map((item) => {
 const active = isActive(pathname, item.href);
 return (
 <li key={item.href}>
 <Link
 href={item.href}
 aria-current={active ? 'page' : undefined}
 className={cn(
 'inline-flex h-9 items-center rounded-control px-3 text-sm',
 'transition-colors duration-(--duration-micro) ease-brand',
 active
 ? 'text-text-primary'
 : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
 )}
 >
 {item.label}
 </Link>
 </li>
 );
 })}
 </ul>
 </nav>

 <div className="ml-auto flex items-center gap-1 md:gap-2">
 <ThemeToggle label={labels.theme} optionLabels={labels.themeOptions} />

 <Button asChild variant="tertiary" size="sm" className="hidden sm:inline-flex">
 <Link href={signInHref}>{labels.signIn}</Link>
 </Button>

 <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
 <Link href={ctaHref}>{labels.cta}</Link>
 </Button>

 <button
 type="button"
 onClick={() => {
 setOpenedAt(pathname);
 }}
 aria-label={labels.menu}
 aria-expanded={isMenuOpen}
 className={cn(
 // 44px, per WCAG 2.5.8 — and this is the one control a phone user must hit.
 'inline-flex size-11 items-center justify-center rounded-control md:hidden',
 'text-text-secondary transition-colors duration-(--duration-micro)',
 'hover:bg-surface-2 hover:text-text-primary',
 )}
 >
 <MenuIcon className="size-5" />
 </button>
 </div>
 </div>

 <Drawer
 open={isMenuOpen}
 onClose={() => {
 setOpenedAt(null);
 }}
 title={productName}
 side="end"
 footer={
 /*
 * The CTA lives in the footer of the drawer, in the bottom third of the screen —
 * where a thumb actually reaches. A primary action pinned to the top of a phone
 * drawer is a design that was only ever tested on a desktop.
 */
 <div className="flex flex-col gap-2">
 <Button asChild variant="primary" size="lg" fullWidth>
 <Link href={ctaHref}>{labels.cta}</Link>
 </Button>
 <p className="text-center text-2xs text-text-tertiary">{labels.ctaNote}</p>
 </div>
 }
 >
 <nav aria-label="Primary">
 <ul className="flex flex-col">
 {items.map((item) => (
 <li key={item.href}>
 <Link
 href={item.href}
 aria-current={isActive(pathname, item.href) ? 'page' : undefined}
 className={cn(
 'flex min-h-11 items-center rounded-control px-3 text-base',
 'text-text-secondary transition-colors duration-(--duration-micro)',
 'hover:bg-surface-2 hover:text-text-primary',
 'aria-[current=page]:text-text-primary',
 )}
 >
 {item.label}
 </Link>
 </li>
 ))}
 <li>
 <Link
 href={signInHref}
 className="flex min-h-11 items-center rounded-control px-3 text-base text-text-secondary hover:bg-surface-2 hover:text-text-primary"
 >
 {labels.signIn}
 </Link>
 </li>
 </ul>
 </nav>
 </Drawer>
 </header>
 );
}
