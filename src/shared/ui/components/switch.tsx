/**
 * Switch.
 *
 * Same construction as `Checkbox` — a native `<input type="checkbox">` with `appearance-none`
 * and a styled thumb — with `role="switch"` layered on top so assistive technology announces
 * "on/off" rather than "checked/unchecked".
 *
 * ### Switch or checkbox?
 *
 * A switch takes effect the moment it is flipped: dark mode, email notifications, a feature
 * toggle. A checkbox is a value that is submitted later with a form: "I agree", "include
 * archived". Getting this backwards produces a control that looks like it saved and did not,
 * which is worse than an unstyled input.
 *
 * The track is 44×24 with a 20px thumb — the whole control is a 44px-wide target, matching
 * the system's tap-target floor on its long axis.
 */

import type { InputHTMLAttributes } from 'react';

import { cn } from '@/shared/ui/cn';

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'size'>;

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <span className="relative inline-flex shrink-0 items-center">
      <input
        type="checkbox"
        role="switch"
        className={cn(
          'peer h-6 w-11 cursor-pointer appearance-none rounded-full',
          'border border-border-strong bg-surface-2',
          'transition-[background-color,border-color] duration-(--duration-micro) ease-brand',
          'hover:border-brand-primary',
          // `brand-solid` for the track, because the thumb riding on it is `text-on-brand`.
          'checked:border-brand-solid checked:bg-brand-solid',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      {/**
       * The thumb travels 20px — track width 44, minus 2×2px inset, minus the 20px thumb.
       *
       * `start-0.5` + `translate-x-5` rather than animating `start`: a transform is composited
       * and does not trigger layout, so the thumb slides at 60fps on a low-end phone. Moving
       * `start` reflows the span on every frame of the animation.
       */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute start-0.5 size-5 rounded-full bg-text-primary',
          'transition-transform duration-(--duration-micro) ease-brand',
          'peer-checked:translate-x-5 peer-checked:bg-text-on-brand',
          'peer-disabled:opacity-50',
        )}
      />
    </span>
  );
}
