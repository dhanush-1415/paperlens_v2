import { Text } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';

export interface ActivityChartProps {
  data: { label: string; value: number }[];
  className?: string;
  color?: 'primary' | 'critical' | 'safe';
}

export function ActivityChart({ data, className, color = 'primary' }: ActivityChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  const colorMap = {
    primary: {
      bar: 'bg-brand-primary',
      hover: 'group-hover:bg-brand-secondary',
      text: 'text-brand-primary',
    },
    critical: {
      bar: 'bg-critical',
      hover: 'group-hover:bg-critical-fg',
      text: 'text-critical',
    },
    safe: {
      bar: 'bg-safe',
      hover: 'group-hover:bg-safe-fg',
      text: 'text-safe',
    },
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      <div className="group/chart relative flex flex-1 items-end justify-between gap-2 sm:gap-4">
        {/* Horizontal grid lines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between border-b border-border-subtle/50 pb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-px w-full border-dashed bg-border-subtle/40" />
          ))}
        </div>

        {data.map((item, i) => {
          const heightPct = Math.max((item.value / max) * 100, 4); // min 4% height so 0 isn't invisible
          return (
            <div
              key={i}
              className="group relative z-10 flex h-full w-full cursor-pointer flex-col items-center justify-end pb-6"
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-10 z-20 -translate-y-2 transform rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-1 opacity-0 shadow-lg transition-opacity duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <Text size="sm" className={cn('font-bold', colorMap[color].text)}>
                  {item.value}
                </Text>
              </div>

              {/* Bar Container for hover hit-area */}
              <div className="flex h-full w-full items-end justify-center pt-8">
                {/* The actual Bar */}
                <div
                  className={cn(
                    'w-full max-w-[32px] rounded-t-md transition-all duration-500 ease-out',
                    colorMap[color].bar,
                    colorMap[color].hover,
                    'opacity-70 group-hover:opacity-100',
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              {/* X-Axis Label */}
              <div className="absolute bottom-0 mt-2 w-full text-center">
                <Text
                  size="xs"
                  tone="tertiary"
                  className="truncate font-medium transition-colors group-hover:text-text-secondary"
                >
                  {item.label}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
