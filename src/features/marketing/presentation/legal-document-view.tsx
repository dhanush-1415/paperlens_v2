/**
 * The renderer shared by `/terms`, `/privacy` and `/cookies`.
 *
 * A Server Component with no state and no client bytes. The three routes are ten lines each
 * because everything that makes a legal page readable lives here once.
 *
 * ### The layout, and why it is not a single centred column
 *
 * A legal document is read in two completely different ways. Most people arrive at a specific
 * clause — "what happens to my documents if I stop paying" — and want to leave. A few (an
 * enterprise buyer's counsel, a DPO doing a vendor review) read it end to end. The sticky
 * contents rail serves the first without slowing the second, and it collapses to a scrolling
 * strip under `lg` rather than becoming an accordion nobody opens.
 *
 * ### The measure
 *
 * `max-w-measure` on the prose column, not on the page. Legal text is the longest continuous
 * reading anyone does in this product, and a 90-character line is where comprehension of dense
 * text measurably falls off. The rail sits outside that constraint, which is the entire reason
 * the two are separate columns rather than one column with a floated aside.
 *
 * ### On numbering
 *
 * The sections are numbered in the *rendering*, from their position, not in the content. A
 * clause numbered in prose is a clause that has to be renumbered by hand when one is inserted
 * above it, and the anchor — which is what a citation actually points at — is a hand-written
 * id that never changes. So the visible number can be derived safely, and the durable
 * identifier is the one that is written down.
 */

import type { LegalDocument, LegalSection } from '../domain/legal';
import { formatDate } from '@/shared/utils/date';
import { Container, Heading, Section, Text } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';

import { LegalBlocks } from './legal-blocks';
import { RichText } from './rich-text';

function SectionBody({ section, index }: { section: LegalSection; index: number }) {
 return (
 <section aria-labelledby={section.id} className="scroll-mt-24">
 <Heading
 level={2}
 size="md"
 id={section.id}
 className="flex scroll-mt-24 items-baseline gap-3 border-b border-border-subtle pb-3"
 >
 {/*
 The number is decorative: a screen reader announcing "four Document storage and grace
 periods" is worse than announcing the heading, and the ordinal is already conveyed by
 the position in the contents list.
 */}
 <span aria-hidden className="tabular text-text-tertiary">
 {index + 1}
 </span>
 <span>{section.heading}</span>
 </Heading>

 <div className="mt-5 flex flex-col gap-5">
 <LegalBlocks blocks={section.blocks} />

 {section.subsections.map((subsection) => (
 <div key={subsection.heading} className="flex flex-col gap-4">
 <Heading level={3} size="eyebrow" className="mt-2">
 {subsection.heading}
 </Heading>
 <LegalBlocks blocks={subsection.blocks} />
 </div>
 ))}
 </div>
 </section>
 );
}

export interface LegalDocumentViewProps {
 document: LegalDocument;
 /** Passed from the route rather than read here — a component may not read a clock. */
 locale?: string;
}

export function LegalDocumentView({ document, locale = 'en' }: LegalDocumentViewProps) {
 const lastUpdated = formatDate(document.lastUpdatedIso, locale, { dateStyle: 'long' });
 const effective = document.effectiveIso
 ? formatDate(document.effectiveIso, locale, { dateStyle: 'long' })
 : null;

 return (
 <div className="relative w-full bg-canvas pb-24 overflow-hidden">
 <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--border-strong-rgb),0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--border-strong-rgb),0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
 
 <Container width="shell" className="relative z-10 pt-16">
 <header className="border-b border-border-subtle pb-10">
 <Text
 as="p"
 size="xs"
 tone="tertiary"
 weight="semibold"
 className="tracking-wider uppercase"
 >
 {document.eyebrow}
 </Text>
 <Heading level={1} size="display-md" className="mt-3">
 {document.title}
 </Heading>

 {/*
 Dates before the prose, in a row of their own. The first question a returning
 reader has is "has this changed since I agreed to it", and answering it below the
 introduction means they have to read the introduction to find out.
 */}
 <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
 {effective ? (
 <div className="flex items-baseline gap-2">
 <dt className="text-2xs text-text-tertiary">Effective</dt>
 <dd className="text-2xs text-text-secondary">
 <time dateTime={document.effectiveIso}>{effective}</time>
 </dd>
 </div>
 ) : null}
 <div className="flex items-baseline gap-2">
 <dt className="text-2xs text-text-tertiary">Last updated</dt>
 <dd className="text-2xs text-text-secondary">
 <time dateTime={document.lastUpdatedIso}>{lastUpdated}</time>
 </dd>
 </div>
 </dl>

 <Text as="p" size="md" tone="secondary" editorial measure className="mt-6">
 <RichText text={document.intro} />
 </Text>
 </header>

 <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
 <div className="flex max-w-measure flex-col gap-12">
 {document.sections.map((section, index) => (
 <SectionBody key={section.id} section={section} index={index} />
 ))}
 </div>

 {/*
 Order: the rail is second in the DOM and first in the visual order on `lg`.
 A keyboard user and a screen reader meet the document before its index, which is
 the right priority; sighted users on a wide screen see the index on the right,
 where a reference rail belongs in a left-to-right reading order.
 */}
 <nav
 aria-label="On this page"
 className={cn('order-first lg:order-none', 'lg:sticky lg:top-24 lg:self-start')}
 >
 <h2 className="text-2xs font-semibold tracking-wider text-text-tertiary uppercase">
 On this page
 </h2>
 <ol className="mt-3 flex flex-col gap-1">
 {document.sections.map((section, index) => (
 <li key={section.id}>
 <a
 href={`#${section.id}`}
 className={cn(
 'flex min-h-9 items-baseline gap-2 py-0.5 text-sm text-text-secondary',
 'transition-colors duration-(--duration-micro) ease-brand hover:text-text-primary',
 )}
 >
 <span aria-hidden className="tabular text-text-tertiary">
 {index + 1}
 </span>
 <span>{section.heading}</span>
 </a>
 </li>
 ))}
 </ol>
 </nav>
 </div>
 </Container>
 </div>
 );
}
