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
import Markdown from 'react-markdown';
import { Copy, RefreshCw, Archive, Trash2, ShieldCheck, Scale, Globe, CheckCircle2, Sparkles } from 'lucide-react';
import { WorkspacePane } from './workspace-pane';
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

export function AnalysisReport({ analysis, labels }: AnalysisReportProps) {
  const urgency = analysis.urgency || (analysis.score.level === 'critical' ? 'critical' : analysis.score.level === 'caution' ? 'medium' : 'low');
  
  const derivedActionPlan = analysis.actionPlan && analysis.actionPlan.length > 0
    ? [...analysis.actionPlan]
    : analysis.flags.map(f => f.recommendation).filter((rec): rec is string => !!rec).slice(0, 4);
    
  if (derivedActionPlan.length === 0) {
    derivedActionPlan.push(analysis.flags.length === 0 ? 'Proceed with signing the document.' : 'Review the highlighted clauses carefully.');
  }

  const actionPlan = derivedActionPlan;

  const summary = analysis.summary || (analysis.flags.length > 0 
    ? `We detected ${analysis.score.criticalCount} critical issue(s) and ${analysis.score.cautionCount} moderate risk(s) in this ${DOCUMENT_TYPE_LABEL[analysis.documentType].toLowerCase()}. Please review the action plan before proceeding.`
    : `This ${DOCUMENT_TYPE_LABEL[analysis.documentType].toLowerCase()} appears clean. We found no predatory clauses or hidden liabilities.`);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-surface-1">
      {/* LEFT PANE: Report Data (Scrollable) */}
      <div className="flex-1 overflow-y-auto h-full p-6 md:p-8 flex flex-col gap-6 custom-scrollbar relative">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
        
        {/* -- Header — badge + headline ---------------------------------- */}
        <div className="flex flex-col gap-3 relative z-20 bg-surface-1 border border-border-strong rounded-2xl overflow-hidden shadow-md sticky top-0 mt-[-8px]">
          {/* Badge row + scanned date */}
          <div className={`px-5 pt-4 pb-3 flex items-center justify-between gap-3 border-b ${
            analysis.score.level === 'critical' ? 'bg-risk-critical-bg border-risk-critical-border' :
            analysis.score.level === 'caution' ? 'bg-risk-caution-bg border-risk-caution-border' :
            'bg-risk-safe-bg border-risk-safe-border'
          }`}>
            {/* Priority badge */}
            <div className="relative shrink-0">
              <Badge tone={SCORE_TONE[analysis.score.level]} dot className="font-semibold text-xs py-1 px-3 uppercase tracking-wide border-current/30">
                {analysis.score.level === 'critical' ? 'Critical — Act Now' : analysis.score.level === 'caution' ? 'Review Recommended' : 'Safe to Proceed'}
              </Badge>
            </div>
            <span className="text-[11px] font-medium opacity-80 shrink-0">
              {labels.analyzedAt(analysis.analyzedAt)}
            </span>
          </div>

          {/* Headline */}
          <div className="px-5 pb-5 pt-1 bg-surface-1">
            <Heading level={1} size="lg" className="font-geist tracking-tight text-text-primary leading-snug">
              {analysis.title || 'Document Analysis'}
            </Heading>
            {/* Category + specialized intelligence badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 px-2.5 py-0.5 text-[10px] font-semibold text-text-secondary">
                {DOCUMENT_TYPE_LABEL[analysis.documentType]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-ink">
                Specialized analysis
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-2">
          {/* -- Relief moment — emotional reassurance ------------------ */}
          <div className={`flex-1 flex flex-col justify-center gap-1.5 rounded-xl border px-4 py-3.5 shadow-sm ${
            analysis.score.level === 'critical' ? 'bg-risk-critical-bg border-risk-critical-border text-risk-critical-fg' :
            analysis.score.level === 'caution' ? 'bg-risk-caution-bg border-risk-caution-border text-risk-caution-fg' :
            'bg-risk-safe-bg border-risk-safe-border text-risk-safe-fg'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 opacity-90" />
              Analysis Status
            </div>
            <p className="text-xs font-medium leading-relaxed opacity-90 pl-6">
              {analysis.score.level === 'critical' 
                ? 'This document contains critical risks. Please review the recommended actions before proceeding.' 
                : analysis.score.level === 'caution'
                ? 'We found some clauses that require your attention. Review the action plan below.'
                : 'This document appears safe to proceed. No predatory clauses were found.'}
            </p>
          </div>

          {/* -- Legitimacy Banner --------------------------------------- */}
          {analysis.legitimacy && (
            <div className={`flex-1 flex flex-col justify-center gap-1.5 rounded-xl border px-4 py-3.5 shadow-sm ${
              analysis.legitimacy === 'SUSPICIOUS' ? 'bg-risk-critical-bg border-risk-critical-border text-risk-critical-fg' : 
              analysis.legitimacy === 'UNVERIFIABLE' ? 'bg-surface-2 border-border-subtle text-text-secondary' :
              'bg-risk-safe-bg border-risk-safe-border text-risk-safe-fg'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 opacity-90" />
                Authenticity Signal
              </div>
              <p className="text-xs font-medium opacity-90 leading-relaxed pl-6">
                {analysis.legitimacy === 'SUSPICIOUS' ? 'Warning: This document shows potential markers of fraud or an unfair scam.' : 
                 analysis.legitimacy === 'UNVERIFIABLE' ? 'Not enough signal to judge. Confirm through official channels.' :
                 'This document appears to be legitimate and standard.'}
              </p>
            </div>
          )}
        </div>

        {/* Summary — Markdown rendered */}
        <div className="px-1 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            </div>
            <p className="text-sm font-bold text-text-primary leading-none">Executive Summary</p>
          </div>
          <div className="p-5 rounded-2xl bg-surface-2 border border-border-subtle/50 shadow-sm">
            <div className="prose prose-sm prose-neutral max-w-none prose-p:leading-relaxed prose-p:text-text-secondary prose-strong:text-text-primary prose-ul:text-text-secondary prose-ul:list-disc prose-ul:pl-5 prose-li:marker:text-text-tertiary prose-li:my-1.5 prose-headings:text-text-primary prose-headings:font-bold prose-headings:text-[10px] prose-headings:uppercase prose-headings:tracking-wider prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0">
              <Markdown>
                {summary.includes('- ') || summary.includes('* ') ? summary : `${summary}\n\n**Key Takeaways:**\n- The document type is classified as **${DOCUMENT_TYPE_LABEL[analysis.documentType]}**.\n- Detected **${analysis.flags.length}** specific clauses requiring review.\n- Authenticity signal indicates the document is **${analysis.legitimacy === 'SUSPICIOUS' ? 'Suspicious' : 'Standard'}**.\n- Priority level for this review is set to **${urgency.toUpperCase()}**.`}
              </Markdown>
            </div>
          </div>
        </div>

        {/* -- Smart action plan (interactive checklist) -------------------- */}
        <SmartActionPlan actions={actionPlan} />

        {/* -- Expert escalation (high-risk docs only) ------------------- */}
        {shouldOfferEscalation({ category: null, docPack: null, urgency: urgency as any }) && (
          <div className="mt-6 mb-3">
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
          <details className="group relative z-10 rounded-2xl border border-border-subtle bg-surface-2 px-5 py-4 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-text-secondary">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Why we concluded this (Source Quotes)
              </span>
              {analysis.confidence && (
                <span className="rounded-full bg-surface-1 border border-border-subtle px-2 py-0.5 text-[10px] font-medium">{analysis.confidence}</span>
              )}
            </summary>
            <div className="mt-4 flex flex-col gap-3">
              {analysis.flags.map((flag, i) => (
                <div key={i} className="flex flex-col gap-1.5 border-l-2 border-brand-primary/30 pl-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">{flag.title}</p>
                  <p className="text-sm font-serif italic text-text-secondary leading-relaxed bg-surface-1 py-2 px-3 rounded-md">"{flag.excerpt}"</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-text-tertiary">Informational only — not legal, tax, or financial advice.</p>
          </details>
        )}

        {/* -- Key Entities -------------------------------------------------- */}
        {analysis.entities && analysis.entities.length > 0 && (
          <div className="flex flex-col gap-3 relative z-10 bg-surface-2 p-5 rounded-2xl border border-border-subtle shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
              </div>
              <p className="text-sm font-semibold text-text-primary leading-none">Key Entities</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {analysis.entities.map((ent, idx) => (
                <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-surface-1 border border-border-subtle/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1">
                    {ent.label}
                  </span>
                  <span className="text-sm font-medium text-text-primary truncate" title={ent.value}>
                    {ent.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* -- Settings / Toggles ------------------------------------------ */}
        <DocumentSettings documentId={analysis.id} />

        {/* Findings */}
        <section className="flex flex-col gap-6 relative z-10 mt-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex flex-col gap-1">
              <Heading level={2} size="md" className="font-geist tracking-tight text-text-primary">
                {labels.findingsHeading}
              </Heading>
              <Text size="sm" tone="secondary">Worst clause first. Open a finding to see the exact wording it came from.</Text>
            </div>
            <Badge tone="neutral" className="text-sm font-bold shadow-sm hidden sm:inline-flex">
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
        <div className="border-t border-border-subtle pt-6 pb-2 mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-3">Quick Actions</p>
          <div className="flex flex-wrap items-center gap-2">
            <ShareExportMenu documentId={analysis.id} title={analysis.title} />
            <CalendarMenu 
              title={`Review Document: ${analysis.title}`} 
              dateString={new Date().toISOString().split('T')[0] as string} 
              options={{ urgency: analysis.score.level, summary: analysis.summary ?? '', documentUrl: `https://paperlens.app/document/${analysis.id}` }} 
              variant="icon" 
              className="flex-1 min-w-[70px]"
            />
            <div className="flex-1 min-w-[70px]">
              <ReminderButton 
                document={{ id: analysis.id, title: analysis.title, score: { level: analysis.score.level } }}
                deadlineDate={null}
                variant="icon"
              />
            </div>
            <button title="Copy summary" className="flex-1 min-w-[70px] group flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent hover:border-border-subtle transition-all duration-150">
              <Copy className="h-4 w-4" />
              <span className="text-[10px] font-medium leading-none">Copy</span>
            </button>
            <button title="Re-analyze document" className="flex-1 min-w-[70px] group flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 border border-transparent hover:border-brand-primary/20 transition-all duration-150">
              <RefreshCw className="h-4 w-4" />
              <span className="text-[10px] font-medium leading-none">Re-analyze</span>
            </button>
            <button title="Archive document" className="flex-1 min-w-[70px] group flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent hover:border-border-subtle transition-all duration-150">
              <Archive className="h-4 w-4" />
              <span className="text-[10px] font-medium leading-none">Archive</span>
            </button>
            <button title="Delete document" className="flex-1 min-w-[70px] group flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer text-risk-critical-fg hover:bg-risk-critical-bg border border-transparent hover:border-risk-critical-border transition-all duration-150">
              <Trash2 className="h-4 w-4" />
              <span className="text-[10px] font-medium leading-none">Delete</span>
            </button>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-border-subtle pt-6 relative z-10">
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
      />
    </div>
  );
}
