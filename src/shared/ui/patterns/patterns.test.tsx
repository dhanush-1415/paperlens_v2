import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RISK_SEVERITY } from '@/features/document-analysis/domain';

import { DeadlineCountdown } from './deadline-countdown';
import { DocumentExcerpt } from './document-excerpt';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { RISK_LABEL, RISK_ORDER, RiskBadge, RiskDot, compareRisk } from './risk-badge';
import { StatTile } from './stat-tile';

/**
 * Patterns carry product decisions, so what is asserted here is the decision — not the markup.
 *
 * The load-bearing one is `RiskBadge`: it is the component a user points at when deciding
 * whether to sign a contract, and its entire design rests on never communicating a level by
 * colour alone. That rule is invisible to the type system and easy to "simplify" away in a
 * design pass, so it is a test.
 */

describe('RiskBadge — three redundant signals, always', () => {
 it.each(RISK_ORDER)('renders %s with text, not colour alone', (level) => {
 render(<RiskBadge level={level} />);

 // WCAG 2.2 §1.4.1. Roughly one in twelve men cannot separate the red from the green, and
 // every printed or projected copy of a report is effectively greyscale.
 expect(screen.getByText(RISK_LABEL[level])).toBeInTheDocument();
 });

 it.each(RISK_ORDER)('renders %s with a distinct icon', (level) => {
 const { container } = render(<RiskBadge level={level} />);
 const icon = container.querySelector('svg');

 expect(icon).not.toBeNull();
 // Decorative: the badge's text already says "Critical", and "warning triangle Critical"
 // is noise to a screen-reader user.
 expect(icon).toHaveAttribute('aria-hidden');
 });

 it('gives each level a visually different icon', () => {
 // Same icon in three colours is colour-only redundancy wearing a disguise.
 const markup = RISK_ORDER.map((level) => {
 const { container } = render(<RiskBadge level={level} />);
 return container.querySelector('svg')?.innerHTML ?? '';
 });

 expect(new Set(markup).size).toBe(RISK_ORDER.length);
 });

 it('leads with the count, which is what a scanning user is looking for', () => {
 render(<RiskBadge level="critical" count={3} />);

 expect(screen.getByText('3')).toBeInTheDocument();
 expect(screen.getByText(RISK_LABEL.critical)).toBeInTheDocument();
 });

 it('lets the wording be translated but never removed', () => {
 render(<RiskBadge level="critical" label="Kritisch" />);

 expect(screen.getByText('Kritisch')).toBeInTheDocument();
 expect(screen.queryByText(RISK_LABEL.critical)).not.toBeInTheDocument();
 });
});

describe('RiskDot — the compact form still announces its level', () => {
 it('is exposed as an image with the level as its name', () => {
 // The dot is the only carrier of the level here, so it must be in the accessibility tree.
 // A bare decorative span would make the column meaningless to a screen-reader user.
 render(<RiskDot level="caution" />);

 const dot = screen.getByRole('img', { name: RISK_LABEL.caution });
 expect(dot).toHaveAttribute('title', RISK_LABEL.caution);
 });
});

describe('the risk order is one order', () => {
 it('sorts most severe first, matching the domain’s scoring weights', () => {
 const shuffled = ['safe', 'critical', 'caution'] as const;

 expect([...shuffled].sort(compareRisk)).toEqual(['critical', 'caution', 'safe']);
 expect([...RISK_ORDER].sort((a, b) => RISK_SEVERITY[b] - RISK_SEVERITY[a])).toEqual([
 ...RISK_ORDER,
 ]);
 });
});

describe('EmptyState', () => {
 it('renders a heading, an explanation and the next step', () => {
 render(
 <EmptyState
 title="No documents yet"
 description="Paste a contract to see its risk profile."
 action={<button type="button">Analyze a document</button>}
 />,
 );

 expect(screen.getByRole('heading', { name: 'No documents yet' })).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Analyze a document' })).toBeInTheDocument();
 });

 it('renders as a heading below h1 — it lives inside a page that owns the title', () => {
 render(<EmptyState title="No documents yet" />);

 expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
 });

 it('changes its icon when the list is filtered rather than genuinely empty', () => {
 // Different situations, different next steps: "add your first document" versus "clear the
 // filter". Same icon for both tells the user nothing.
 const empty = render(<EmptyState title="Nothing" />).container.querySelector('svg')?.innerHTML;
 const filtered = render(<EmptyState title="Nothing" filtered />).container.querySelector(
 'svg',
 )?.innerHTML;

 expect(empty).not.toBe(filtered);
 });
});

describe('ErrorState', () => {
 it('shows a human message and never an exception', () => {
 render(<ErrorState />);

 expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
 });

 it('surfaces the correlation id so a support ticket can be traced to a log line', () => {
 render(<ErrorState correlationId="pl_9f2c" />);

 expect(screen.getByText('pl_9f2c')).toBeInTheDocument();
 });

 it('omits the reference entirely when there is none, rather than showing an empty label', () => {
 render(<ErrorState />);

 expect(screen.queryByText(/^Reference/)).not.toBeInTheDocument();
 });
});

describe('StatTile', () => {
 it('pairs the label with the value as a description list', () => {
 // So a screen reader reads "Critical clauses, 14" as one fact rather than two fragments.
 const { container } = render(<StatTile label="Critical clauses" value="14" />);
 const list = container.querySelector('dl');

 expect(list).not.toBeNull();
 expect(within(list!).getByText('Critical clauses')).toBeInTheDocument();
 expect(within(list!).getByText('14')).toBeInTheDocument();
 });

 it('carries the delta direction in a glyph, not only in colour', () => {
 render(
 <StatTile
 label="Critical clauses"
 value="14"
 delta={{ direction: 'down', intent: 'positive', label: '3 fewer' }}
 />,
 );

 expect(screen.getByText('↓')).toBeInTheDocument();
 expect(screen.getByText('3 fewer')).toBeInTheDocument();
 });

 it('separates direction from judgement — down is not automatically good', () => {
 // "Down" is bad news for documents analyzed and good news for critical clauses. The tile
 // renders what the caller says it means; it never infers.
 const { rerender } = render(
 <StatTile
 label="Documents analyzed"
 value="4"
 delta={{ direction: 'down', intent: 'negative', label: '2 fewer' }}
 />,
 );
 const negative = screen.getByText('2 fewer').className;

 rerender(
 <StatTile
 label="Critical clauses"
 value="4"
 delta={{ direction: 'down', intent: 'positive', label: '2 fewer' }}
 />,
 );

 expect(screen.getByText('2 fewer').className).not.toBe(negative);
 });
});

describe('DocumentExcerpt', () => {
 it('renders as a quotation with its source attributed', () => {
 render(
 <DocumentExcerpt source="Clause 14.2" cite="https://example.test/contract#14.2">
 Either party may terminate without cause.
 </DocumentExcerpt>,
 );

 expect(screen.getByText(/terminate without cause/)).toBeInTheDocument();
 expect(screen.getByText('Clause 14.2')).toBeInTheDocument();
 });

 it('keeps a caller’s <mark> as a real mark element', () => {
 // The highlight is styled by a descendant selector, so the call site writes plain HTML.
 // If the tint moved onto a class the caller had to remember, every excerpt would be one
 // forgotten class away from an invisible highlight.
 const { container } = render(
 <DocumentExcerpt level="critical">
 Either party may <mark>terminate without cause</mark>.
 </DocumentExcerpt>,
 );

 expect(container.querySelector('mark')).toHaveTextContent('terminate without cause');
 });
});

describe('DeadlineCountdown', () => {
 beforeEach(() => {
 vi.useFakeTimers();
 vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'));
 });

 afterEach(() => {
 vi.useRealTimers();
 });

 it('renders a machine-readable time alongside the human one', () => {
 render(<DeadlineCountdown deadline="2026-05-03T10:00:00.000Z" />);

 const time = screen.getByText(/\d\d:\d\d:\d\d/);
 expect(time.closest('time')).toHaveAttribute('dateTime', '2026-05-03T10:00:00.000Z');
 });

 it('counts down to the second, not to the nearest day', () => {
 // `Intl.RelativeTimeFormat` would render "in 2 days" for both of these. The difference
 // between them is the entire reason a deadline is shown as a countdown.
 render(<DeadlineCountdown deadline="2026-05-03T14:12:09.000Z" />);

 expect(screen.getByText('2d 04:12:09')).toBeInTheDocument();
 });

 it('says so plainly once the window has closed', () => {
 render(<DeadlineCountdown deadline="2026-04-30T10:00:00.000Z" />);

 expect(screen.getByText(/^Overdue by/)).toBeInTheDocument();
 });

 it('ticks on a shared clock rather than one timer per instance', () => {
 render(
 <>
 <DeadlineCountdown deadline="2026-05-01T10:00:10.000Z" />
 <DeadlineCountdown deadline="2026-05-01T10:00:20.000Z" />
 </>,
 );

 expect(screen.getByText('00:00:10')).toBeInTheDocument();
 expect(screen.getByText('00:00:20')).toBeInTheDocument();

 // `act` because the tick reaches React through a `useSyncExternalStore` subscription,
 // which is a state update originating outside an event handler.
 act(() => {
 vi.advanceTimersByTime(3000);
 });

 // Both moved, and they moved together — a per-instance interval would let them drift
 // apart by the milliseconds between their mounts, which is visible in a table.
 expect(screen.getByText('00:00:07')).toBeInTheDocument();
 expect(screen.getByText('00:00:17')).toBeInTheDocument();
 });

 it('renders a malformed date as itself instead of NaN', () => {
 // Hiding it would turn a data bug into an empty cell nobody reports.
 render(<DeadlineCountdown deadline="not-a-date" label="Closes" />);

 expect(screen.getByText(/not-a-date/)).toBeInTheDocument();
 expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
 });
});
