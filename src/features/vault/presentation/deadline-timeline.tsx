'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { cn, Button } from '@/shared/ui';
import { CalendarIcon, MoreVerticalIcon } from '@/shared/ui/icons/dashboard-icons';
import type { VaultDocument } from './vault-page';

export function daysUntilDeadline(dateString: string): number {
  const deadline = new Date(dateString);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDeadline(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function downloadICS(filename: string, events: any[]) {
  // Simplified ICS export
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PaperLens//EN\n';
  events.forEach((e) => {
    const d = new Date(e.dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    ics += `BEGIN:VEVENT\nUID:${e.uid}\nDTSTAMP:${d}\nDTSTART:${d}\nSUMMARY:${e.title}\nEND:VEVENT\n`;
  });
  ics += 'END:VCALENDAR';
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function countdown(days: number): string {
  return days < 0
    ? `${Math.abs(days)}d overdue`
    : days === 0
      ? 'Due today'
      : days === 1
        ? 'Due tomorrow'
        : `${days}d left`;
}

interface Row {
  doc: VaultDocument;
  days: number;
}

function DeadlineGroup({
  label,
  items,
  toneClass,
}: {
  label: string;
  items: Row[];
  toneClass: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className={cn('text-xs font-bold tracking-widest uppercase', toneClass)}>
        {label} · {items.length}
      </p>
      {items.map(({ doc, days }) => (
        <div
          key={doc.id}
          className="group/row flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-border-subtle bg-surface-1 px-4 py-3 transition-colors hover:border-brand-primary/30 hover:shadow-sm"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-tertiary transition-colors group-hover/row:text-brand-primary">
            <CalendarIcon className="size-5" />
          </div>
          <Link href={`/document/${doc.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary transition-colors group-hover/row:text-brand-primary">
              {doc.name}
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {doc.deadlineDate ? formatDeadline(doc.deadlineDate) : 'No date'}
            </p>
          </Link>
          <span
            className={cn(
              'shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums',
              days <= 3
                ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                : days <= 7
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                  : 'border-border-subtle bg-surface-2 text-text-secondary',
            )}
          >
            {countdown(days)}
          </span>
          <button className="shrink-0 rounded-xl p-2 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary">
            <MoreVerticalIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function DeadlineTimeline({ docs }: { docs: VaultDocument[] }) {
  const rows = useMemo<Row[]>(() => {
    return docs
      .filter((d) => d.deadlineDate && !d.resolved)
      .map((d) => ({ doc: d, days: daysUntilDeadline(d.deadlineDate!) }))
      .sort((a, b) => a.days - b.days);
  }, [docs]);

  if (rows.length === 0) return null;

  const overdue = rows.filter((r) => r.days < 0);
  const thisWeek = rows.filter((r) => r.days >= 0 && r.days <= 7);
  const later = rows.filter((r) => r.days > 7);

  const exportAll = () => {
    downloadICS(
      'paperlens-deadlines',
      rows.map((r) => ({
        title: `Deadline: ${r.doc.name}`,
        dateString: r.doc.deadlineDate!,
        uid: r.doc.id,
      })),
    );
  };

  return (
    <div className="mb-6 rounded-[1.5rem] border border-border-subtle bg-surface-1/50 p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <CalendarIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-base leading-tight font-bold text-text-primary">
              Upcoming Deadlines
            </h2>
            <span className="text-xs font-medium text-text-tertiary">
              {rows.length} pending action{rows.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={exportAll}
          className="hidden h-9 px-3 text-xs sm:flex"
        >
          Export Calendar (.ics)
        </Button>
      </div>

      <div className="space-y-5">
        <DeadlineGroup label="Overdue" items={overdue} toneClass="text-rose-500" />
        <DeadlineGroup label="This week" items={thisWeek} toneClass="text-amber-500" />
        <DeadlineGroup label="Later" items={later} toneClass="text-text-tertiary" />
      </div>
    </div>
  );
}
