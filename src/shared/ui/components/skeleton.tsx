/**
 * Skeleton — the system's default loading affordance.
 *
 * Preferred over a spinner nearly everywhere, because a skeleton tells the user what is
 * arriving and roughly how much of it, which turns a wait into a preview. A spinner tells
 * them only that something is happening, and the same wait feels longer.
 *
 * These are what `loading.tsx` and every `<Suspense fallback>` render. Match the real
 * content's shape closely: a skeleton that is the wrong height causes a layout shift the
 * moment the data lands, which is worse than no skeleton at all.
 */

import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** `'text'` gets a text-line height and a pill radius; `'block'` fills its container. */
  variant?: 'text' | 'block' | 'circle';
}

export function Skeleton({ className, variant = 'block', ...props }: SkeletonProps) {
  return (
    <div
      /**
       * Hidden from assistive technology entirely.
       *
       * The container that owns the loading state announces it — a `<Suspense>` boundary's
       * region, or an `aria-busy` on the panel. Announcing each placeholder would read out
       * "blank blank blank" and say nothing about what is loading.
       */
      aria-hidden
      className={cn(
        'skeleton-premium',
        // The shimmer is the only place a skeleton differs under reduced motion: a static grey
        // block still communicates "not here yet", so it degrades cleanly.
        'motion-reduce:after:animate-none',
        variant === 'text' ? 'h-4 rounded-full' : undefined,
        variant === 'block' ? 'h-full w-full rounded-control' : undefined,
        variant === 'circle' ? 'aspect-square rounded-full' : undefined,
        className,
      )}
      {...props}
    />
  );
}
