import { describe, expect, it } from 'vitest';

import { upstreamError } from '@/core/errors/app-error';
import { err, isErr, ok, unwrapOrThrow } from '@/core/result/result';

import {
  toGuideSummary,
  type ContentRepository,
  type DocumentGuide,
  type GuideCategory,
  type LegalDocument,
  type PricingPlan,
} from '../domain';
import {
  createGetDocumentGuide,
  createGetLegalDocument,
  createGetPricing,
  createListDocumentGuides,
  createListGuideSlugs,
  createListGuidesByCategory,
} from './get-content';

/**
 * The content use cases, exercised against a hand-written repository and no container.
 *
 * Most of these are one-line delegations, and a test that only proves `a()` calls `b()` is
 * worth very little. What is worth testing is the two places this layer makes a *decision*:
 * the slug normalisation in `getDocumentGuide` — which is the difference between a pasted URL
 * reaching a page and reaching a 404 — and the grouping in `listGuidesByCategory`, whose
 * ordering rule is invisible in the output and easy to break with a stray `.sort()`.
 *
 * The delegations are still covered, thinly, for one reason: they are the seam where the first
 * real rule will land (a guide hidden until its launch date, a region-priced tier), and a
 * caller wired to the wrong repository method fails here rather than on a marketing page.
 */

function guide(slug: string, category: GuideCategory, categoryLabel: string): DocumentGuide {
  return {
    slug,
    category,
    categoryLabel,
    title: `${slug} — PaperLens`,
    description: `What a ${slug} is and what to do about it.`,
    heading: slug,
    summary: 'A summary.',
    typicalRisks: ['A risk.'],
    checklist: ['A step.'],
    faqs: [{ question: 'A question?', answer: 'An answer.' }],
  };
}

const CP2000 = guide('irs-cp2000-notice', 'tax-govt', 'Tax & Government');
const CP14 = guide('irs-cp14-notice', 'tax-govt', 'Tax & Government');
const LEASE = guide('residential-lease', 'real-estate', 'Real Estate & Leases');

const PLAN: PricingPlan = {
  tiers: [],
  overageCentsPerThousand: 2500,
  calculatorBaseTierId: 'pro',
};

const TERMS: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Service',
  description: 'The agreement.',
  eyebrow: 'Terms & governance',
  lastUpdatedIso: '2026-04-01',
  intro: 'An intro.',
  sections: [],
};

/** Records the slug it was asked for, which is how normalisation is asserted. */
function fakeRepository(
  guides: readonly DocumentGuide[] = [CP2000, CP14, LEASE],
  overrides: Partial<ContentRepository> = {},
) {
  const requestedSlugs: string[] = [];

  const repository: ContentRepository = {
    async listGuides() {
      return ok(guides.map(toGuideSummary));
    },
    async getGuide(slug) {
      requestedSlugs.push(slug);
      return ok(guides.find((entry) => entry.slug === slug) ?? null);
    },
    async listGuideSlugs() {
      return ok(guides.map((entry) => entry.slug));
    },
    async getPricing() {
      return ok(PLAN);
    },
    async getLegalDocument() {
      return ok(TERMS);
    },
    ...overrides,
  };

  return { repository, requestedSlugs };
}

describe('getDocumentGuide', () => {
  it('normalises the slug before the lookup', async () => {
    const { repository, requestedSlugs } = fakeRepository();
    const getDocumentGuide = createGetDocumentGuide({ repository });

    const found = unwrapOrThrow(await getDocumentGuide(' IRS-CP2000-Notice '));

    // Trailing whitespace from a paste, capitals from a phone keyboard's autocorrect. Both
    // name the same page, and both should reach it.
    expect(requestedSlugs).toEqual(['irs-cp2000-notice']);
    expect(found?.slug).toBe('irs-cp2000-notice');
  });

  it('answers ok(null) for a slug that does not exist, not an error', async () => {
    const { repository } = fakeRepository();
    const getDocumentGuide = createGetDocumentGuide({ repository });

    const result = await getDocumentGuide('no-such-guide');

    // The distinction the route depends on: `null` becomes `notFound()`, an `err` becomes the
    // error boundary. Collapsing them would serve a 500 for a typo'd URL.
    expect(isErr(result)).toBe(false);
    expect(unwrapOrThrow(result)).toBeNull();
  });

  it('propagates a repository failure unchanged', async () => {
    const failure = upstreamError('cms');
    const { repository } = fakeRepository(undefined, {
      async getGuide() {
        return err(failure);
      },
    });

    const result = await createGetDocumentGuide({ repository })('irs-cp2000-notice');

    expect(isErr(result)).toBe(true);
    expect(isErr(result) && result.error).toBe(failure);
  });
});

describe('listGuidesByCategory', () => {
  it('groups guides under their category', async () => {
    const { repository } = fakeRepository();

    const groups = unwrapOrThrow(await createListGuidesByCategory({ repository })());

    expect(groups).toHaveLength(2);
    expect(groups[0]?.category).toBe('tax-govt');
    expect(groups[0]?.label).toBe('Tax & Government');
    expect(groups[0]?.guides.map((entry) => entry.slug)).toEqual([
      'irs-cp2000-notice',
      'irs-cp14-notice',
    ]);
    expect(groups[1]?.guides.map((entry) => entry.slug)).toEqual(['residential-lease']);
  });

  it('orders groups by first appearance in the corpus, not alphabetically', async () => {
    // Real estate appears first here and tax second — the reverse of the case above. If the
    // grouping sorted by label or by category id, this assertion and the previous one could
    // not both pass, which is precisely the point: `guides.data.ts` is the single control over
    // page order, and a sort in this layer would silently override the editorial decision.
    const { repository } = fakeRepository([LEASE, CP2000]);

    const groups = unwrapOrThrow(await createListGuidesByCategory({ repository })());

    expect(groups.map((group) => group.category)).toEqual(['real-estate', 'tax-govt']);
  });

  it('returns no groups for an empty corpus', async () => {
    const { repository } = fakeRepository([]);

    expect(unwrapOrThrow(await createListGuidesByCategory({ repository })())).toEqual([]);
  });

  it('propagates a repository failure instead of rendering an empty hub page', async () => {
    const failure = upstreamError('cms');
    const { repository } = fakeRepository(undefined, {
      async listGuides() {
        return err(failure);
      },
    });

    const result = await createListGuidesByCategory({ repository })();

    // The failure mode worth guarding: an outage that groups into `[]` looks identical to a
    // corpus with no guides, and the hub page would render as though we had nothing to say.
    expect(isErr(result)).toBe(true);
    expect(isErr(result) && result.error).toBe(failure);
  });
});

describe('the read-through use cases', () => {
  it('list every guide summary', async () => {
    const { repository } = fakeRepository();

    const summaries = unwrapOrThrow(await createListDocumentGuides({ repository })());

    expect(summaries.map((entry) => entry.slug)).toEqual([
      'irs-cp2000-notice',
      'irs-cp14-notice',
      'residential-lease',
    ]);
  });

  it('list every slug, for generateStaticParams', async () => {
    const { repository } = fakeRepository();

    expect(unwrapOrThrow(await createListGuideSlugs({ repository })())).toEqual([
      'irs-cp2000-notice',
      'irs-cp14-notice',
      'residential-lease',
    ]);
  });

  it('read pricing and legal documents', async () => {
    const { repository } = fakeRepository();

    expect(unwrapOrThrow(await createGetPricing({ repository })())).toBe(PLAN);
    expect(unwrapOrThrow(await createGetLegalDocument({ repository })('terms'))).toBe(TERMS);
  });
});
