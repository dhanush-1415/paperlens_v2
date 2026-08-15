'use client';

import { useState } from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import { Text } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';
import { SyncPlanButton } from './sync-plan-button';

export function SmartActionPlan({ actions, documentTitle }: { actions: readonly string[], documentTitle: string }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 relative z-10 bg-surface-2 p-5 rounded-2xl border border-border-subtle shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-risk-caution-bg ring-1 ring-risk-caution-border">
            <CheckCircle2 className="h-3.5 w-3.5 text-risk-caution-fg" />
          </div>
          <p className="text-sm font-semibold text-text-primary leading-none">Smart Action Plan</p>
        </div>
        <SyncPlanButton actions={actions} documentTitle={documentTitle} />
      </div>
      <ul className="flex flex-col gap-2">
        {actions.map((action, idx) => {
          const isChecked = !!checked[idx];
          return (
            <li 
              key={idx} 
              onClick={() => toggle(idx)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 shadow-sm transition-all cursor-pointer select-none",
                isChecked 
                  ? "border-safe/40 bg-safe/5 hover:border-safe/60" 
                  : "border-risk-caution-border bg-risk-caution-bg/40 hover:bg-risk-caution-bg hover:border-risk-caution-border"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-5 h-5 rounded border shrink-0 mt-0.5 transition-colors",
                isChecked
                  ? "bg-safe border-safe text-white"
                  : "bg-surface-1 border-risk-caution-border text-transparent"
              )}>
                <Check className="size-3.5" strokeWidth={3} />
              </div>
              <Text 
                size="sm" 
                className={cn(
                  "font-medium leading-snug transition-colors",
                  isChecked ? "text-text-tertiary line-through" : "text-risk-caution-fg"
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
