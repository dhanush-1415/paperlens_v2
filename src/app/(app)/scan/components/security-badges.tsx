'use client';

import { ShieldCheck, Lock, EyeOff } from 'lucide-react';
import { cn } from '@/shared/ui/cn';

const BADGES = [
  {
    icon: Lock,
    title: 'End-to-End Encrypted',
    desc: 'TLS 1.3 in transit, AES-256 at rest.',
  },
  {
    icon: EyeOff,
    title: 'Zero Model Training',
    desc: 'Your documents are never used to train AI models.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Data Retention',
    desc: 'Files are processed in memory and shredded after decoding.',
  },
] as const;

interface SecurityBadgesProps {
  className?: string;
  variant?: 'grid' | 'row';
}

export function SecurityBadges({ className, variant = 'grid' }: SecurityBadgesProps) {
  return (
    <div
      className={cn(
        variant === 'row'
          ? 'flex flex-wrap items-center justify-center gap-4 py-4 sm:gap-6'
          : 'grid w-full grid-cols-1 gap-3 py-4 sm:gap-4 md:grid-cols-3',
        className,
      )}
    >
      {BADGES.map((b, i) => {
        const Icon = b.icon;
        return (
          <div
            key={i}
            className="flex w-full items-start gap-3 rounded-xl border border-border-subtle bg-surface-2/50 px-4 py-3 transition-all hover:bg-surface-2 sm:items-center sm:px-3.5 sm:py-2.5"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 sm:mt-0">
              <Icon className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs leading-tight font-semibold text-text-primary sm:text-[13px]">
                {b.title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-text-tertiary sm:text-[11px]">
                {b.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
