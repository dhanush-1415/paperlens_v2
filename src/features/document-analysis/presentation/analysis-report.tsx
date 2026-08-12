import { Accordion, EmptyState, Heading, StatTile, Text } from '@/shared/ui';

import { type AnalysisDto } from '../application/dto';
import { DOCUMENT_TYPE_LABEL } from '../constants';
import { RiskFlagCard } from './risk-flag-card';
import { DocumentResultCard } from './document-result-card';
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
const SCORE_TONE = {
 critical: 'critical',
 caution: 'caution',
 safe: 'safe',
} as const satisfies Record<AnalysisDto['score']['level'], string>;

export function AnalysisReport({ analysis, labels }: AnalysisReportProps) {
  // Synthesize Copilot Data
  const urgency = analysis.score.level === 'critical' ? 'critical' : 
                  analysis.score.level === 'caution' ? 'medium' : 'low';
  
  const actionPlan = analysis.flags
    .map(f => f.recommendation)
    .filter((rec): rec is string => !!rec)
    .slice(0, 4);

  if (actionPlan.length === 0 && analysis.flags.length === 0) {
    actionPlan.push('Proceed with signing the document.');
  } else if (actionPlan.length === 0) {
    actionPlan.push('Review the highlighted clauses carefully.');
  }

  const summary = analysis.flags.length > 0 
    ? `We detected ${analysis.score.criticalCount} critical issue(s) and ${analysis.score.cautionCount} moderate risk(s) in this ${DOCUMENT_TYPE_LABEL[analysis.documentType].toLowerCase()}. Please review the action plan before proceeding.`
    : `This ${DOCUMENT_TYPE_LABEL[analysis.documentType].toLowerCase()} appears clean. We found no predatory clauses or hidden liabilities.`;

  return (
    <div className="flex flex-col gap-8">
      {/* Copilot Executive Summary */}
      <DocumentResultCard 
        summary={summary}
        urgency={urgency}
        confidenceScore={94} // Hardcoded for now, would be driven by AI metadata
        actionPlan={actionPlan}
      />

      {/* Legacy Stats (Kept for continuity) */}
      <div className="grid gap-4 sm:grid-cols-3">
 <StatTile
 label={labels.scoreLabel}
 /*
 * The headline number, toned. The tile takes the tone rather than deriving it from
 * the value: the thresholds live in `domain/risk.ts`, and a component that
 * re-derived "is 61 bad?" would be a second opinion on a question the domain has
 * already answered — and the two would drift the first time the weighting changed.
 */
 value={String(analysis.score.value)}
 tone={SCORE_TONE[analysis.score.level]}
 description={`${DOCUMENT_TYPE_LABEL[analysis.documentType]} · ${labels.charCount(analysis.charCount)}`}
 />
 <StatTile
 label={labels.criticalLabel}
 value={String(analysis.score.criticalCount)}
 /*
 * Toned only when non-zero. A red "0" is a contradiction: the colour says danger and
 * the number says none, and a user resolves that by learning to ignore the colour.
 */
 tone={analysis.score.criticalCount > 0 ? 'critical' : undefined}
 />
 <StatTile
 label={labels.cautionLabel}
 value={String(analysis.score.cautionCount)}
 tone={analysis.score.cautionCount > 0 ? 'caution' : undefined}
 />
 </div>

 <section className="flex flex-col gap-4">
 <Heading level={2} size="md">
 {labels.findingsHeading}
 </Heading>

 {analysis.flags.length === 0 ? (
 /*
 * A clean document gets a real answer, not an absence. "We read it and found
 * nothing" is a finding; an empty region reads as a failed analysis.
 */
 <EmptyState title={labels.cleanTitle} description={labels.cleanDescription} />
 ) : (
 <Accordion variant="separated">
 {analysis.flags.map((flag) => (
 <RiskFlagCard key={flag.id} documentId={analysis.id} flag={flag} />
 ))}
 </Accordion>
 )}
 </section>

 <section className="flex flex-col gap-4 mt-4">
 <CopilotChatWindow documentId={analysis.id} />
 </section>

 <footer className="flex flex-col gap-2 border-t border-border-subtle pt-6">
 {/*
 * `<time dateTime>` carries the machine-readable instant alongside the human string,
 * so the value survives copy-paste, feed readers and anything else that parses the
 * page. The visible text is whatever the caller's locale formatter produced.
 */}
 <Text as="span" size="xs" tone="tertiary">
 <time dateTime={analysis.analyzedAt}>{labels.analyzedAt(analysis.analyzedAt)}</time>
 </Text>

 {/*
 * Not legal advice — small, permanent, and on the page rather than in a modal nobody
 * reads. A product that tells people what their contract says has to be unambiguous
 * about what it is not.
 */}
 <Text size="xs" tone="tertiary" measure>
 {labels.disclaimer}
 </Text>
 </footer>
 </div>
 );
}
