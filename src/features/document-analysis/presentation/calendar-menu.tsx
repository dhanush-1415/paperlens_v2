'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICS,
  type CalendarEventOptions,
} from '@/shared/utils/calendar';

interface Props {
  title:       string;
  dateString:  string;
  options?:    CalendarEventOptions;
  variant?:    'link' | 'button' | 'icon';
  className?:  string;
}

export function CalendarMenu({ title, dateString, options, variant = 'link', className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openExternal = (provider: 'google' | 'outlook') => {
    const url = provider === 'google'
      ? generateGoogleCalendarUrl(title, dateString, options)
      : generateOutlookCalendarUrl(title, dateString, options);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const exportApple = () => {
    downloadICS(`paperlens-${dateString}`, [{ title, dateString, options }]);
    setOpen(false);
  };

  if (variant === 'icon') {
    return (
      <div ref={ref} className={cn('relative inline-flex w-full sm:w-auto', className)}>
        <button 
          onClick={() => setOpen(o => !o)}
          title="Add to Calendar" 
          className="group w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 cursor-pointer text-text-secondary bg-surface-2 border border-border-subtle hover:text-text-primary hover:bg-surface-raised hover:border-border-strong hover:shadow-sm transition-all duration-200"
        >
          <CalendarPlus className="h-4 w-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
          <span className="text-xs font-semibold leading-none hidden sm:inline">Calendar</span>
        </button>
        {open && (
          <div className="absolute top-full left-0 z-30 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border-subtle bg-surface-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
            <button type="button" onClick={() => openExternal('google')} className="w-full px-3 py-2 text-left text-[12px] font-medium text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">Google Calendar</button>
            <button type="button" onClick={() => openExternal('outlook')} className="w-full px-3 py-2 text-left text-[12px] font-medium text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">Outlook Calendar</button>
            <button type="button" onClick={exportApple} className="w-full px-3 py-2 text-left text-[12px] font-medium text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">Apple / Other (.ics)</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('relative', variant === 'button' ? 'inline-block' : 'inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors cursor-pointer',
          variant === 'button'
            ? 'rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-1.5 text-[11px] font-medium text-text-primary hover:bg-surface-2'
            : 'text-[10px] font-medium text-brand-primary/70 hover:text-brand-primary',
        )}
      >
        <CalendarPlus className={variant === 'button' ? 'h-3.5 w-3.5 shrink-0' : 'h-2.5 w-2.5 shrink-0'} />
        Add to Calendar
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-border-subtle bg-surface-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <button type="button" onClick={() => openExternal('google')} className="w-full px-3 py-2 text-left text-[12px] font-medium text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">Google Calendar</button>
          <button type="button" onClick={() => openExternal('outlook')} className="w-full px-3 py-2 text-left text-[12px] font-medium text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">Outlook Calendar</button>
          <button type="button" onClick={exportApple} className="w-full px-3 py-2 text-left text-[12px] font-medium text-text-primary transition-colors hover:bg-surface-2 cursor-pointer">Apple / Other (.ics)</button>
        </div>
      )}
    </div>
  );
}
