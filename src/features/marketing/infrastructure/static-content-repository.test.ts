import { describe, expect, it } from 'vitest';

import { isAppError } from '@/core/errors/app-error';
import { unwrapOrThrow } from '@/core/result/result';

import {
  GUIDE_CATEGORIES,
  LEGAL_DOCUMENT_SLUGS,
  type DocumentGuide,
  type PricingPlan,
} from '../domain';
import { DOCUMENT_GUIDES } from './guides.data';
import { LEGAL_DOCUMENTS } from './legal.data';
import { PRICING_PLAN } from './pricing.data';
import { createStaticContentRepository } from './static-content-repository';

/**
 * Two test suites in one file, because the adapter and the corpus fail differently.
 *
 * The **adapter** suite uses three invented guides and asserts behaviour: what a missing slug
 * answers, what a duplicate one does, what happens when the pricing data highlights the wrong
 * number of tiers. Those are properties of the code and they hold for any corpus.
 *
 * The **corpus** suite runs against the twenty-five real guides and asserts things the type
 * system cannot: that `readonly string[]` is not empty, that a description written by hand is
 * short enough to survive the search result page, that no two guides claim the same URL. These
 * are the mistakes actually made while editing content — none of them break the build, all of
 * them are invisible in review, and each one costs a page its traffic. A content corpus without
 * a test is a corpus that degrades one hurried edit at a time.
 */

function guide(overrides: Partial<DocumentGuide> = {}): DocumentGuide {
  return {
    slug: 'a-guide',
    category: 'tax-govt',
    categoryLabel: 'Tax & Government',
    title: 'A guide — PaperLens',
    description: 'What it is.',
    heading: 'A guide',
    summary: 'A summary.',
    typicalRisks: ['A risk.'],
    checklist: ['A step.'],
    faqs: [{ question: 'A question?', answer: 'An answer.' }],
    ...overrides,
  };
}

const GUIDES = [
  guide({ slug: 'one' }),
  guide({ slug: 'two' }),
  guide({ slug: 'three', category: 'real-estate', categoryLabel: 'Real Estate & Leases' }),
];

function plan(overrides: Partial<PricingPlan> = {}): PricingPlan {
  return {
    tiers: [
      {
        id: 'free',
        name: 'Free',
        tagline: 'Start here.',
        monthlyCents: 0,
        annualMonthlyCents: 0,
        scansPerMonth: 5,
        features: [],
        cta: 'Start',
        highlighted: false,
      },
      {
        id: 'pro',
        name: 'Pro',
        tagline: 'For a stack of documents.',
        monthlyCents: 2900,
        annualMonthlyCents: 2400,
        scansPerMonth: 200,
        features: [],
        cta: 'Upgrade',
        highlighted: true,
      },
    ],
    overageCentsPerThousand: 2500,
    calculatorBaseTierId: 'pro',
    ...overrides,
  };
}

describe('createStaticContentRepository', () => {
  it('reads a guide by slug and answers null for one it does not have', async () => {
    const repository = createStaticContentRepository({ guides: GUIDES, pricing: plan() });

    expect(unwrapOrThrow(await repository.getGuide('two'))?.slug).toBe('two');
    expect(unwrapOrThrow(await repository.getGuide('nope'))).toBeNull();
  });

  it('does not normalise the slug itself — that is the use case its job', async () => {
    const repository = createStaticContentRepository({ guides: GUIDES, pricing: plan() });

    // Deliberate: normalising in both places means two definitions of "the same slug" that can
    // drift apart, and the adapter is the one that will be replaced by a CMS.
    expect(unwrapOrThrow(await repository.getGuide('TWO'))).toBeNull();
  });

  it('projects summaries in corpus order and returns a stable reference', async () => {
    const repository = createStaticContentRepository({ guides: GUIDES, pricing: plan() });

    const first = unwrapOrThrow(await repository.listGuides());
    const second = unwrapOrThrow(await repository.listGuides());

    expect(first.map((entry) => entry.slug)).toEqual(['one', 'two', 'three']);
    // Same array object across calls: the hub page, the footer and the related rail all ask for
    // this under PPR, and a fresh array each time defeats memoisation for no benefit.
    expect(second).toBe(first);
  });

  it('drops the body from a summary, so list pages do not ship every FAQ answer', async () => {
    const repository = createStaticContentRepository({ guides: GUIDES, pricing: plan() });

    const [summary] = unwrapOrThrow(await repository.listGuides());

    expect(summary).toEqual({
      slug: 'one',
      category: 'tax-govt',
      categoryLabel: 'Tax & Government',
      heading: 'A guide',
      description: 'What it is.',
    });
  });

  it('lists slugs without loading bodies', async () => {
    const repository = createStaticContentRepository({ guides: GUIDES, pricing: plan() });

    expect(unwrapOrThrow(await repository.listGuideSlugs())).toEqual(['one', 'two', 'three']);
  });

  it('throws at construction on a duplicate slug', () => {
    // The most damaging content mistake there is: two guides at one URL means one of them is
    // silently unreachable, and nothing about that shows up in a diff. Failing here fails
    // `next build`, so it can never reach a reader.
    expect(() =>
      createStaticContentRepository({
        guides: [guide({ slug: 'one' }), guide({ slug: 'one' })],
        pricing: plan(),
      }),
    ).toThrow(/duplicate guide slug: one/i);
  });

  it('throws an AppError rather than a bare Error', () => {
    let thrown: unknown;
    try {
      createStaticContentRepository({ guides: [guide(), guide()], pricing: plan() });
    } catch (error) {
      thrown = error;
    }

    expect(isAppError(thrown)).toBe(true);
  });

  it('throws unless exactly one pricing tier is highlighted', () => {
    const tiers = plan().tiers;

    const none = tiers.map((tier) => ({ ...tier, highlighted: false }));
    const both = tiers.map((tier) => ({ ...tier, highlighted: true }));

    // Two ribbons is visually the same as none — "most popular" only means something while it
    // is scarce — so both directions are errors and both are caught before the page renders.
    expect(() => createStaticContentRepository({ pricing: plan({ tiers: none }) })).toThrow(
      /found 0/,
    );
    expect(() => createStaticContentRepository({ pricing: plan({ tiers: both }) })).toThrow(
      /found 2/,
    );
  });

  it('returns each legal document from the closed slug union', async () => {
    const repository = createStaticContentRepository();

    for (const slug of LEGAL_DOCUMENT_SLUGS) {
      expect(unwrapOrThrow(await repository.getLegalDocument(slug)).slug).toBe(slug);
    }
  });
});

describe('the shipped corpus', () => {
  it('constructs, which is the duplicate-slug and pricing check running for real', () => {
    expect(() => createStaticContentRepository()).not.toThrow();
  });

  it('has twenty-five guides with unique, URL-safe slugs', () => {
    const slugs = DOCUMENT_GUIDES.map((entry) => entry.slug);

    expect(slugs).toHaveLength(25);
    expect(new Set(slugs).size).toBe(25);

    for (const slug of slugs) {
      // Lowercase, hyphen-separated, no trailing hyphen. A slug with an underscore or a capital
      // is a URL that behaves differently across the handful of proxies between us and a reader.
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('files every guide under a known category with one label per category', () => {
    const labels = new Map<string, string>();

    for (const entry of DOCUMENT_GUIDES) {
      expect(GUIDE_CATEGORIES).toContain(entry.category);

      // One label per category, or the hub page renders "Tax & Government" and "Tax and
      // Government" as two sections of the same thing.
      const known = labels.get(entry.category);
      if (known === undefined) labels.set(entry.category, entry.categoryLabel);
      else expect(entry.categoryLabel).toBe(known);
    }
  });

  it('never ships a guide missing the prose that makes it worth ranking', () => {
    for (const entry of DOCUMENT_GUIDES) {
      // `readonly string[]` cannot express "at least one", and a guide that ranks for a scared
      // person's search and then has nothing to tell them is worse than no page at all.
      expect(entry.typicalRisks.length, entry.slug).toBeGreaterThan(0);
      expect(entry.checklist.length, entry.slug).toBeGreaterThan(0);
      expect(entry.faqs.length, entry.slug).toBeGreaterThan(0);

      for (const text of [entry.heading, entry.summary, entry.title, entry.description]) {
        expect(text.trim(), entry.slug).not.toBe('');
      }

      for (const faq of entry.faqs) {
        expect(faq.question.trim(), entry.slug).not.toBe('');
        expect(faq.answer.trim(), entry.slug).not.toBe('');
        // A question mark is a small thing, but the FAQ renders into `FAQPage` structured data
        // and a "question" that is not phrased as one is what gets the rich result withheld.
        expect(faq.question.trim().endsWith('?'), `${entry.slug}: ${faq.question}`).toBe(true);
      }
    }
  });

  it('keeps descriptions inside what a search result will actually print', () => {
    for (const entry of DOCUMENT_GUIDES) {
      // ~155 characters is where Google truncates. A description cut mid-sentence reads as a
      // broken page in the one place a reader decides whether to click.
      expect(entry.description.length, entry.slug).toBeLessThanOrEqual(160);
    }
  });

  it('gives each guide a distinct heading, so the hub page is not a wall of near-duplicates', () => {
    const headings = DOCUMENT_GUIDES.map((entry) => entry.heading);

    expect(new Set(headings).size).toBe(headings.length);
  });

  it('publishes all three legal documents with a machine-readable revision date', () => {
    for (const slug of LEGAL_DOCUMENT_SLUGS) {
      const document = LEGAL_DOCUMENTS[slug];

      expect(document.slug).toBe(slug);
      expect(document.sections.length, slug).toBeGreaterThan(0);
      // `<time dateTime>` needs a real ISO date; a hand-typed "April 2026" renders but tells a
      // crawler nothing about how current the terms are.
      expect(document.lastUpdatedIso, slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const anchors = document.sections.map((section) => section.id);
      // Anchors are cited from outside — including, eventually, from a signed contract — so a
      // collision silently sends two citations to one place.
      expect(new Set(anchors).size, slug).toBe(anchors.length);
    }
  });

  it('prices tiers in whole cents with a monotonic ladder', () => {
    const byId = new Map(PRICING_PLAN.tiers.map((tier) => [tier.id, tier]));
    const free = byId.get('free');
    const pro = byId.get('pro');
    const business = byId.get('business');

    expect(free?.monthlyCents).toBe(0);
    expect(pro?.monthlyCents).toBeGreaterThan(0);
    expect(business?.monthlyCents).toBeGreaterThan(pro?.monthlyCents ?? 0);

    for (const tier of PRICING_PLAN.tiers) {
      expect(Number.isInteger(tier.monthlyCents), tier.id).toBe(true);
      expect(Number.isInteger(tier.annualMonthlyCents), tier.id).toBe(true);
      // Annual has to be cheaper per month than monthly, or the toggle advertises a saving that
      // is not one.
      expect(tier.annualMonthlyCents, tier.id).toBeLessThanOrEqual(tier.monthlyCents);
    }

    expect(Number.isInteger(PRICING_PLAN.overageCentsPerThousand)).toBe(true);
    expect(byId.has(PRICING_PLAN.calculatorBaseTierId)).toBe(true);
  });
});
