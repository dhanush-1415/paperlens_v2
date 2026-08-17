'use client';

import { useState } from 'react';
import { CheckCircle2, Check } from 'lucide-react';
import { Text } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';
import { SyncPlanButton } from './sync-plan-button';

export function SmartActionPlan({
  actions,
  documentTitle,
}: {
  actions: readonly string[];
  documentTitle: string;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!actions || actions.length === 0) return null;

  return (
    <div className="relative z-10 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-2 p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-risk-caution-bg ring-1 ring-risk-caution-border">
            <CheckCircle2 className="h-3.5 w-3.5 text-risk-caution-fg" />
          </div>
          <p className="text-sm leading-none font-semibold text-text-primary">Smart Action Plan</p>
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
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 shadow-sm transition-all select-none',
                isChecked
                  ? 'border-safe/40 bg-safe/5 hover:border-safe/60'
                  : 'border-risk-caution-border bg-risk-caution-bg/40 hover:border-risk-caution-border hover:bg-risk-caution-bg',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                  isChecked
                    ? 'bg-safe border-safe text-white'
                    : 'border-risk-caution-border bg-surface-1 text-transparent',
                )}
              >
                <Check className="size-3.5" strokeWidth={3} />
              </div>
              <Text
                size="sm"
                className={cn(
                  'leading-snug font-medium transition-colors',
                  isChecked ? 'text-text-tertiary line-through' : 'text-risk-caution-fg',
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
