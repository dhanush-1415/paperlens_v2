export interface CalendarEventOptions {
  urgency?:     string;
  actionText?:  string;
  summary?:     string;
  keyEntities?: { label: string; value: string }[];
  documentUrl?: string;
}

export interface CalendarEvent {
  title:      string;
  dateString: string;
  options?:   CalendarEventOptions;
  uid?:       string;
}

const URGENCY_EMOJI: Record<string, string> = {
  critical: '🔴',
  high:     '🟠',
  caution:  '🟡',
  medium:   '🟡',
  low:      '🟢',
  safe:     '🟢',
};

const URGENCY_LABEL: Record<string, string> = {
  critical: 'CRITICAL — Act Immediately',
  high:     'HIGH — Act Soon',
  caution:  'CAUTION — Requires Review',
  medium:   'MODERATE',
  low:      'LOW',
  safe:     'SAFE',
};

function parseCalendarDate(dateString: string): Date | null {
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const parts = dateString.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts as [number, number, number];
      date = new Date(y, m - 1, d);
    } else {
      return null;
    }
  } else {
    date = new Date(dateString);
  }
  return isNaN(date.getTime()) ? null : date;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const toCalDate = (d: Date) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;

function buildCalendarTitle(title: string, urgency?: string): string {
  const emoji = urgency ? (URGENCY_EMOJI[urgency] ?? '') : '';
  return emoji ? `${emoji} ${title}` : title;
}

function buildCalendarDescription(options?: CalendarEventOptions): string {
  const { urgency, actionText, summary, keyEntities, documentUrl } = options ?? {};
  const lines: string[] = [];

  if (urgency) {
    lines.push(`⚑ PRIORITY: ${URGENCY_LABEL[urgency] ?? urgency.toUpperCase()}`);
    lines.push('');
  }
  if (actionText) {
    lines.push('✅ ACTION REQUIRED');
    lines.push(actionText);
    lines.push('');
  }
  if (keyEntities?.length) {
    lines.push('📌 KEY INFORMATION');
    keyEntities.forEach(e => lines.push(`  • ${e.label}: ${e.value}`));
    lines.push('');
  }
  if (summary) {
    lines.push('📄 SUMMARY');
    const plain = summary
      .replace(/###\s*/g, '\n')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[-•]\s*/gm, '  • ')
      .trim()
      .slice(0, 900);
    lines.push(plain);
    lines.push('');
  }
  if (documentUrl) {
    lines.push('---------------------');
    lines.push(`🔗 View document: ${documentUrl}`);
  }
  return lines.join('\n');
}

export function generateGoogleCalendarUrl(
  title:      string,
  dateString: string,
  options?:   CalendarEventOptions,
): string {
  const date = parseCalendarDate(dateString);
  if (!date) return '#';

  const start = toCalDate(date);
  const next  = new Date(date); next.setDate(next.getDate() + 1);
  const end   = toCalDate(next);

  const details = buildCalendarDescription(options);
  const parts = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(buildCalendarTitle(title, options?.urgency))}`,
    `dates=${start}%2F${end}`,
    ...(details ? [`details=${encodeURIComponent(details)}`] : []),
  ];
  return `https://calendar.google.com/calendar/render?${parts.join('&')}`;
}

export function generateOutlookCalendarUrl(
  title:      string,
  dateString: string,
  options?:   CalendarEventOptions,
): string {
  const date = parseCalendarDate(dateString);
  if (!date) return '#';

  const iso   = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const next  = new Date(date); next.setDate(next.getDate() + 1);
  const body  = buildCalendarDescription(options);

  const parts = [
    'path=/calendar/action/compose',
    'rru=addevent',
    'allday=true',
    `subject=${encodeURIComponent(buildCalendarTitle(title, options?.urgency))}`,
    `startdt=${iso(date)}`,
    `enddt=${iso(next)}`,
    ...(body ? [`body=${encodeURIComponent(body)}`] : []),
  ];
  return `https://outlook.live.com/calendar/0/deeplink/compose?${parts.join('&')}`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildICS(events: CalendarEvent[], stamp?: string): string {
  const dtstamp = stamp ?? new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PaperLens//Resolution Copilot//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((ev, i) => {
    const date = parseCalendarDate(ev.dateString);
    if (!date) return;
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const uid  = (ev.uid ?? `${toCalDate(date)}-${i}`) + '@paperlens.app';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${toCalDate(date)}`,
      `DTEND;VALUE=DATE:${toCalDate(next)}`,
      `SUMMARY:${escapeICS(buildCalendarTitle(ev.title, ev.options?.urgency))}`,
    );
    const desc = buildCalendarDescription(ev.options);
    if (desc) lines.push(`DESCRIPTION:${escapeICS(desc)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(filename: string, events: CalendarEvent[]): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
