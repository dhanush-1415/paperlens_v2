import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DocumentGuide } from '../../domain';

import { GuideChecklist } from './checklist';
import { GuideFaqSection } from './faq';
import { GuideHero } from './hero';
import { GuideRelated } from './related';
import { GuideRisks } from './risks';
import { GUIDE_SECTION_IDS } from './section-ids';
import { GuideStructuredData } from './structured-data';

/**
 * What is asserted here is the contract, not the layout.
 *
 * A `/for/<slug>` page is read by three audiences with different failure modes, and each one is
 * represented below:
 *
 * · **A crawler**, which sees only what is in the HTML — so the FAQ answers must be present
 * while collapsed, and the JSON-LD must parse and agree with the visible text.
 * · **A screen-reader user**, for whom the checklist's ordering is information — so the numbers
 * are real list semantics rather than a CSS counter.
 * · **Anyone clicking a jump link**, which silently does nothing if a fragment and a section id
 * disagree. Nothing in the type system connects `href="#risks"` to `id="risks"`; this file is
 * what connects them.
 *
 * Colours, spacing and copy are deliberately untested — they change every design pass, and a
 * test that breaks on a reworded heading is a test that gets deleted rather than fixed.
 */

const GUIDE: DocumentGuide = {
 slug: 'irs-cp2000-notice',
 category: 'tax-govt',
 categoryLabel: 'Tax & Government',
 title: 'Decode IRS CP2000 Notice — PaperLens',
 description: 'What a CP2000 is and how to respond.',
 heading: 'IRS CP2000 Underreported Income Notice',
 summary: 'The IRS sends a CP2000 when third-party records do not match your return.',
 typicalRisks: ['Proposed penalties accumulate from the original filing date.'],
 checklist: ['Locate your return for the year in the notice.', 'Compare it against the notice.'],
 faqs: [
 { question: 'Is a CP2000 an audit?', answer: 'No. It is a proposal, not an examination.' },
 ],
};

describe('GuideHero', () => {
 it('points every jump link at a section that exists', () => {
 const { unmount } = render(<GuideHero guide={GUIDE} ctaLabel="Analyze" reassurance="Free." />);

 const targets = within(screen.getByRole('navigation', { name: 'On this page' }))
 .getAllByRole('link')
 .map((link) => link.getAttribute('href'));

 expect(targets).toEqual(['#risks', '#checklist', '#questions']);
 unmount();

 // The other half of the contract: the same three ids are what the sections render. A jump
 // link to a fragment nothing carries scrolls nowhere and reports no error anywhere.
 const { container } = render(
 <>
 <GuideRisks risks={GUIDE.typicalRisks} />
 <GuideChecklist steps={GUIDE.checklist} />
 <GuideFaqSection faqs={GUIDE.faqs} />
 </>,
 );

 for (const id of Object.values(GUIDE_SECTION_IDS)) {
 expect(container.querySelector(`#${id}`), id).not.toBeNull();
 }
 });

 it('gives the page exactly one h1, and it is the guide heading', () => {
 render(<GuideHero guide={GUIDE} ctaLabel="Analyze" reassurance="Free." />);

 expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(GUIDE.heading);
 });

 it('answers what the document is before it asks for anything', () => {
 render(<GuideHero guide={GUIDE} ctaLabel="Analyze" reassurance="Free." />);

 // The visitor arrived from a search box with the envelope open. The summary is the reason
 // they stay; burying it under a value proposition sends them back to the results page.
 expect(screen.getByText(GUIDE.summary)).toBeInTheDocument();
 expect(screen.getByRole('link', { name: /analyze/i })).toHaveAttribute('href', '/scan');
 expect(screen.getByText('Free.')).toBeInTheDocument();
 });

 it('marks the current page in the breadcrumb without linking to it', () => {
 render(<GuideHero guide={GUIDE} ctaLabel="Analyze" reassurance="Free." />);

 const trail = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
 const current = trail.getByText(GUIDE.heading);

 expect(current).toHaveAttribute('aria-current', 'page');
 expect(trail.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
 '/',
 '/use-cases',
 ]);
 });
});

describe('GuideChecklist', () => {
 it('renders a real ordered list, because the order is load-bearing', () => {
 const { container } = render(<GuideChecklist steps={GUIDE.checklist} />);

 // A reader who does step four before step one can make their legal position worse. `<ol>`
 // is what announces "2 of 5" to a screen reader; a styled `<div>` announces nothing.
 const list = container.querySelector('ol');
 expect(list).not.toBeNull();
 expect(list?.querySelectorAll('li')).toHaveLength(GUIDE.checklist.length);
 });

 it('renders the step numbers as text rather than as a CSS counter', () => {
 render(<GuideChecklist steps={GUIDE.checklist} />);

 // `content: counter(...)` is invisible to assistive technology and to anyone printing the
 // page with backgrounds off, which is a common way these pages are actually used.
 expect(screen.getByText('01')).toBeInTheDocument();
 expect(screen.getByText('02')).toBeInTheDocument();
 });

 it('renders nothing rather than an empty heading when there are no steps', () => {
 const { container } = render(<GuideChecklist steps={[]} />);

 expect(container).toBeEmptyDOMElement();
 });
});

describe('GuideRisks', () => {
 it('lists each risk as prose', () => {
 render(<GuideRisks risks={GUIDE.typicalRisks} />);

 expect(screen.getByText(GUIDE.typicalRisks[0] as string)).toBeInTheDocument();
 });

 it('renders nothing for a guide with no listed risks', () => {
 const { container } = render(<GuideRisks risks={[]} />);

 expect(container).toBeEmptyDOMElement();
 });
});

describe('GuideFaqSection', () => {
 it('keeps every answer in the HTML while collapsed', () => {
 render(<GuideFaqSection faqs={GUIDE.faqs} />);

 // The whole reason the accordion is a native `<details>`: these answers are what an
 // assistant quotes when somebody asks it the same question, and a panel that mounts on
 // click does not exist to anything that never clicks.
 expect(screen.getByText(GUIDE.faqs[0]?.answer as string)).toBeInTheDocument();
 expect(screen.getByText(GUIDE.faqs[0]?.question as string)).toBeInTheDocument();
 });

 it('renders nothing when a guide has no FAQ', () => {
 const { container } = render(<GuideFaqSection faqs={[]} />);

 expect(container).toBeEmptyDOMElement();
 });
});

describe('GuideRelated', () => {
 const SIBLINGS = [
 {
 slug: 'irs-cp14-notice',
 category: 'tax-govt' as const,
 categoryLabel: 'Tax & Government',
 heading: 'IRS CP14 Balance Due',
 description: 'The first bill the IRS sends.',
 },
 ];

 it('links siblings by slug', () => {
 render(<GuideRelated categoryLabel="Tax & Government" guides={SIBLINGS} />);

 expect(screen.getByRole('link', { name: /IRS CP14 Balance Due/ })).toHaveAttribute(
 'href',
 '/for/irs-cp14-notice',
 );
 expect(screen.getByRole('link', { name: /all document guides/i })).toHaveAttribute(
 'href',
 '/use-cases',
 );
 });

 it('uses the category label verbatim, initialisms intact', () => {
 render(<GuideRelated categoryLabel="HR & Employment" guides={SIBLINGS} />);

 // Lower-casing it to make the sentence flow turns "HR" into "hr", which reads as a bug on
 // a page whose entire pitch is that it reads carefully.
 expect(screen.getByText(/HR & Employment/)).toBeInTheDocument();
 });

 it('renders nothing when a guide is the only one in its category', () => {
 const { container } = render(<GuideRelated categoryLabel="Tax & Government" guides={[]} />);

 expect(container).toBeEmptyDOMElement();
 });
});

describe('GuideStructuredData', () => {
 function parse(guide: DocumentGuide, siteUrl = 'https://paperlens.co') {
 const { container } = render(<GuideStructuredData guide={guide} siteUrl={siteUrl} />);
 const script = container.querySelector('script[type="application/ld+json"]');

 expect(script).not.toBeNull();
 return JSON.parse(script?.textContent ?? '') as {
 '@graph': { '@type': string; itemListElement?: unknown[]; mainEntity?: unknown[] }[];
 };
 }

 it('emits a breadcrumb with absolute URLs', () => {
 const graph = parse(GUIDE)['@graph'];
 const breadcrumb = graph.find((node) => node['@type'] === 'BreadcrumbList');

 // `metadataBase` resolves relative canonicals for Next's metadata, but it does not touch a
 // `<script>` body — a breadcrumb of `/use-cases` is one no consumer can resolve.
 expect(breadcrumb?.itemListElement).toEqual([
 { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://paperlens.co/' },
 {
 '@type': 'ListItem',
 position: 2,
 name: 'Document guides',
 item: 'https://paperlens.co/use-cases',
 },
 {
 '@type': 'ListItem',
 position: 3,
 name: GUIDE.heading,
 item: 'https://paperlens.co/for/irs-cp2000-notice',
 },
 ]);
 });

 it('does not double the slash when the configured origin has a trailing one', () => {
 const graph = parse(GUIDE, 'https://paperlens.co/')['@graph'];
 const breadcrumb = graph.find((node) => node['@type'] === 'BreadcrumbList');
 const items = breadcrumb?.itemListElement as { item: string }[];

 expect(items[1]?.item).toBe('https://paperlens.co/use-cases');
 });

 it('mirrors the visible FAQ exactly', () => {
 const faq = parse(GUIDE)['@graph'].find((node) => node['@type'] === 'FAQPage');

 // Structured data that disagrees with the page is the one SEO mistake that gets rich
 // results suppressed rather than merely ignored. Both come from the same entity.
 expect(faq?.mainEntity).toEqual([
 {
 '@type': 'Question',
 name: GUIDE.faqs[0]?.question,
 acceptedAnswer: { '@type': 'Answer', text: GUIDE.faqs[0]?.answer },
 },
 ]);
 });

 it('omits the FAQPage block entirely rather than emitting an empty one', () => {
 const graph = parse({ ...GUIDE, faqs: [] })['@graph'];

 expect(graph.map((node) => node['@type'])).toEqual(['BreadcrumbList']);
 });

 it('escapes angle brackets so prose can never close the script element', () => {
 const hostile = { ...GUIDE, heading: 'A </script><img> notice' };
 const { container } = render(
 <GuideStructuredData guide={hostile} siteUrl="https://paperlens.co" />,
 );
 const script = container.querySelector('script[type="application/ld+json"]');

 // React does not escape text inside `<script>`, so an unescaped `</script>` in guide prose
 // would end the element early and drop the rest of the JSON into the page as markup.
 expect(script?.textContent).not.toContain('</script>');
 expect(script?.textContent).toContain('\\u003c/script');
 // Still valid JSON, and still the original string once parsed.
 const parsed = JSON.parse(script?.textContent ?? '') as {
 '@graph': { itemListElement?: { name: string }[] }[];
 };
 expect(parsed['@graph'][0]?.itemListElement?.[2]?.name).toBe(hostile.heading);
 });
});
