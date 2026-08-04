'use client';

/**
 * The theme control.
 *
 * A single cycling button rather than three radio buttons or a dropdown: it lives in the
 * navbar, where horizontal space is contested, and cycling light → dark → system keeps
 * `'system'` reachable without opening a menu.
 *
 * ### Hydration
 *
 * The icon depends on `resolved`, which the server cannot know. Rendering the real icon on
 * the first client pass would therefore disagree with the server's HTML. Instead the button
 * renders a fixed placeholder until `isHydrated`, then swaps — so the markup matches on both
 * sides, the control is the right size from the first paint (no layout shift), and it is
 * `disabled` for the few milliseconds when clicking it would act on a state React has not
 * read yet.
 *
 * The label is passed in rather than read from a translator hook, because this component is
 * used in both server-rendered and client-rendered shells and the translator is per-request
 * on one and per-tree on the other.
 */

import { cn } from '@/shared/ui/cn';

import { MoonIcon, SunIcon, SystemIcon } from '../icons';
import { useTheme } from './theme-provider';
import type { ThemePreference } from './types';

const ICONS: Record<ThemePreference, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
};

export interface ThemeToggleProps {
  /**
   * Accessible name, e.g. `t('theme.label')`.
   *
   * Announces the control, not its state — the state is exposed through `aria-pressed`-free
   * live text below, because a three-state control is not a toggle button in the ARIA sense
   * and mislabelling it as one makes screen readers announce "pressed" for `'system'`.
   */
  label: string;
  /** Localized names for each preference, e.g. `{ light: t('theme.light'), … }`. */
  optionLabels: Record<ThemePreference, string>;
  className?: string;
}

export function ThemeToggle({ label, optionLabels, className }: ThemeToggleProps) {
  const { preference, isHydrated, toggle } = useTheme();
  const CurrentIcon = ICONS[preference];

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!isHydrated}
      aria-label={`${label}: ${optionLabels[preference]}`}
      className={cn(
        // 44px minimum tap target (WCAG 2.5.8), even though the icon is 20px.
        'inline-flex size-11 items-center justify-center rounded-control',
        'text-text-secondary transition-colors duration-150 ease-brand',
        'hover:bg-surface-2 hover:text-text-primary',
        'disabled:pointer-events-none disabled:opacity-60',
        className,
      )}
    >
      <CurrentIcon className="size-5" />
      {/*
        The state, announced but not drawn. Screen-reader users get "Theme: Dark" from the
        label; this live region is what tells them the click did something, since the only
        visible change is an icon swap.
      */}
      <span aria-live="polite" className="sr-only">
        {isHydrated ? optionLabels[preference] : ''}
      </span>
    </button>
  );
}
