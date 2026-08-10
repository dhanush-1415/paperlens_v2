import 'server-only';

import { attempt } from '@/core/errors/boundaries';
import { uuid } from '@/shared/utils/id';

import { CLAUSE_CATEGORY_LABEL } from '../constants';
import { type AnalysisRequest, type ClauseCategory, type DocumentAnalyzer, type RiskFlag, type RiskLevel } from '../domain';

/**
 * A rule-based `DocumentAnalyzer`. **This is a stand-in, and it is named like one.**
 *
 * ### What it actually is
 *
 * Not a stub. It reads the document, finds real clauses, quotes them back with real offsets
 * and produces a real score — the whole stack above it is exercised against genuine data, and
 * pasting a real rental agreement into `/scan` produces findings a person would recognise.
 * A `throw new Error('not implemented')` would have made every layer above it untestable and
 * every screenshot a lie.
 *
 * ### What it is not
 *
 * It is not a lawyer, and it is not the analyzer this product ships with. It matches phrasing,
 * so it misses a clause written in unusual language and flags one quoted inside a sentence
 * saying the opposite ("this agreement contains no arbitration clause"). Precision like that
 * needs a language model, and a language model needs a vendor decision, an API key, a cost
 * model and a latency budget — none of which exist yet.
 *
 * ### Why that is fine
 *
 * Because it implements the port. The day the real one arrives it is a new file, a new
 * binding in `module.ts`, and no change anywhere else — the use case, the action, the cache
 * tags, the DTO and every component keep working because none of them can name this class.
 * The shared contract suite runs against both, which is what makes that claim checkable
 * rather than hopeful.
 */

interface ClauseRule {
 readonly category: ClauseCategory;
 readonly level: RiskLevel;
 /**
 * Case-insensitive, non-global. Non-global matters: a `/g` regex carries `lastIndex`
 * between calls, so a shared module-level pattern silently skips matches on every second
 * document. The scan below controls position itself instead.
 */
 readonly pattern: RegExp;
 readonly title: string;
 readonly explanation: string;
 readonly recommendation?: string;
}

/**
 * The rulebook.
 *
 * Data, not code — a `switch` with ten branches would put the product's legal opinions inside
 * control flow, where they cannot be counted, tested individually or handed to someone who
 * knows contract law but not TypeScript. Adding a rule is adding an object.
 */
const RULES: readonly ClauseRule[] = [
 {
 category: 'auto_renewal',
 level: 'critical',
 pattern: /\b(automatically renew|auto-renew|renews? automatically|evergreen (term|clause))\b/i,
 title: 'Renews automatically',
 explanation:
 'This agreement continues on its own unless you cancel in time. Missing the window commits you to another full term.',
 recommendation: 'Set a calendar reminder for the cancellation deadline the day you sign.',
 },
 {
 category: 'arbitration',
 level: 'critical',
 pattern: /\b(binding arbitration|waive[sd]? (any |the )?right to (a )?(jury|trial)|class action waiver)\b/i,
 title: 'You give up the right to sue',
 explanation:
 'Disputes must go to a private arbitrator instead of a court, and you cannot join a class action. Arbitration is usually cheaper for the company and harder for you to win.',
 recommendation: 'Check whether there is an opt-out window — many agreements allow one within 30 days.',
 },
 {
 category: 'unilateral_change',
 level: 'critical',
 pattern:
 /\b(may (modify|change|amend|update) these terms at any time|reserves? the right to (modify|change|amend)|without (prior )?notice to you)\b/i,
 title: 'Terms can change without telling you',
 explanation:
 'The other side can rewrite this agreement after you have signed it. What you agreed to today is not what binds you tomorrow.',
 recommendation: 'Ask for a clause requiring written notice and a right to cancel on change.',
 },
 {
 category: 'termination_penalty',
 level: 'critical',
 pattern: /\b(early termination fee|liquidated damages|forfeit (the |your )?(deposit|security deposit))\b/i,
 title: 'Leaving early is expensive',
 explanation: 'Ending this agreement before its term costs you money on top of what you already owe.',
 recommendation: 'Get the exact figure in writing before signing — "reasonable costs" can mean anything.',
 },
 {
 category: 'liability_cap',
 level: 'caution',
 pattern:
 /\b(limitation of liability|shall not be liable|in no event (shall|will)|maximum (aggregate )?liability)\b/i,
 title: 'Their liability is capped',
 explanation:
 'If something goes wrong, the amount you can recover is limited — often to what you have already paid, however large the actual loss.',
 },
 {
 category: 'indemnity',
 level: 'caution',
 pattern: /\b(indemnif(y|ication)|hold harmless|defend (and hold )?harmless)\b/i,
 title: 'You cover their legal costs',
 explanation:
 "You agree to pay the other side's losses and legal fees arising from your use of the service. This obligation can outlive the agreement.",
 recommendation: 'Check whether it is capped and whether it survives termination.',
 },
 {
 category: 'late_fee',
 level: 'caution',
 pattern: /\b(late (payment )?(fee|charge)|interest (of|at) [\d.]+ ?%|per annum|default interest)\b/i,
 title: 'Late payments carry a penalty',
 explanation: 'Paying after the due date adds a fee or interest, which compounds if the balance stays unpaid.',
 },
 {
 category: 'data_sharing',
 level: 'caution',
 // `part(y|ies)`, not `part`. The group is followed by `\b`, so the bare stem only
 // matched the singular — "third party" was flagged and "third parties" was not, which is
 // the wording almost every privacy policy actually uses. A rule that misses the common
 // phrasing of its own clause is worse than no rule: it reports a clean document.
 pattern:
 /\b(share (your )?(personal )?(data|information) with (third|our) part(y|ies)|sell (your )?(personal )?(data|information)|marketing partners)\b/i,
 title: 'Your data goes to third parties',
 explanation:
 'Information you provide may be passed to companies you have no relationship with, for purposes you have not chosen.',
 recommendation: 'Look for an opt-out, and for whether the list of recipients is named or open-ended.',
 },
 {
 category: 'non_compete',
 level: 'caution',
 pattern: /\b(non-compet|shall not (directly or indirectly )?(compete|engage in)|restrictive covenant)\b/i,
 title: 'Limits on your future work',
 explanation:
 'This restricts what work you can take on after the agreement ends. Enforceability varies a great deal by jurisdiction.',
 },
 {
 category: 'jurisdiction',
 level: 'safe',
 pattern: /\b(governed by the laws of|exclusive jurisdiction|venue (shall|will) (be|lie))\b/i,
 title: 'Disputes are heard elsewhere',
 explanation:
 'Any legal action happens under the named jurisdiction, which may be far from where you live and expensive to reach.',
 },
];

/** Excerpts longer than this are trimmed. A quotation nobody reads is not evidence. */
const MAX_EXCERPT = 320;

/**
 * Split into sentence-ish spans, keeping each one's offset in the source.
 *
 * Offsets are computed by walking the string rather than by `indexOf`-ing each piece back
 * into it: a document that repeats a sentence — and contracts repeat themselves constantly —
 * would otherwise have every later copy report the position of the first.
 */
function segments(text: string): readonly { text: string; start: number }[] {
 const out: { text: string; start: number }[] = [];
 const pattern = /[^.!?\n]+[.!?]*\n?/g;

 let match: RegExpExecArray | null;
 while ((match = pattern.exec(text)) !== null) {
 const raw = match[0];
 const leading = raw.length - raw.trimStart().length;
 const trimmed = raw.trim();
 if (trimmed.length > 0) out.push({ text: trimmed, start: match.index + leading });
 }

 return out;
}

function excerptOf(segment: string): string {
 return segment.length > MAX_EXCERPT ? `${segment.slice(0, MAX_EXCERPT - 1).trimEnd()}…` : segment;
}

export function createHeuristicAnalyzer(): DocumentAnalyzer {
 return {
 name: 'heuristic-v1',

 async analyze(request: AnalysisRequest) {
 /**
 * Wrapped in `attempt` even though nothing here is expected to throw.
 *
 * A regex against a 200,000-character document can exceed the stack on a pathological
 * input, and the port promises a `Result` rather than a throw. `attempt` normalizes
 * whatever escapes into an `AppError` — and `normalizeError` rethrows Next's
 * control-flow signals first, so a future adapter that calls `notFound()` still works.
 */
 return attempt(async () => {
 const found: RiskFlag[] = [];
 /**
 * One flag per category, not per match.
 *
 * A contract mentions arbitration in four places; four identical cards is noise that
 * buries the other nine findings. The first occurrence is the one quoted because it is
 * where a reader would meet the clause.
 */
 const seen = new Set<ClauseCategory>();

 for (const segment of segments(request.text)) {
 for (const rule of RULES) {
 if (seen.has(rule.category)) continue;
 if (!rule.pattern.test(segment.text)) continue;

 seen.add(rule.category);
 found.push({
 id: uuid(),
 category: rule.category,
 level: rule.level,
 title: rule.title,
 excerpt: excerptOf(segment.text),
 explanation: rule.explanation,
 ...(rule.recommendation === undefined ? {} : { recommendation: rule.recommendation }),
 charStart: segment.start,
 charEnd: segment.start + segment.text.length,
 });
 }
 }

 return found as readonly RiskFlag[];
 });
 },
 };
}

/**
 * Every rule's category must have a label.
 *
 * A rule whose category is not in `CLAUSE_CATEGORY_LABEL` would render a blank chip in the
 * report — a defect that is invisible until someone pastes the one contract that triggers it.
 * This constant is never read at runtime; its only job is to make the omission a type error
 * at the moment the rule is added.
 */
const _EVERY_RULE_IS_LABELLED: readonly string[] = RULES.map(
 (rule) => CLAUSE_CATEGORY_LABEL[rule.category],
);
void _EVERY_RULE_IS_LABELLED;
