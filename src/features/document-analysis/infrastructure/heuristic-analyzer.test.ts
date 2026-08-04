import { describe, expect, it } from 'vitest';

import { isOk } from '@/core/result/result';

import { CLAUSE_CATEGORY_LABEL } from '../constants';
import type { AnalysisRequest, RiskFlag } from '../domain';
import { createHeuristicAnalyzer } from './heuristic-analyzer';

/**
 * The heuristic analyzer.
 *
 * This adapter is explicitly a stand-in for a language model, so the tests are deliberately
 * *not* about how clever it is. They are about the properties every analyzer that ever
 * replaces it must also hold, because those properties are what the layers above it assume:
 *
 * - offsets that actually point at the quoted text, since the report highlights the source
 *   by character range and a drifting offset highlights the wrong clause;
 * - one flag per category, because four identical arbitration cards bury the other findings;
 * - a `Result` rather than a throw, which is the port's contract;
 * - a label for every category it can emit, or the report renders a blank chip.
 *
 * When the real analyzer lands, this file is the checklist it has to pass.
 */

const analyzer = createHeuristicAnalyzer();

function request(text: string): AnalysisRequest {
  return { text, documentType: 'other' };
}

async function analyze(text: string): Promise<readonly RiskFlag[]> {
  const result = await analyzer.analyze(request(text));
  expect(isOk(result)).toBe(true);
  return isOk(result) ? result.value : [];
}

const ARBITRATION = 'Any dispute shall be resolved by binding arbitration.';
const AUTO_RENEWAL = 'This agreement will automatically renew for successive one-year terms.';

describe('detection', () => {
  it('finds a clause and reports its category and severity', async () => {
    const flags = await analyze(ARBITRATION);

    expect(flags).toHaveLength(1);
    expect(flags[0]?.category).toBe('arbitration');
    expect(flags[0]?.level).toBe('critical');
  });

  it('finds several distinct clauses in one document', async () => {
    const flags = await analyze(
      `${AUTO_RENEWAL} ${ARBITRATION} The Company shall not be liable for indirect damages.`,
    );

    expect(flags.map((flag) => flag.category).sort()).toEqual([
      'arbitration',
      'auto_renewal',
      'liability_cap',
    ]);
  });

  it('reports each category once however often it appears', async () => {
    // A contract mentions arbitration in four places. Four identical cards is noise that
    // buries the other nine findings; the first occurrence is where a reader meets the clause.
    const flags = await analyze(`${ARBITRATION} ${ARBITRATION} ${ARBITRATION}`);

    expect(flags).toHaveLength(1);
  });

  it('is case-insensitive', async () => {
    expect(await analyze('ANY DISPUTE SHALL BE RESOLVED BY BINDING ARBITRATION.')).toHaveLength(1);
  });

  it('finds nothing in an ordinary paragraph', async () => {
    // A analyzer that flags everything is as useless as one that flags nothing — the user
    // stops reading either way.
    expect(
      await analyze('The tenant may keep one cat. Rent is due on the first of the month.'),
    ).toHaveLength(0);
  });

  it('returns an empty list for empty input rather than failing', async () => {
    expect(await analyze('')).toEqual([]);
    expect(await analyze('   \n  ')).toEqual([]);
  });

  it('assigns a distinct id to every flag', async () => {
    const flags = await analyze(`${AUTO_RENEWAL} ${ARBITRATION}`);
    const ids = flags.map((flag) => flag.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('carries a recommendation only where the rule has one', async () => {
    const [renewal] = await analyze(AUTO_RENEWAL);
    const [cap] = await analyze('In no event shall the Company be liable for lost profits.');

    expect(renewal?.recommendation).toBeTruthy();
    expect(cap).not.toHaveProperty('recommendation');
  });
});

describe('offsets', () => {
  it('points at the text it quoted', async () => {
    // The report highlights the source by character range. An offset that is off by a
    // sentence highlights the wrong clause and tells the user something false about their
    // own document.
    const document = `Preamble text here. ${ARBITRATION} Trailing text.`;
    const [flag] = await analyze(document);

    expect(document.slice(flag?.charStart ?? 0, flag?.charEnd ?? 0)).toBe(ARBITRATION);
  });

  it('reports the position of the copy it matched, not the first copy', async () => {
    // Contracts repeat themselves constantly. Recovering offsets with `indexOf` would make
    // every later occurrence report the position of the first — the exact reason the scan
    // walks the string instead.
    const filler = 'This clause is unremarkable. ';
    const document = `${filler}${filler}${filler}${AUTO_RENEWAL}`;
    const [flag] = await analyze(document);

    expect(flag?.charStart).toBe(filler.length * 3);
    expect(document.slice(flag?.charStart ?? 0, flag?.charEnd ?? 0)).toBe(AUTO_RENEWAL);
  });

  it('excludes the leading whitespace between sentences from the range', async () => {
    const document = `First sentence.\n\n   ${ARBITRATION}`;
    const [flag] = await analyze(document);

    expect(document[flag?.charStart ?? 0]).toBe('A');
  });

  it('produces a range that is ordered and inside the document', async () => {
    const document = `${AUTO_RENEWAL}\n${ARBITRATION}\nThe tenant shall indemnify the landlord.`;

    for (const flag of await analyze(document)) {
      expect(flag.charStart, flag.category).toBeGreaterThanOrEqual(0);
      expect(flag.charEnd, flag.category).toBeGreaterThan(flag.charStart);
      expect(flag.charEnd, flag.category).toBeLessThanOrEqual(document.length);
    }
  });
});

describe('excerpts', () => {
  it('quotes the sentence it matched', async () => {
    const [flag] = await analyze(`Unrelated opening. ${ARBITRATION} Unrelated close.`);

    expect(flag?.excerpt).toBe(ARBITRATION);
  });

  it('trims a very long clause, because a quotation nobody reads is not evidence', async () => {
    const [flag] = await analyze(`${'padding words '.repeat(60)}binding arbitration applies here.`);

    expect(flag?.excerpt.length).toBeLessThanOrEqual(320);
    expect(flag?.excerpt.endsWith('…')).toBe(true);
  });

  it('does not trim a clause that fits', async () => {
    const [flag] = await analyze(ARBITRATION);

    expect(flag?.excerpt.endsWith('…')).toBe(false);
  });
});

describe('the port contract', () => {
  it('returns a Result rather than throwing', async () => {
    // The port promises a `Result`. A regex over a 200,000-character document can exhaust the
    // stack on a pathological input, and callers must not have to guard against a throw they
    // were told could not happen.
    const result = await analyzer.analyze(request('x'.repeat(200_000)));

    expect(isOk(result)).toBe(true);
  });

  it('handles a document with no sentence punctuation at all', async () => {
    const flags = await analyze('binding arbitration applies to everything in this agreement');

    expect(flags).toHaveLength(1);
  });

  it('identifies itself, so a report can record which analyzer produced it', async () => {
    // When the model-backed analyzer ships, stored analyses need to say which one ran —
    // otherwise old findings and new ones are indistinguishable in the vault.
    expect(analyzer.name).toBe('heuristic-v1');
  });

  it('gives every category it can emit a human label', async () => {
    // A category without a label renders a blank chip in the report — invisible until
    // someone pastes the one contract that triggers it.
    const document = [
      AUTO_RENEWAL,
      ARBITRATION,
      'The Company reserves the right to modify these terms.',
      'An early termination fee applies.',
      'In no event shall the Company be liable.',
      'You agree to indemnify the Company.',
      'A late payment fee of 5% applies.',
      'We may share your data with third parties.',
      'You shall not compete with the Company.',
      'This agreement is governed by the laws of Delaware.',
    ].join('\n');

    const flags = await analyze(document);
    // One sentence per rule, so every rule must fire. A shortfall means a rule's pattern
    // does not match the clause it was written for — which is how a document comes back
    // clean when it is not.
    expect(flags.map((flag) => flag.category).sort()).toEqual([
      'arbitration',
      'auto_renewal',
      'data_sharing',
      'indemnity',
      'jurisdiction',
      'late_fee',
      'liability_cap',
      'non_compete',
      'termination_penalty',
      'unilateral_change',
    ]);
    for (const flag of flags) {
      expect(CLAUSE_CATEGORY_LABEL[flag.category], flag.category).toBeTruthy();
    }
  });

  it('does not carry regex state between documents', async () => {
    // A `/g` pattern shared at module scope keeps `lastIndex` between calls, so every second
    // document silently loses its first match. Two identical runs must agree.
    const first = await analyze(ARBITRATION);
    const second = await analyze(ARBITRATION);

    expect(second.map((flag) => flag.category)).toEqual(first.map((flag) => flag.category));
  });

  it('gives every flag the fields the report renders', async () => {
    for (const flag of await analyze(`${AUTO_RENEWAL} ${ARBITRATION}`)) {
      expect(flag.title.length, flag.category).toBeGreaterThan(0);
      expect(flag.explanation.length, flag.category).toBeGreaterThan(0);
      expect(['critical', 'caution', 'safe']).toContain(flag.level);
    }
  });
});
