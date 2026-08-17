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
import { PaperLensLogo } from '@/shared/ui/paperlens-logo';

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
  dashboardHref?: Route;
  isAuthenticated?: boolean;
  labels: SiteHeaderLabels;
  forceSolid?: boolean;
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
  dashboardHref,
  isAuthenticated,
  labels,
  forceSolid = false,
  className,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const isScrolled = useScrolledDown() || forceSolid;

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
    <header className={cn("pointer-events-none sticky top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6", className)}>
      <div
        className={cn(
          'pointer-events-auto mx-auto flex w-[95%] flex-col rounded-full transition-all duration-(--duration-standard) ease-brand md:w-[90%] lg:w-[80%]',
          isScrolled
            ? [
                'border border-border-strong/20 bg-surface-1/85 shadow-lg shadow-black/5',
                'supports-[backdrop-filter]:bg-surface-1/75 supports-[backdrop-filter]:backdrop-blur-2xl',
                'dark:border-white/10 dark:shadow-black/50',
              ]
            : 'border border-transparent bg-transparent',
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

        <div className="mx-auto flex h-16 w-full items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className={cn(
              // `min-h-11` with `inline-flex`: the wordmark is the most-tapped link in the
              // header and its text box is only 20px tall, which is a miss on a phone. The row
              // is 64px and centred, so the larger hit area costs nothing visually.
              'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control',
              'text-xl leading-none font-bold text-text-primary',
              'transition-opacity duration-(--duration-micro) hover:opacity-80',
            )}
          >
            <PaperLensLogo size="md" showText={false} />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text font-extrabold tracking-tight text-transparent dark:from-violet-400 dark:to-indigo-400">
              {productName}
            </span>
          </Link>

          {/*
 `lg` is the breakpoint: pushing the drawer up means tablet users get a mobile
 interaction on a screen with 300px of unused header.
 */}
          <nav aria-label="Primary" className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-9 items-center rounded-control px-3 text-sm font-medium whitespace-nowrap',
                        'transition-colors duration-(--duration-micro) ease-brand',
                        active
                          ? 'bg-brand-primary/10 font-semibold text-brand-primary shadow-sm ring-1 ring-brand-primary/20'
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

          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            <ThemeToggle label={labels.theme} optionLabels={labels.themeOptions} />

            {isAuthenticated && dashboardHref ? (
              <Button
                asChild
                variant="premium"
                size="md"
                className="hidden font-bold whitespace-nowrap shadow-md shadow-brand-primary/20 lg:inline-flex"
              >
                <Link href={dashboardHref}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="tertiary" size="sm" className="hidden lg:inline-flex">
                  <Link href={signInHref}>{labels.signIn}</Link>
                </Button>

                <Button
                  asChild
                  variant="premium"
                  size="md"
                  className="hidden font-bold whitespace-nowrap shadow-md shadow-brand-primary/20 lg:inline-flex"
                >
                  <Link href={ctaHref}>{labels.cta}</Link>
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setOpenedAt(pathname);
              }}
              aria-label={labels.menu}
              aria-expanded={isMenuOpen}
              className={cn(
                // 44px, per WCAG 2.5.8 — and this is the one control a phone user must hit.
                'inline-flex size-11 items-center justify-center rounded-control lg:hidden',
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
          title={labels.menu}
          side="end"
          className="shadow-[0_0_60px_rgba(0,0,0,0.2)]"
          footer={
            <div className="flex w-full flex-col gap-3 pt-2 pb-4">
              {isAuthenticated && dashboardHref ? (
                <Button
                  asChild
                  variant="premium"
                  size="lg"
                  fullWidth
                  className="font-bold shadow-lg shadow-brand-primary/20"
                >
                  <Link href={dashboardHref}>Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="premium"
                    size="lg"
                    fullWidth
                    className="font-bold shadow-lg shadow-brand-primary/20"
                  >
                    <Link href={ctaHref}>{labels.cta}</Link>
                  </Button>
                  <p className="px-2 text-center text-xs font-medium text-text-tertiary">
                    {labels.ctaNote}
                  </p>
                </>
              )}
            </div>
          }
        >
          <nav aria-label="Primary" className="mt-2">
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-base font-bold',
                      'text-text-secondary transition-all duration-300',
                      'hover:bg-surface-2 hover:text-text-primary',
                      'aria-[current=page]:bg-brand-primary/10 aria-[current=page]:text-brand-primary',
                    )}
                  >
                    {item.label}
                    <svg
                      className="size-4 opacity-40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
              {!isAuthenticated && (
                <li className="mt-4 border-t border-border-subtle/50 pt-4">
                  <Link
                    href={signInHref}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-base font-bold text-text-secondary transition-all duration-300 hover:bg-surface-2 hover:text-text-primary"
                  >
                    {labels.signIn}
                    <svg
                      className="size-4 opacity-40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </Drawer>
      </div>
    </header>
  );
}
