'use client';

import { useSidebarStore } from '@/shared/state/sidebar-store';
import { cn } from '@/shared/ui/cn';
import { Button, Input, Skeleton } from '@/shared/ui/components';
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
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-border-subtle bg-surface-1/95 px-4 backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
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
            <div className="relative rounded-full bg-surface-2 border border-border-subtle focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
              <SearchIcon
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
                aria-hidden="true"
              />
              <input
                id="search-field"
                className="block w-full border-0 bg-transparent py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:ring-0 outline-none"
                placeholder="Global Command Search..."
                type="search"
                name="search"
              />
            </div>
          </form>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-text-secondary hover:text-text-primary"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-border-subtle"
            aria-hidden="true"
          />

          <div className="flex items-center gap-2">
            <ThemeToggle
              label={themeLabels.label}
              optionLabels={{
                light: themeLabels.light,
                dark: themeLabels.dark,
                system: themeLabels.system,
              }}
            />
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              {sessionChip}
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
