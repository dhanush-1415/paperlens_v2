import type { Metadata } from 'next';

import { unwrapOrThrow } from '@/core/result/result';
import { GuideHub, LIST_GUIDES_BY_CATEGORY } from '@/features/marketing';
import { getRequestScope } from '@/server/bootstrap';

/**
 * `/use-cases` — the hub every `/for/<slug>` guide hangs off.
 *
 * ### Why this route exists before the guides it links to are designed
 *
 * Because the footer and the primary nav both point at it. Twenty-five landing pages with no
 * hub are twenty-five pages a crawler reaches only from a sitemap and a visitor reaches only
 * from a search result — no internal link equity, no way to browse sideways from a guide that
 * turned out to be the wrong one.
 *
 * The page itself is four lines: resolve, unwrap, render. The grouping is a use case
 * (`listGuidesByCategory`) so it can be tested without a DOM, and the layout is a feature
 * component so this file stays routing.
 */
export const metadata: Metadata = {
 title: 'Document guides',
 description:
 'Plain-English guides to the notices, contracts and letters people are most often asked to sign — what each one means, what it typically costs, and what to do next.',
 alternates: { canonical: '/use-cases' },
};

export default async function UseCasesPage() {
 const listGuidesByCategory = getRequestScope().resolve(LIST_GUIDES_BY_CATEGORY);
 const groups = unwrapOrThrow(await listGuidesByCategory());

 return (
 <GuideHub
 groups={groups}
 eyebrow="Document guides"
 heading="Know what you are signing, before you sign it"
 lede="Every guide covers one kind of document: what it actually says, the clauses that cost people money, and the deadline you are working against. Written for the moment the envelope is already open."
 />
 );
}
