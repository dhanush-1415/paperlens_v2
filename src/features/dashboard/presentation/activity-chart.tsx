import { Text } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';

export interface ActivityChartProps {
  data: { label: string; value: number }[];
  className?: string;
  color?: 'primary' | 'critical' | 'safe';
}

export function ActivityChart({ data, className, color = 'primary' }: ActivityChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  
  const colorMap = {
    primary: {
      bar: 'bg-brand-primary',
      hover: 'group-hover:bg-brand-secondary',
      text: 'text-brand-primary'
    },
    critical: {
      bar: 'bg-critical',
      hover: 'group-hover:bg-critical-fg',
      text: 'text-critical'
    },
    safe: {
      bar: 'bg-safe',
      hover: 'group-hover:bg-safe-fg',
      text: 'text-safe'
    }
  };

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 relative group/chart">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-border-subtle/50 pb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-full h-px bg-border-subtle/40 border-dashed" />
          ))}
        </div>

        {data.map((item, i) => {
          const heightPct = Math.max((item.value / max) * 100, 4); // min 4% height so 0 isn't invisible
          return (
            <div key={i} className="relative flex flex-col items-center justify-end h-full w-full group cursor-pointer z-10 pb-6">
              {/* Tooltip */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-1 shadow-lg border border-border-subtle rounded-lg py-1 px-2.5 z-20 pointer-events-none transform -translate-y-2 group-hover:translate-y-0 duration-200">
                <Text size="sm" className={cn("font-bold", colorMap[color].text)}>{item.value}</Text>
              </div>
              
              {/* Bar Container for hover hit-area */}
              <div className="h-full w-full flex items-end justify-center pt-8">
                {/* The actual Bar */}
                <div 
                  className={cn(
                    "w-full max-w-[32px] rounded-t-md transition-all duration-500 ease-out",
                    colorMap[color].bar,
                    colorMap[color].hover,
                    "opacity-70 group-hover:opacity-100"
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              
              {/* X-Axis Label */}
              <div className="absolute bottom-0 w-full text-center mt-2">
                <Text size="xs" tone="tertiary" className="font-medium group-hover:text-text-secondary transition-colors truncate">
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
