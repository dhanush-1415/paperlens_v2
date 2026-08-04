/**
 * Select — the native one.
 *
 * There is no custom listbox in this design system, and that is a decision rather than an
 * omission. A scripted dropdown owes the user typeahead, wrap-around arrow navigation,
 * Home/End, Escape, focus return, scroll-into-view, viewport collision handling, and a
 * mobile rendering that is not a floating div over a virtual keyboard. Every one of those is
 * free here, and on a phone the native control renders as the platform's own picker — which
 * is both faster and more familiar than anything we would build.
 *
 * The one thing native cannot do is render rich option content (an icon, a badge, two lines).
 * When a screen genuinely needs that, it gets a purpose-built combobox — a `'use client'`
 * component with its own tests — and not a general-purpose replacement for this.
 */

import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

import { ChevronDownIcon } from '../icons';
import { controlVariants, type ControlVariantProps } from './control';

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    ControlVariantProps {}

export function Select({ className, size, children, ...props }: SelectProps) {
  return (
    <span className="relative flex w-full items-center">
      <select
        className={cn(
          controlVariants({ size }),
          // `appearance-none` removes the platform chevron so ours can take its place; the
          // trailing padding reserves the space it occupies.
          'cursor-pointer appearance-none pe-9',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute end-3 text-text-tertiary" />
    </span>
  );
}
