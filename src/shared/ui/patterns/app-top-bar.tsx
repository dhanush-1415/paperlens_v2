'use client';

import { useSidebarStore } from '@/shared/state/sidebar-store';
import { Skeleton } from '@/shared/ui/components';
import { MenuIcon, SearchIcon } from '@/shared/ui/icons';
import { BellIcon } from '@/shared/ui/icons/dashboard-icons';
import { ThemeToggle } from '@/shared/ui/theme';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export interface AppTopBarProps {
  /**
   * A server component or client element that renders the authenticated
   * user's profile dropdown/session chip.
   */
  sessionChip: ReactNode;

  /**
   * Transformed translator object for the theme toggle labels.
   */
  themeLabels: {
    label: string;
    light: string;
    dark: string;
    system: string;
  };
}

export function AppTopBar({ sessionChip, themeLabels }: AppTopBarProps) {
  const openMobile = useSidebarStore((s) => s.openMobile);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border-subtle bg-surface-1/95 px-4 backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile hamburger menu */}
      <button
        type="button"
        onClick={openMobile}
        className="-m-2.5 p-2.5 text-text-secondary hover:text-text-primary md:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center justify-start lg:justify-center">
          <form className="relative w-full max-w-lg" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative rounded-full border border-border-subtle bg-surface-2 transition-all focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                aria-hidden="true"
              />
              <input
                id="search-field"
                className="block w-full border-0 bg-transparent py-2.5 pr-4 pl-11 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:ring-0"
                placeholder="Global Command Search..."
                type="search"
                name="search"
              />
            </div>
          </form>
        </div>
        <div className="flex items-center gap-x-3 lg:gap-x-4">
          <ThemeToggle
            label={themeLabels.label}
            optionLabels={{
              light: themeLabels.light,
              dark: themeLabels.dark,
              system: themeLabels.system,
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong/40 bg-surface-1 text-text-secondary shadow-sm transition-all hover:bg-surface-2 hover:text-text-primary hover:shadow-md"
          />

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-strong/40 bg-surface-1 text-text-secondary shadow-sm transition-all hover:bg-surface-2 hover:text-text-primary hover:shadow-md"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            {/* The blue dot */}
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-brand-primary ring-2 ring-surface-1" />
          </button>

          <Suspense fallback={<Skeleton className="h-10 w-32 rounded-full" />}>
            {sessionChip}
          </Suspense>
        </div>
      </div>
    </header>
  );
}
