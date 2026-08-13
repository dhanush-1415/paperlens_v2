'use client';

import { useState } from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import { Text } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';

export function SmartActionPlan({ actions }: { actions: readonly string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 relative z-10 bg-surface-2 p-5 rounded-2xl border border-border-subtle shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
          <CheckCircle2 className="h-3.5 w-3.5 text-brand-primary" />
        </div>
        <p className="text-sm font-semibold text-text-primary leading-none">Smart Action Plan</p>
      </div>
      <ul className="flex flex-col gap-2">
        {actions.map((action, idx) => {
          const isChecked = !!checked[idx];
          return (
            <li 
              key={idx} 
              onClick={() => toggle(idx)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 shadow-sm transition-all cursor-pointer select-none",
                isChecked 
                  ? "border-safe/40 bg-safe/5 hover:border-safe/60" 
                  : "border-border-subtle/50 bg-surface-1 hover:border-brand-primary/30"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5 rounded border shrink-0 mt-0.5 transition-colors",
                isChecked
                  ? "bg-safe border-safe text-white"
                  : "bg-surface-2 border-border-strong text-transparent"
              )}>
                <Check className="size-3.5" strokeWidth={3} />
              </div>
              <Text 
                size="sm" 
                className={cn(
                  "font-medium leading-snug transition-colors",
                  isChecked ? "text-text-tertiary line-through" : "text-text-primary"
                )}
              >
                {action}
              </Text>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
