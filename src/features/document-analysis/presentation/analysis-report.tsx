import { Accordion, Badge, EmptyState, Heading, StatTile, Text } from '@/shared/ui';

import { type AnalysisDto } from '../application/dto';
import { DOCUMENT_TYPE_LABEL } from '../constants';
import { RiskFlagCard } from './risk-flag-card';
import { CopilotChatWindow } from './copilot-chat-window';

/**
 * The report. A Server Component, and pointedly so.
 *
 * Everything here — the score, the counts, the clause text, the explanations — is markup by
 * the time it reaches the browser. The only JavaScript this subtree ships is
 * `RiskFlagCard`'s toggle handler. A client-rendered version would send the document's
 * findings twice: once in the HTML and again in the RSC payload that hydrates it.
 *
 * ### It takes a DTO, never an entity
 *
 * The prop type is `AnalysisDto`. Passing a `DocumentAnalysis` would nearly compile — the
 * DTO's fields are close to a subset — but it would hand `ownerId` and the internal shape to
 * a component whose child is a Client Component, and `taintEntity` would throw at that
 * boundary. That throw is the design working: the mapper in `application/dto.ts` is the only
 * sanctioned way across, and forgetting it fails at the point of the mistake rather than
 * leaking quietly.
 */

export interface AnalysisReportProps {
  readonly analysis: AnalysisDto;
  readonly labels: AnalysisReportLabels;
  readonly plan?: { canChat: boolean; usage: { chatMsgs: number }; limits: { chatMsgs: number } };
}

export interface AnalysisReportLabels {
  readonly scoreLabel: string;
  readonly criticalLabel: string;
  readonly cautionLabel: string;
  readonly findingsHeading: string;
  readonly cleanTitle: string;
  readonly cleanDescription: string;
  /** `${n} characters` — a template, because the noun and its position are translatable. */
  readonly charCount: (count: number) => string;
  /**
   * Takes the raw ISO timestamp and returns a formatted one.
   *
   * The formatting happens at the call site, where the locale is known, rather than here —
   * `toLocaleString()` called inside a Server Component uses the *server's* locale and time
   * zone, which is how a user in Berlin ends up being told their document was analysed at
   * four in the morning.
   */
  readonly analyzedAt: (iso: string) => string;
  /** The "this is not legal advice" line. Product copy, not a component's opinion. */
  readonly disclaimer: string;
}

/**
 * The score's tone is the level the domain already assigned, mapped 1:1 onto the reserved
 * risk palette.
 *
 * Written as a lookup rather than passing `analysis.score.level` straight through, because
 * `RiskLevel` and `Tone` are separate types on purpose — the design system's tone vocabulary
 * is larger and may grow, and the domain must not have to change when it does. The map is the
 * one place the two vocabularies are pinned together, and `satisfies` makes a divergence a
 * compile error here instead of a wrong colour in production.
 */
import { type Tone } from '@/shared/ui';
import {
  Copy,
  RefreshCw,
  Archive,
  Trash2,
  ShieldCheck,
  Scale,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { WorkspacePane } from './workspace-pane';
import { MarkdownRenderer } from './markdown-renderer';
import { DocumentSettings } from './document-settings';
import { SmartActionPlan } from './smart-action-plan';
import { ExpertEscalation } from './expert-escalation';
import { shouldOfferEscalation } from '../application/experts';
import { ShareExportMenu } from './share-button';
import { CalendarMenu } from './calendar-menu';
import { ReminderButton } from './reminder-button';

const SCORE_TONE = {
  critical: 'critical',
  caution: 'caution',
  safe: 'safe',
} as const satisfies Record<AnalysisDto['score']['level'], Tone>;

const isLikelyFilename = (title: string) => /\.[a-z0-9]+$/i.test(title);

const getCleanTitle = (title: string) => {
  if (!title || title === 'Document Analysis') return 'Document Analysis';
  if (!isLikelyFilename(title)) return title;

  let name = title.replace(/\.[^/.]+$/, ''); // strip extension
  name = name.replace(/^[0-9]+-/, ''); // strip numeric prefix
  name = name.replace(/[-_]/g, ' '); // replace dashes with spaces

  // Title case it for better aesthetics
  name = name.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );

  return name.trim();
};

const hasLostInformation = (title: string) => {
  if (!isLikelyFilename(title)) return false;
  // If it had a numeric prefix that we stripped, it lost information (e.g. 611285713-)
  return /^[0-9]+-/.test(title);
};

export function AnalysisReport({ analysis, labels, plan }: AnalysisReportProps) {
  const urgency =
    analysis.urgency ||
    (analysis.score.level === 'critical'
      ? 'critical'
      : analysis.score.level === 'caution'
        ? 'medium'
        : 'low');

  const derivedActionPlan =
    analysis.actionPlan && analysis.actionPlan.length > 0
      ? [...analysis.actionPlan]
      : analysis.flags
          .map((f) => f.recommendation)
          .filter((rec): rec is string => !!rec)
          .slice(0, 4);

  if (derivedActionPlan.length === 0) {
    derivedActionPlan.push(
      analysis.flags.length === 0
        ? 'Proceed with signing the document.'
        : 'Review the highlighted clauses carefully.',
    );
  }

  const actionPlan = derivedActionPlan;

  const summary =
    analysis.summary ||
    (analysis.flags.length > 0
      ? `We detected ${analysis.score.criticalCount} critical issue(s) and ${analysis.score.cautionCount} moderate risk(s) in this ${DOCUMENT_TYPE_LABEL[analysis.documentType].toLowerCase()}. Please review the action plan before proceeding.`
      : `This ${DOCUMENT_TYPE_LABEL[analysis.documentType].toLowerCase()} appears clean. We found no predatory clauses or hidden liabilities.`);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-1 lg:flex-row">
      {/* LEFT PANE: Report Data (Scrollable) */}
      <div className="custom-scrollbar relative block h-full flex-1 overflow-y-auto pb-10">
        <div className="pointer-events-none absolute top-0 left-0 h-[300px] w-full bg-gradient-to-b from-brand-primary/5 to-transparent" />

        {/* -- Header ---------------------------------- */}
        <div className="relative sticky top-0 z-30 flex flex-col gap-3 border-b border-border-strong bg-surface-1/95 px-6 pt-6 pb-4 shadow-sm backdrop-blur-md md:px-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <Heading
                level={1}
                size="lg"
                className="font-geist flex flex-1 items-center gap-2 overflow-hidden leading-snug tracking-tight text-text-primary"
              >
                <span className="shrink-0 whitespace-nowrap">{getCleanTitle(analysis.title)}</span>
                {hasLostInformation(analysis.title) && (
                  <span className="mt-0.5 truncate text-base font-normal text-text-secondary opacity-70 md:text-lg">
                    ({analysis.title})
                  </span>
                )}
              </Heading>
              <Badge
                tone={SCORE_TONE[analysis.score.level]}
                dot
                className="shrink-0 border-current/30 px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap uppercase shadow-sm"
              >
                {analysis.score.level === 'critical'
                  ? 'Critical — Act Now'
                  : analysis.score.level === 'caution'
                    ? 'Review Recommended'
                    : 'Safe to Proceed'}
              </Badge>
            </div>

            {/* Category + specialized intelligence badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 px-2.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                {DOCUMENT_TYPE_LABEL[analysis.documentType]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-ink">
                Specialized analysis
              </span>
              <span className="ml-auto text-[11px] font-medium text-text-tertiary opacity-80">
                {labels.analyzedAt(analysis.analyzedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-4 px-6 md:flex-row md:px-8">
          {/* -- Relief moment — emotional reassurance ------------------ */}
          <div
            className={`flex flex-1 flex-col justify-center gap-1.5 rounded-xl border px-4 py-3.5 shadow-sm ${
              analysis.score.level === 'critical'
                ? 'border-risk-critical-border bg-risk-critical-bg text-risk-critical-fg'
                : analysis.score.level === 'caution'
                  ? 'border-risk-caution-border bg-risk-caution-bg text-risk-caution-fg'
                  : 'border-risk-safe-border bg-risk-safe-bg text-risk-safe-fg'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 opacity-90" />
              Analysis Status
            </div>
            <p className="pl-6 text-xs leading-relaxed font-medium opacity-90">
              {analysis.score.level === 'critical'
                ? 'This document contains critical risks. Please review the recommended actions before proceeding.'
                : analysis.score.level === 'caution'
                  ? 'We found some clauses that require your attention. Review the action plan below.'
                  : 'This document appears safe to proceed. No predatory clauses were found.'}
            </p>
          </div>

          {/* -- Legitimacy Banner --------------------------------------- */}
          {analysis.legitimacy && (
            <div
              className={`flex flex-1 flex-col justify-center gap-1.5 rounded-xl border px-4 py-3.5 shadow-sm ${
                analysis.legitimacy === 'SUSPICIOUS'
                  ? 'border-risk-critical-border bg-risk-critical-bg text-risk-critical-fg'
                  : analysis.legitimacy === 'UNVERIFIABLE'
                    ? 'border-border-subtle bg-surface-2 text-text-secondary'
                    : 'border-risk-safe-border bg-risk-safe-bg text-risk-safe-fg'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 opacity-90" />
                Authenticity Signal
              </div>
              <p className="pl-6 text-xs leading-relaxed font-medium opacity-90">
                {analysis.legitimacy === 'SUSPICIOUS'
                  ? 'Warning: This document shows potential markers of fraud or an unfair scam.'
                  : analysis.legitimacy === 'UNVERIFIABLE'
                    ? 'Not enough signal to judge. Confirm through official channels.'
                    : 'This document appears to be legitimate and standard.'}
              </p>
            </div>
          )}
        </div>

        {/* Summary — Markdown rendered */}
        <div className="mt-2 px-6 md:px-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            </div>
            <p className="text-sm leading-none font-bold text-text-primary">Executive Summary</p>
          </div>
          <div className="rounded-2xl border border-border-subtle/50 bg-surface-2 p-5 shadow-sm">
            <MarkdownRenderer summary={summary} analysis={analysis} urgency={urgency} />
          </div>
        </div>

        {/* -- Smart action plan (interactive checklist) -------------------- */}
        <div className="mt-4 px-6 md:px-8">
          <SmartActionPlan actions={actionPlan} documentTitle={analysis.title} />
        </div>

        {/* -- Expert escalation (high-risk docs only) ------------------- */}
        {shouldOfferEscalation({ category: null, docPack: null, urgency: urgency as any }) && (
          <div className="mt-6 mb-3 px-6 md:px-8">
            <ExpertEscalation
              documentId={analysis.id}
              category={null}
              docPack={null}
              urgency={urgency as any}
            />
          </div>
        )}

        {/* -- Trust Layer: evidence quotes --------------------- */}
        {analysis.flags.length > 0 && (
          <div className="mt-4 px-6 md:px-8">
            <details className="group relative z-10 rounded-2xl border border-border-subtle bg-surface-2 px-5 py-4 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-text-secondary">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Why we concluded this (Source Quotes)
                </span>
                {analysis.confidence && (
                  <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-[10px] font-medium">
                    {analysis.confidence}
                  </span>
                )}
              </summary>
              <div className="mt-4 flex flex-col gap-3">
                {analysis.flags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 border-l-2 border-brand-primary/30 pl-3"
                  >
                    <p className="text-[11px] font-bold tracking-widest text-text-tertiary uppercase">
                      {flag.title}
                    </p>
                    <p className="rounded-md bg-surface-1 px-3 py-2 font-serif text-sm leading-relaxed text-text-secondary italic">
                      "{flag.excerpt}"
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-text-tertiary">
                Informational only — not legal, tax, or financial advice.
              </p>
            </details>
          </div>
        )}

        {/* -- Key Entities -------------------------------------------------- */}
        {analysis.entities && analysis.entities.length > 0 && (
          <div className="mt-6 px-6 md:px-8">
            <div className="relative z-10 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-2 p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
                </div>
                <p className="text-sm leading-none font-semibold text-text-primary">Key Entities</p>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {analysis.entities.map((ent, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 rounded-xl border border-border-subtle/50 bg-surface-1 p-3"
                  >
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
                      {ent.label}
                    </span>
                    <span
                      className="truncate text-sm font-medium text-text-primary"
                      title={ent.value}
                    >
                      {ent.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -- Settings / Toggles ------------------------------------------ */}
        <div className="mt-4 px-6 md:px-8">
          <DocumentSettings documentId={analysis.id} />
        </div>

        {/* Findings */}
        <section className="relative z-10 mt-6 flex flex-col gap-6 px-6 md:px-8">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex flex-col gap-1">
              <Heading level={2} size="md" className="font-geist tracking-tight text-text-primary">
                {labels.findingsHeading}
              </Heading>
              <Text size="sm" tone="secondary">
                Worst clause first. Open a finding to see the exact wording it came from.
              </Text>
            </div>
            <Badge tone="neutral" className="hidden text-sm font-bold shadow-sm sm:inline-flex">
              {analysis.flags.length} Flagged Clauses
            </Badge>
          </div>

          {analysis.flags.length === 0 ? (
            <EmptyState title={labels.cleanTitle} description={labels.cleanDescription} />
          ) : (
            <Accordion variant="separated">
              {analysis.flags.map((flag) => (
                <RiskFlagCard key={flag.id} documentId={analysis.id} flag={flag} />
              ))}
            </Accordion>
          )}
        </section>

        {/* -- BOTTOM SECTION — Quick Actions ----------------------------- */}
        <div className="mt-10 mb-8 px-6 md:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-1 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="pointer-events-none absolute top-0 left-0 h-[120px] w-full bg-gradient-to-br from-brand-primary/5 via-brand-primary/[0.02] to-transparent" />

            <div className="flex items-center justify-between border-b border-border-subtle/50 bg-surface-2/30 px-6 py-4 backdrop-blur-md">
              <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-text-secondary uppercase">
                <ShieldCheck className="h-4 w-4 text-brand-primary opacity-80" /> Action Center
              </p>
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-primary/40"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/20"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary/20"></span>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2 p-6 sm:gap-3">
              <ShareExportMenu documentId={analysis.id} title={analysis.title} />

              <CalendarMenu
                title={`Review Document: ${analysis.title}`}
                dateString={new Date().toISOString().split('T')[0] as string}
                options={{
                  urgency: analysis.score.level,
                  summary: analysis.summary ?? '',
                  documentUrl: `https://paperlens.app/document/${analysis.id}`,
                }}
                variant="icon"
              />
              <ReminderButton
                document={{
                  id: analysis.id,
                  title: analysis.title,
                  score: { level: analysis.score.level },
                }}
                deadlineDate={null}
                variant="icon"
              />

              <div className="mx-1 hidden h-8 w-px bg-border-strong/50 sm:mx-2 md:block" />

              <div className="ml-auto flex flex-1 flex-wrap justify-end gap-2 sm:flex-nowrap sm:gap-3 md:flex-none">
                <button
                  title="Copy summary"
                  className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-text-secondary transition-all duration-200 hover:border-border-strong hover:bg-surface-raised hover:text-text-primary hover:shadow-sm"
                >
                  <Copy className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-text-primary" />
                  <span className="text-xs leading-none font-semibold">Copy</span>
                </button>
                <button
                  title="Re-analyze document"
                  className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-2.5 text-brand-primary transition-all duration-200 hover:border-brand-primary/40 hover:bg-brand-primary/10 hover:shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-xs leading-none font-semibold">Retry</span>
                </button>
                <button
                  title="Archive document"
                  className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-text-secondary transition-all duration-200 hover:border-border-strong hover:bg-surface-raised hover:text-text-primary hover:shadow-sm"
                >
                  <Archive className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-text-primary" />
                  <span className="hidden text-xs leading-none font-semibold sm:inline">
                    Archive
                  </span>
                </button>
                <button
                  title="Delete document"
                  className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-risk-critical-border/50 bg-risk-critical-bg/30 px-4 py-2.5 text-risk-critical-fg transition-all duration-200 hover:border-risk-critical-border hover:bg-risk-critical-bg hover:shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden text-xs leading-none font-semibold sm:inline">
                    Delete
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="relative z-10 mt-4 flex flex-col gap-2 border-t border-border-subtle px-6 pt-6 md:px-8">
          <Text as="span" size="xs" tone="tertiary">
            <time dateTime={analysis.analyzedAt}>{labels.analyzedAt(analysis.analyzedAt)}</time>
          </Text>
          <Text size="xs" tone="tertiary" measure>
            {labels.disclaimer}
          </Text>
        </footer>
      </div>

      {/* RIGHT PANE: Workspace (Chat & Source Document) */}
      <WorkspacePane
        documentId={analysis.id}
        suggestedQuestions={analysis.suggestedQuestions}
        rawText={analysis.rawText}
        fileUrl={analysis.fileUrl}
        mimeType={analysis.mimeType}
        plan={plan}
      />
    </div>
  );
}
