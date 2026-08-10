import { describe, expect, it } from 'vitest';

import { type RiskFlag, type RiskLevel } from './document';
import { countByLevel, highestLevel, RISK_SEVERITY, scoreOf, sortFlags } from './risk';

/**
 * The scoring rules, tested with no container, no framework and no I/O — which is the entire
 * return on keeping `domain/` at the bottom of the dependency graph. These run in single-digit
 * milliseconds, so the product's actual opinion about risk can be exercised exhaustively
 * instead of sampled through an integration test.
 *
 * The assertions are written against *behaviour the product cares about* rather than against
 * the arithmetic. "One critical clause cannot yield a passing score" is a rule worth pinning;
 * `28` is an implementation detail that should be free to change as long as the rule holds.
 */

const flag = (level: RiskLevel, charStart = 0, id = `${level}-${charStart}`): RiskFlag => ({
 id,
 category: 'arbitration',
 level,
 title: `${level} finding`,
 excerpt: 'text',
 explanation: 'why',
 charStart,
 charEnd: charStart + 10,
});

describe('countByLevel', () => {
 it('counts every level, including the ones with no findings', () => {
 expect(countByLevel([flag('critical'), flag('caution'), flag('caution')])).toEqual({
 critical: 1,
 caution: 2,
 safe: 0,
 });
 });

 it('returns zeros rather than an empty object for a clean document', () => {
 // A missing key would force every consumer to write `counts.critical ?? 0`.
 expect(countByLevel([])).toEqual({ critical: 0, caution: 0, safe: 0 });
 });
});

describe('highestLevel', () => {
 it('finds the worst level present regardless of order', () => {
 expect(highestLevel([flag('safe'), flag('critical'), flag('caution')])).toBe('critical');
 expect(highestLevel([flag('safe'), flag('caution')])).toBe('caution');
 });

 it('is safe for a document with no findings', () => {
 expect(highestLevel([])).toBe('safe');
 });
});

describe('sortFlags', () => {
 it('puts worse findings first, then orders by position in the document', () => {
 const sorted = sortFlags([
 flag('caution', 50),
 flag('critical', 90),
 flag('caution', 10),
 flag('critical', 30),
 ]);

 expect(sorted.map((f) => [f.level, f.charStart])).toEqual([
 ['critical', 30],
 ['critical', 90],
 ['caution', 10],
 ['caution', 50],
 ]);
 });

 it('does not mutate its input — the caller may still be rendering it', () => {
 const input = [flag('caution', 10), flag('critical', 0)];
 const before = [...input];

 sortFlags(input);

 expect(input).toEqual(before);
 });
});

describe('scoreOf', () => {
 it('gives a clean document a perfect, safe score', () => {
 expect(scoreOf([])).toEqual({
 value: 100,
 level: 'safe',
 counts: { critical: 0, caution: 0, safe: 0 },
 });
 });

 it('never returns a negative value, however bad the document', () => {
 // Nine critical clauses is not "more than totally unsafe", and a negative number on a
 // 0–100 dial is a bug the user gets to see.
 const terrible = Array.from({ length: 9 }, (_, index) => flag('critical', index * 10));

 expect(scoreOf(terrible).value).toBe(0);
 expect(scoreOf(terrible).level).toBe('critical');
 });

 it('distinguishes "contains a bad term" from "is a bad contract"', () => {
 // The headline level is deliberately not `highestLevel`. One critical clause among fair
 // language reads differently from a document that is critical throughout, and the score is
 // what carries that distinction.
 const one = scoreOf([flag('critical')]);
 const several = scoreOf([flag('critical', 0), flag('critical', 20)]);

 expect(highestLevel([flag('critical')])).toBe('critical');
 expect(one.level).not.toBe('critical');
 expect(several.level).toBe('critical');
 expect(several.value).toBeLessThan(one.value);
 });

 it('weights a critical clause more heavily than any number of cautions of equal count', () => {
 expect(scoreOf([flag('critical')]).value).toBeLessThan(scoreOf([flag('caution')]).value);

 // …and a long document of minor caveats does not sink below a short catastrophic one.
 const manyCautions = Array.from({ length: 3 }, (_, index) => flag('caution', index * 10));
 expect(scoreOf(manyCautions).value).toBeGreaterThan(
 scoreOf([flag('critical', 0), flag('critical', 20)]).value,
 );
 });

 it('treats safe findings as informational — they cost nothing', () => {
 expect(scoreOf([flag('safe'), flag('safe')]).value).toBe(100);
 expect(scoreOf([flag('safe')]).counts.safe).toBe(1);
 });

 it('is monotonic: adding a finding never improves the score', () => {
 const levels: RiskLevel[] = ['safe', 'caution', 'critical'];
 let flags: RiskFlag[] = [];
 let previous = scoreOf(flags).value;

 for (const [index, level] of levels.entries()) {
 flags = [...flags, flag(level, index * 10)];
 const current = scoreOf(flags).value;
 expect(current).toBeLessThanOrEqual(previous);
 previous = current;
 }
 });

 it('carries the counts alongside the verdict, so the UI never recounts', () => {
 const score = scoreOf([flag('critical'), flag('caution', 10), flag('caution', 20)]);
 expect(score.counts).toEqual({ critical: 1, caution: 2, safe: 0 });
 });
});

describe('RISK_SEVERITY', () => {
 it('orders the three levels worst-first', () => {
 expect(RISK_SEVERITY.critical).toBeGreaterThan(RISK_SEVERITY.caution);
 expect(RISK_SEVERITY.caution).toBeGreaterThan(RISK_SEVERITY.safe);
 });
});
