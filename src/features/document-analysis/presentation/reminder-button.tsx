'use client';

import { useState, useTransition, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, Loader2, X, Mail, Calendar,
  Check, Zap, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/ui/cn';

const MAX = 7;
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_ABBR = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface Props {
  document:      { id: string; title: string; score: { level: string } };
  variant?:      'icon' | 'inline' | 'hero';
  savedPhone?:   string | null;
  deadlineDate?: string | null;
  locked?:       boolean;
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base); d.setDate(d.getDate() + n); return d;
}

function fmtKey(key: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function daysFromToday(key: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${key}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
}

interface Preset {
  label:      string;
  key:        string;
  isDaily?:   boolean;
  isCadence?: boolean;
}

function buildPresets(deadlineDate: string | null): Preset[] {
  const todayKey    = toKey(new Date());
  const tomorrowKey = toKey(addDays(new Date(), 1));
  const maxKey      = toKey(addDays(new Date(), 365 * 3));
  const valid       = (k: string) => k > todayKey && k <= maxKey;

  const hasCadence = buildCadenceKeys(deadlineDate).length > 0;

  return [
    ...(hasCadence ? [{ label: 'Smart — 30/14/7/1 days before', key: '', isCadence: true }] : []),
    { label: 'Daily — next 7',  key: '', isDaily: true },
    { label: 'Tomorrow',        key: tomorrowKey },
  ].filter(p => p.isDaily || p.isCadence || valid(p.key));
}

function buildCadenceKeys(deadlineDate: string | null): string[] {
  if (!deadlineDate) return [];
  const todayKey = toKey(new Date());
  if (deadlineDate <= todayKey) return [];

  const deadline = new Date(`${deadlineDate}T00:00:00`);
  const offsets  = [30, 14, 7, 1];
  const keys: string[] = [];
  for (const off of offsets) {
    const k = toKey(addDays(deadline, -off));
    if (k > todayKey && k <= deadlineDate && !keys.includes(k)) keys.push(k);
  }
  return keys.sort();
}

function buildDailyKeys(deadlineDate: string | null): string[] {
  const todayKey = toKey(new Date());
  const cap      = toKey(addDays(new Date(), 365 * 3));

  let endKey: string;
  if (deadlineDate && deadlineDate > todayKey) {
    const days = daysFromToday(deadlineDate);
    endKey = days <= MAX ? deadlineDate : toKey(addDays(new Date(), MAX));
  } else {
    endKey = toKey(addDays(new Date(), MAX));
  }

  const keys: string[] = [];
  for (let i = 1; i <= MAX; i++) {
    const k = toKey(addDays(new Date(), i));
    if (k > cap || k > endKey) break;
    keys.push(k);
  }
  return keys;
}

function MiniCalendar({
  selected, onToggle, minKey, maxKey, atMax,
}: {
  selected: string[];
  onToggle: (key: string) => void;
  minKey:   string;
  maxKey:   string;
  atMax:    boolean;
}) {
  const todayKey = toKey(new Date());
  const initDate = useMemo(() => new Date(`${minKey}T00:00:00`), [minKey]);

  const [year,  setYear]  = useState(() => initDate.getFullYear());
  const [month, setMonth] = useState(() => initDate.getMonth());

  const canPrev = useMemo(() => {
    const [py, pm] = month === 0  ? [year - 1, 11] : [year, month - 1];
    const [my, mm] = [parseInt(minKey.slice(0,4)), parseInt(minKey.slice(5,7)) - 1];
    return py > my || (py === my && pm >= mm);
  }, [year, month, minKey]);

  const canNext = useMemo(() => {
    const [ny, nm] = month === 11 ? [year + 1, 0] : [year, month + 1];
    const [xy, xm] = [parseInt(maxKey.slice(0,4)), parseInt(maxKey.slice(5,7)) - 1];
    return ny < xy || (ny === xy && nm <= xm);
  }, [year, month, maxKey]);

  const prevMonth = () => {
    if (!canPrev) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canNext) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  const cells = useMemo(() => {
    const firstDow    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    }
    return out;
  }, [year, month]);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-1 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2 px-3 py-2.5">
        <button type="button" onClick={prevMonth} disabled={!canPrev} aria-label="Previous month"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-1 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-20">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-primary">
          {MONTH_NAMES[month]} {year}
        </span>
        <button type="button" onClick={nextMonth} disabled={!canNext} aria-label="Next month"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-1 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-20">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border-subtle px-2 py-1.5">
        {DAY_ABBR.map(d => (
          <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-text-tertiary">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 p-2">
        {cells.map((key, i) => {
          if (!key) return <div key={`b${i}`} className="h-8" />;

          const isSelected = selected.includes(key);
          const isToday    = key === todayKey;
          const isPast     = key < minKey;
          const isFuture   = key > maxKey;
          const isDisabled = isPast || isFuture || (!isSelected && atMax);
          const dayNum     = parseInt(key.slice(-2));

          return (
            <button
              key={key}
              type="button"
              onClick={() => !isDisabled && onToggle(key)}
              disabled={isDisabled}
              aria-label={fmtKey(key)}
              aria-pressed={isSelected}
              className={cn(
                'relative flex h-8 w-full items-center justify-center rounded-lg',
                'text-xs font-medium transition-all duration-100',
                isSelected
                  ? 'z-10 scale-105 bg-brand-primary font-bold text-white shadow-[0_0_14px_-3px_rgba(var(--brand-primary),0.5)]'
                  : isDisabled
                    ? 'cursor-not-allowed text-text-tertiary/20'
                    : isToday
                      ? 'cursor-pointer font-semibold text-brand-primary ring-1 ring-inset ring-brand-primary/40 hover:bg-brand-primary/10'
                      : 'cursor-pointer text-text-secondary hover:bg-surface-2 hover:text-text-primary active:scale-90',
              )}
            >
              {dayNum}
              {isToday && !isSelected && (
                <span className="absolute bottom-[3px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-brand-primary" />
              )}
            </button>
          );
        })}
      </div>

      {atMax && (
        <p className="px-3 pb-2.5 text-center text-[10px] font-medium text-amber-500/60">
          Max {MAX} — remove a date to add another
        </p>
      )}
    </div>
  );
}

export function ReminderButton({
  document: doc,
  variant = 'icon',
  savedPhone,
  deadlineDate,
  locked = false,
}: Props) {
  const savedEmail = (savedPhone ?? '').trim();

  const [mounted, setMounted]        = useState(false);
  const [isOpen, setIsOpen]          = useState(false);
  const [selected, setSelected]      = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setTimeout(() => setMounted(true), 0); }, []);

  const overlayRef   = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const prevLenRef   = useRef(0);

  const minDate = toKey(addDays(new Date(), 1));
  const maxDate = toKey(addDays(new Date(), 365 * 3));
  const atMax   = selected.length >= MAX;

  const presets     = useMemo(() => buildPresets(deadlineDate ?? null), [deadlineDate]);
  const dailyKeys   = useMemo(() => buildDailyKeys(deadlineDate ?? null), [deadlineDate]);
  const cadenceKeys = useMemo(() => buildCadenceKeys(deadlineDate ?? null), [deadlineDate]);

  const visiblePresets = presets.filter(p => p.isDaily || p.isCadence || !selected.includes(p.key));
  const dailyAllSelected   = dailyKeys.length > 0 && dailyKeys.every(k => selected.includes(k));
  const cadenceAllSelected = cadenceKeys.length > 0 && cadenceKeys.every(k => selected.includes(k));

  useEffect(() => {
    if (selected.length === 1 && prevLenRef.current === 0) {
      setTimeout(() => {
        scrollBodyRef.current?.scrollTo({
          top: scrollBodyRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 120);
    }
    prevLenRef.current = selected.length;
  }, [selected.length]);

  const toggle = useCallback((key: string) => {
    setSelected(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= MAX) return prev;
      return [...prev, key].sort();
    });
  }, []);

  const toggleDaily = useCallback(() => {
    const allIn = dailyKeys.every(k => selected.includes(k));
    if (allIn) {
      setSelected(prev => prev.filter(k => !dailyKeys.includes(k)));
    } else {
      setSelected(prev => {
        const next = [...prev];
        for (const k of dailyKeys) {
          if (!next.includes(k) && next.length < MAX) next.push(k);
        }
        return next.sort();
      });
    }
  }, [dailyKeys, selected]);

  const toggleCadence = useCallback(() => {
    const allIn = cadenceKeys.every(k => selected.includes(k));
    if (allIn) {
      setSelected(prev => prev.filter(k => !cadenceKeys.includes(k)));
    } else {
      setSelected(prev => {
        const next = [...prev];
        for (const k of cadenceKeys) {
          if (!next.includes(k) && next.length < MAX) next.push(k);
        }
        return next.sort();
      });
    }
  }, [cadenceKeys, selected]);

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
    setSelected([]);
  }

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (locked) {
      toast.info('Email reminders require a Pro plan.', {
        description: 'Upgrade to Pro to set deadline reminders.',
      });
      return;
    }
    setIsOpen(true);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) handleClose();
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  function handleSubmit() {
    if (!selected.length || isPending) return;
    startTransition(async () => {
      // Mock API call since v2.1 lacks a reminders table
      await new Promise(resolve => setTimeout(resolve, 600));
      toast.success(
        selected.length === 1 ? '1 reminder set!' : `${selected.length} reminders set!`,
        { description: `We'll email you on ${selected.map(fmtKey).join(', ')}.` },
      );
      handleClose();
    });
  }

  const deadlineDays  = deadlineDate ? daysFromToday(deadlineDate) : null;
  const deadlineLabel = deadlineDate
    ? new Date(`${deadlineDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <>
      {variant === 'hero' ? (
        <button onClick={handleOpen} disabled={isPending}
          className="w-full cursor-pointer py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-[0_0_20px_rgba(var(--brand-primary),0.3)] disabled:opacity-70 disabled:cursor-not-allowed">
          <Bell className="h-4 w-4 animate-pulse" />
          Email Reminder
        </button>
      ) : variant === 'icon' ? (
        <button onClick={handleOpen} aria-label="Set email reminder"
          className={cn('group w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 cursor-pointer text-text-secondary bg-surface-2 border border-border-subtle hover:text-text-primary hover:bg-surface-raised hover:border-border-strong hover:shadow-sm transition-all duration-200')}>
          <Bell className="h-4 w-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
          <span className="text-xs font-semibold leading-none hidden sm:inline">Remind</span>
        </button>
      ) : (
        <button onClick={handleOpen}
          className={cn('w-full flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3',
            'border border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary/10',
            'text-left transition-all duration-150 active:scale-[0.99]')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary">
            <Mail className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-text-primary leading-tight">Get an email reminder</p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {savedEmail ? `Send to ${savedEmail}` : "We'll email you before the deadline"}
            </p>
          </div>
          <Bell className="h-4 w-4 shrink-0 text-brand-primary animate-pulse" />
        </button>
      )}

      {isOpen && mounted && createPortal(
        <div ref={overlayRef} role="dialog" aria-modal="true" aria-labelledby="reminder-title"
          className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
          onClick={handleOverlayClick}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" aria-hidden="true" />

          <div
            className={cn(
              'relative z-10 w-full sm:max-w-md',
              'rounded-t-[28px] sm:rounded-2xl',
              'bg-surface-1 border border-border-strong',
              'shadow-2xl shadow-black/50',
              'animate-in fade-in-0 slide-in-from-bottom-6 sm:zoom-in-95 duration-250',
              'max-h-[92dvh] flex flex-col',
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex shrink-0 justify-center pb-1 pt-3 sm:hidden" aria-hidden="true">
              <div className="h-1 w-12 rounded-full bg-border-subtle" />
            </div>

            <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 ring-1 ring-brand-primary/25">
                  <Bell className="h-[18px] w-[18px] animate-pulse text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <h2 id="reminder-title" className="text-sm font-bold text-text-primary">
                    Set Email Reminder
                  </h2>
                  <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-text-tertiary">
                    {doc.title}
                  </p>
                </div>
              </div>
              <button type="button" onClick={handleClose} disabled={isPending} aria-label="Close"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary disabled:opacity-40">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollBodyRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface-2 px-3 py-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
                <span className="text-[11px] text-text-tertiary">Sending to</span>
                <span className="flex-1 truncate text-[11px] font-semibold text-text-primary">
                  {savedEmail || 'your account email'}
                </span>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-primary/15">
                  <Check className="h-2.5 w-2.5 text-brand-primary" />
                </span>
              </div>

              {deadlineLabel && (
                <div className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-2.5',
                  deadlineDays !== null && deadlineDays <= 3
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-amber-500/25 bg-amber-500/5',
                )}>
                  <Calendar className={cn('h-4 w-4 shrink-0',
                    deadlineDays !== null && deadlineDays <= 3 ? 'text-rose-500' : 'text-amber-500')} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary">Deadline: {deadlineLabel}</p>
                    {deadlineDays !== null && (
                      <p className={cn('mt-0.5 text-[11px]',
                        deadlineDays < 0 ? 'font-semibold text-rose-500'
                          : deadlineDays === 0 ? 'font-bold text-rose-500'
                          : deadlineDays <= 3 ? 'text-rose-500'
                          : 'text-text-tertiary')}>
                        {deadlineDays < 0
                          ? `${Math.abs(deadlineDays)} days overdue`
                          : deadlineDays === 0 ? 'Due today!'
                          : `${deadlineDays} day${deadlineDays === 1 ? '' : 's'} away`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {visiblePresets.length > 0 && (
                <div>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                    <Zap className="h-3 w-3 text-brand-primary" />
                    Quick picks
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {visiblePresets.map(preset => {
                      if (preset.isCadence) {
                        const canAddMore = cadenceKeys.some(k => !selected.includes(k)) && !atMax;
                        return (
                          <button
                            key="cadence"
                            type="button"
                            onClick={toggleCadence}
                            disabled={isPending || (!cadenceAllSelected && !canAddMore)}
                            className={cn(
                              'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5',
                              'text-xs font-medium transition-all duration-150 active:scale-95',
                              'disabled:cursor-not-allowed disabled:opacity-40',
                              cadenceAllSelected
                                ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
                                : 'border-amber-500/40 bg-amber-500/10 text-text-primary/80 hover:border-amber-500/60 hover:bg-amber-500/20 hover:text-text-primary',
                            )}
                          >
                            <Zap className="h-3 w-3 text-amber-500" />
                            {preset.label}
                            {cadenceAllSelected
                              ? <Check className="h-3 w-3 ml-0.5" />
                              : <span className="text-text-tertiary ml-0.5">({cadenceKeys.length})</span>}
                          </button>
                        );
                      }

                      if (preset.isDaily) {
                        const canAddMore = dailyKeys.some(k => !selected.includes(k)) && !atMax;
                        return (
                          <button
                            key="daily"
                            type="button"
                            onClick={toggleDaily}
                            disabled={isPending || (!dailyAllSelected && !canAddMore)}
                            className={cn(
                              'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5',
                              'text-xs font-medium transition-all duration-150 active:scale-95',
                              'disabled:cursor-not-allowed disabled:opacity-40',
                              dailyAllSelected
                                ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
                                : 'border-border-subtle bg-surface-2 text-text-secondary hover:border-brand-primary/40 hover:bg-brand-primary/10 hover:text-text-primary',
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {preset.label}
                            {dailyAllSelected
                              ? <Check className="h-3 w-3 ml-0.5" />
                              : <span className="text-text-tertiary ml-0.5">({dailyKeys.length})</span>}
                          </button>
                        );
                      }

                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => toggle(preset.key)}
                          disabled={isPending || atMax}
                          className={cn(
                            'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5',
                            'text-xs font-medium transition-all duration-150 active:scale-95',
                            'border-border-subtle bg-surface-2 text-text-secondary',
                            'hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-text-primary',
                            'disabled:cursor-not-allowed disabled:opacity-40',
                          )}
                        >
                          <Calendar className="h-3 w-3 text-amber-500/80" />
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  <Calendar className="h-3 w-3 text-text-tertiary" />
                  Pick dates
                </p>
                <MiniCalendar
                  selected={selected}
                  onToggle={toggle}
                  minKey={minDate}
                  maxKey={maxDate}
                  atMax={atMax}
                />
              </div>

              {selected.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                      Your reminders
                    </p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: MAX }).map((_, i) => (
                        <div key={i} className={cn(
                          'h-1.5 w-4 rounded-full transition-all duration-300',
                          i < selected.length
                            ? i >= MAX - 2 ? 'bg-rose-500' : 'bg-brand-primary'
                            : 'bg-border-subtle',
                        )} />
                      ))}
                      <span className="ml-1 text-[10px] font-bold tabular-nums text-text-tertiary">
                        {selected.length}/{MAX}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.map(key => (
                      <span key={key}
                        className="flex items-center gap-1.5 rounded-full border border-brand-primary/25 bg-brand-primary/10 py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-text-primary">
                        <Calendar className="h-2.5 w-2.5 shrink-0 text-brand-primary" />
                        {fmtKey(key)}
                        <button type="button" onClick={() => toggle(key)} disabled={isPending}
                          aria-label={`Remove ${fmtKey(key)}`}
                          className="ml-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-brand-primary/20 hover:text-text-primary">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="shrink-0 space-y-2 border-t border-border-subtle px-5 py-4">
              <button type="button" onClick={handleSubmit}
                disabled={isPending || selected.length === 0}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-center gap-2',
                  'rounded-xl px-4 py-3 text-sm font-bold',
                  'bg-brand-primary text-white hover:bg-brand-primary/90 active:scale-[0.98]',
                  'shadow-md shadow-brand-primary/20 transition-all duration-150',
                  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
                )}
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Setting reminders…</>
                ) : selected.length === 0 ? (
                  <><Bell className="h-4 w-4" />Select dates above</>
                ) : (
                  <><Bell className="h-4 w-4" />Set {selected.length} Reminder{selected.length > 1 ? 's' : ''}</>
                )}
              </button>
              <button type="button" onClick={handleClose} disabled={isPending}
                className="w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-40">
                Cancel
              </button>
            </div>

          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
