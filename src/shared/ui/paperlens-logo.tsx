'use client';

/**
 * PaperLens — Premium Brand Mark
 * Upgraded with modern, aesthetic gradients and drop shadows for an enterprise feel.
 */

import { cn } from '@/shared/ui/cn';

const MARK_PATH = [
  // Stem: x28–96, y18–182, rx10
  'M38,18 L86,18 Q96,18 96,28 L96,172 Q96,182 86,182 L38,182 Q28,182 28,172 L28,28 Q28,18 38,18 Z',
  // Outer circle bowl: cx96 cy70 r52
  'M148,70 A52,52 0 1,0 44,70 A52,52 0 1,0 148,70 Z',
  // Inner circle (cx120 cy70 r22) — creates donut / lens ring
  'M142,70 A22,22 0 1,0 98,70 A22,22 0 1,0 142,70 Z',
].join(' ');

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { height: number; font: number; gap: number }> = {
  sm: { height: 24, font: 14, gap: 8 },
  md: { height: 32, font: 18, gap: 10 },
  lg: { height: 44, font: 24, gap: 12 },
  xl: { height: 56, font: 30, gap: 15 },
};

const LOCKUP_VIEWBOX = '18 18 130 164';

export function PaperLensMark({ size = 200, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
      className={className}
    >
      <defs>
        <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" /> {/* violet-500 */}
          <stop offset="50%" stopColor="#6366f1" /> {/* indigo-500 */}
          <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
        </linearGradient>
        <filter id="premium-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        fillRule="evenodd"
        fill="url(#premium-gradient)"
        filter="url(#premium-glow)"
        d={MARK_PATH}
      />
    </svg>
  );
}

export function PaperLensLogo({
  size = 'md',
  className,
  showText = true,
}: {
  size?: Size;
  className?: string;
  showText?: boolean;
}) {
  const { height, font, gap } = SIZES[size];
  const width = Math.round(height * (110 / 160));

  return (
    <div className={cn('flex items-center', className)} style={{ gap: showText ? gap : 0 }}>
      <svg
        width={width}
        height={height}
        viewBox={LOCKUP_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
        className="transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id={`logo-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id={`logo-glow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.3" />
          </filter>
        </defs>
        <path
          fillRule="evenodd"
          fill={`url(#logo-gradient-${size})`}
          filter={`url(#logo-glow-${size})`}
          d={MARK_PATH}
        />
      </svg>
      {showText && (
        <span
          className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400"
          style={{
            fontSize: font,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            userSelect: 'none',
            fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
          }}
        >
          PaperLens
        </span>
      )}
    </div>
  );
}
