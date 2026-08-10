/**
 * The scoring rules. Pure functions, no I/O, no clock, no framework.
 *
 * These are the only place in the codebase that decides what a document's risk *is*. Not the
 * analyzer adapter, which finds clauses; not the UI, which displays a verdict; not an email
 * template, which summarises one. If the product decides tomorrow that two cautions outweigh
 * one critical, this file changes and everything downstream follows.
 *
 * Keeping them here rather than in the adapter is the difference between a rule and a
 * coincidence: an LLM-backed analyzer and a regex-backed one must produce the same score for
 * the same set of flags, or the two are not interchangeable and the port is a lie.
 */

import { type RiskFlag, type RiskLevel, type RiskScore } from './document';

/**
 * Severity order, worst first.
 *
 * Duplicated in the design system's `RISK_ORDER` for sorting badges. That duplication is
 * deliberate and bounded — the UI must be able to sort without importing the domain, and the
 * domain must be able to score without importing the UI. It is two constants of three
 * elements, checked against each other by a test rather than shared through a dependency that
 * would point the wrong way.
 */
export const RISK_SEVERITY: Readonly<Record<RiskLevel, number>> = {
 critical: 3,
 caution: 2,
 safe: 1,
};

/**
 * Points deducted per finding.
 *
 * Chosen so that one critical clause alone cannot produce a passing score, and so that a long
 * document full of minor caveats does not sink below a short one containing a single
 * catastrophic term. The weights are the product's opinion, which is exactly why they live in
 * one named constant instead of being spelled out inside a reduce.
 */
const PENALTY: Readonly<Record<RiskLevel, number>> = {
 critical: 28,
 caution: 9,
 safe: 0,
};

/**
 * Below this, the headline verdict is `critical`; below the second, `caution`.
 *
 * Two numbers, one owner. The alternative — a `score < 50 ? 'critical' : …` ternary in a
 * component — is how a dashboard and a PDF export end up disagreeing about the same document.
 */
const THRESHOLD = {
 critical: 55,
 caution: 82,
} as const;

export function countByLevel(flags: readonly RiskFlag[]): Readonly<Record<RiskLevel, number>> {
 const counts: Record<RiskLevel, number> = { critical: 0, caution: 0, safe: 0 };
 for (const flag of flags) counts[flag.level] += 1;
 return counts;
}

/** The worst level present, or `safe` for a document with no findings. */
export function highestLevel(flags: readonly RiskFlag[]): RiskLevel {
 return flags.reduce<RiskLevel>(
 (worst, flag) => (RISK_SEVERITY[flag.level] > RISK_SEVERITY[worst] ? flag.level : worst),
 'safe',
 );
}

/** Worst first, then by position in the document, so the reading order is stable. */
export function sortFlags(flags: readonly RiskFlag[]): readonly RiskFlag[] {
 return [...flags].sort(
 (a, b) => RISK_SEVERITY[b.level] - RISK_SEVERITY[a.level] || a.charStart - b.charStart,
 );
}

/**
 * Score a set of findings.
 *
 * Clamped at zero: a document with nine critical clauses is not "more than totally unsafe",
 * and a negative number on a 0–100 dial is a bug the user gets to see. The headline `level`
 * is deliberately *not* simply `highestLevel(flags)` — a contract with one critical term
 * among otherwise fair language reads differently from one that is critical throughout, and
 * the score is what carries that distinction.
 */
export function scoreOf(flags: readonly RiskFlag[]): RiskScore {
 const counts = countByLevel(flags);
 const penalty = flags.reduce((total, flag) => total + PENALTY[flag.level], 0);
 const value = Math.max(0, Math.min(100, 100 - penalty));

 const level: RiskLevel =
 value < THRESHOLD.critical ? 'critical' : value < THRESHOLD.caution ? 'caution' : 'safe';

 return { value, level, counts };
}
