/**
 * Form label.
 *
 * Always a real `<label htmlFor>`, never a styled `<span>` next to an input. The association
 * is what makes the label clickable, what a screen reader announces when focus enters the
 * control, and what a testing library's `getByLabelText` finds — three separate reasons that
 * all disappear together the moment someone reaches for a `<div>`.
 */

import type { LabelHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Appends a required marker.
   *
   * The asterisk is `aria-hidden` and the accessible name is carried by the control's own
   * `required` attribute instead. A screen reader that read the glyph would announce
   * "Email star", and one that also read the attribute would announce required twice.
   */
  required?: boolean;
  children: ReactNode;
}

export function Label({ className, required = false, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-1 text-2xs font-medium text-text-secondary select-none',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden className="text-risk-critical">
          *
        </span>
      ) : null}
    </label>
  );
}
