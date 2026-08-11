'use client';

import { useState } from 'react';
import { cn } from '@/shared/ui/cn';
import { ScrollReveal } from '@/shared/ui';

interface FaqItem {
  q: string;
  a: string;
}

function FaqRow({
  q, a, open, onToggle,
}: FaqItem & { open: boolean; onToggle: () => void }) {
  return (
    <div className={cn(
      'reveal-item rounded-[1.5rem] border transition-all duration-300 overflow-hidden backdrop-blur-md',
      open 
        ? 'border-brand-primary/30 bg-surface-2/80 shadow-lg shadow-brand-primary/5 ring-1 ring-brand-primary/10' 
        : 'border-border-strong/50 bg-surface-1/40 shadow-sm hover:border-border-strong hover:bg-surface-2/40 hover:shadow-md'
    )}>
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start justify-between gap-6 px-6 py-5 md:px-8 md:py-6 text-left outline-none group"
        aria-expanded={open}
      >
        <span className={cn(
          'text-base md:text-lg font-bold leading-snug transition-colors duration-300',
          open ? 'text-brand-primary' : 'text-text-primary group-hover:text-brand-primary/80'
        )}>
          {q}
        </span>
        <span className={cn(
          'mt-1 flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300',
          open
            ? 'bg-brand-primary text-canvas rotate-0 shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.3)]'
            : 'bg-surface-raised text-text-tertiary group-hover:bg-brand-primary/10 group-hover:text-brand-primary',
        )}>
          {open ? (
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
          ) : (
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          )}
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 md:px-8 md:pb-8 pt-2 text-sm md:text-base leading-relaxed text-text-secondary">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ScrollReveal variant="stagger-children" className="mx-auto flex flex-col gap-4">
      {items.map((item, i) => (
        <FaqRow
          key={item.q}
          {...item}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </ScrollReveal>
  );
}
