/**
 * Alert — an inline, persistent message attached to the content it concerns.
 *
 * Not a toast. A toast is transient and belongs to an action the user just took; an alert is
 * part of the page and stays until the condition does. Using a toast for something the user
 * must read is a bug that only shows up for people who read slowly.
 *
 * The icon is chosen from the tone rather than accepted as a prop, because the icon *is* the
 * non-colour half of the severity signal and letting a call site pass a different one is
 * exactly how a "critical" alert ends up wearing a tick.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

import { TONE_ICON, TONE_SOFT, type Tone } from '../tone';

const alertVariants = cva(['flex gap-3 rounded-card border p-4'], {
  variants: {
    tone: TONE_SOFT,
  },
  defaultVariants: {
    tone: 'info',
  },
});

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof alertVariants> {
  /** Short and specific. "Upload failed", not "Error". */
  title?: ReactNode;
  children: ReactNode;
  /** Buttons or a link, rendered under the body. Keep it to one or two. */
  actions?: ReactNode;
}

export function Alert({ className, tone, title, children, actions, ...props }: AlertProps) {
  const resolvedTone = (tone ?? 'info') as Tone;
  const Icon = TONE_ICON[resolvedTone];

  return (
    <div
      /**
       * `role="alert"` only for `critical`.
       *
       * `role="alert"` is an assertive live region: it interrupts whatever a screen reader is
       * currently saying. That is right for a failure the user needs to know about now, and
       * wrong for the four informational alerts on a settings page, which would talk over
       * each other on load. Everything else is announced when the user reaches it.
       */
      role={resolvedTone === 'critical' ? 'alert' : undefined}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {/* Decorative: the tone is already carried by the title text and by `role`. Announcing
 the icon as well would read "warning warning" on every critical alert. */}
      <Icon aria-hidden className="mt-0.5 size-5" />

      <div className="flex min-w-0 flex-col gap-1">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        {/* `text-text-secondary` deliberately does *not* override the tone's foreground on
 risk alerts — the body inherits the tone colour, which is what makes the whole
 block read as one message rather than a coloured icon next to grey text. */}
        <div className="text-2xs leading-editorial opacity-90">{children}</div>
        {actions ? <div className="mt-2 flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export { alertVariants };
