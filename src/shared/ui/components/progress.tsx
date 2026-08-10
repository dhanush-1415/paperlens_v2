/**
 * Progress — a determinate bar.
 *
 * Deliberately determinate-only. An indeterminate progress bar is a spinner that takes up a
 * whole row: it says "waiting" while implying "measurable", which is the worst of both. When
 * the length of a wait is unknown, use `Skeleton` (the shape is known) or `Spinner` (it is
 * not).
 *
 * Built from two spans rather than `<progress>`: the native element is close to unstylable
 * across browsers — Safari, Firefox and Chrome each expose different pseudo-elements — and
 * `role="progressbar"` with the three `aria-value*` attributes is exactly what the native
 * element maps to anyway, so nothing is lost to assistive technology.
 */

import { cn } from '@/shared/ui/cn';

import { TONE_SOLID, type Tone } from '../tone';

export interface ProgressProps {
 /** Current value, clamped into `[0, max]`. */
 value: number;
 max?: number;
 /**
 * Accessible name — "Documents analysed this month", "Upload progress".
 *
 * Required. A bar announced only as "45%" tells a screen-reader user a number with no
 * subject, which is one of the most common findings in an accessibility audit.
 */
 label: string;
 /**
 * Human-readable value, replacing the default percentage announcement: "3 of 10 documents".
 * Percentages are meaningless for quota bars, which is where this component is mostly used.
 */
 valueText?: string;
 tone?: Tone;
 size?: 'sm' | 'md';
 className?: string;
}

export function Progress({
 value,
 max = 100,
 label,
 valueText,
 tone = 'brand',
 size = 'md',
 className,
}: ProgressProps) {
 // Clamped rather than trusted. A quota bar fed a server value of 11/10 would otherwise
 // render a fill wider than its track and push the layout sideways.
 const safeMax = max > 0 ? max : 1;
 const clamped = Math.min(Math.max(value, 0), safeMax);
 const percent = (clamped / safeMax) * 100;

 return (
 <div
 role="progressbar"
 aria-label={label}
 aria-valuemin={0}
 aria-valuemax={safeMax}
 aria-valuenow={clamped}
 aria-valuetext={valueText}
 className={cn(
 'w-full overflow-hidden rounded-full bg-surface-2',
 size === 'sm' ? 'h-1' : 'h-2',
 className,
 )}
 >
 <span
 // Inline width is the one sanctioned inline style in the design system: the value is
 // data, so it cannot be a class without generating a utility per percentage point.
 style={{ width: `${percent}%` }}
 className={cn(
 'block h-full rounded-full',
 'transition-[width] duration-(--duration-standard) ease-brand',
 'motion-reduce:transition-none',
 TONE_SOLID[tone],
 )}
 />
 </div>
 );
}
