import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { appConfig } from '@/config';
import { TRANSLATOR } from '@/core/container';
import { unwrapOrThrow } from '@/core/result/result';
import {
 GET_DOCUMENT_GUIDE,
 GuideChecklist,
 GuideFaqSection,
 GuideHero,
 GuideRelated,
 GuideRisks,
 GuideStructuredData,
 LandingClosingCta,
 LIST_GUIDES_BY_CATEGORY,
 LIST_GUIDE_SLUGS,
 type DocumentGuide,
} from '@/features/marketing';
import { getRequestScope } from '@/server/bootstrap';

/**
 * `/for/[slug]` — twenty-five pages from one file.
 *
 * ### What this route is for
 *
 * It is the top of the funnel, and it is a different funnel from the rest of the site. Nobody
 * searches for us; they search for the thing that arrived in the post. Each of these pages
 * answers one such search completely — what the document is, what it typically costs, what to do
 * about it — and only then offers to read their copy of it. The offer converts *because* the
 * answer came first.
 *
 * ### Why one template and not twenty-five pages
 *
 * Because the twenty-sixth is a data entry, not a deploy of a new page, and because a template
 * cannot drift. Every guide gets the same breadcrumb, the same structured data, the same heading
 * levels and the same CTA copy as the header — properties that hand-written pages lose within a
 * quarter of someone editing one of them in a hurry.
 *
 * ### Prerendering
 *
 * `generateStaticParams` returns the whole corpus, so all twenty-five URLs are HTML at build
 * time. `dynamicParams` is deliberately absent: it is unavailable under `cacheComponents`
 * (verified in `03-file-conventions/02-route-segment-config/dynamicParams.md`), so an unknown
 * slug is handled the only way that remains — a request-time render that finds nothing and calls
 * `notFound()`. That path costs one array lookup and serves the 404 the visitor should get.
 *
 * ### Why `cache()` wraps the read
 *
 * Next calls `generateMetadata` and the component separately, and both need the guide. One
 * lookup per request rather than two — free against a typed array today, and the difference
 * between one and two round trips the day this is a CMS. Same pattern, same reason, as `_legal`.
 */

const readGuide = cache(async (slug: string): Promise<DocumentGuide> => {
 const getDocumentGuide = getRequestScope().resolve(GET_DOCUMENT_GUIDE);
 const guide = unwrapOrThrow(await getDocumentGuide(slug));

 /**
 * `null` is not an error here — the port answers "no such guide", and that is a fact about
 * the corpus rather than a failure of it. The route is the layer that knows a missing guide
 * means a 404 rather than an empty page, so the translation happens here.
 */
 if (guide === null) notFound();
 return guide;
});

export async function generateStaticParams() {
 const listGuideSlugs = getRequestScope().resolve(LIST_GUIDE_SLUGS);
 const slugs = unwrapOrThrow(await listGuideSlugs());
 return slugs.map((slug) => ({ slug }));
}

/**
 * Per-guide metadata.
 *
 * `title.absolute` rather than `title`, uniquely on this route. Every other page states its own
 * name and lets the root layout's template append the product name. These titles were written
 * for the search result page and already carry the brand — running them through the template
 * would print it twice and spend eight of the ~60 characters Google shows on saying "PaperLens"
 * a second time.
 */
export async function generateMetadata({ params }: PageProps<'/for/[slug]'>): Promise<Metadata> {
 const { slug } = await params;
 const guide = await readGuide(slug);
 const url = `/for/${guide.slug}`;

 return {
 title: { absolute: guide.title },
 description: guide.description,
 alternates: { canonical: url },
 openGraph: {
 type: 'article',
 title: guide.title,
 description: guide.description,
 url,
 },
 };
}

export default async function GuidePage({ params }: PageProps<'/for/[slug]'>) {
 const { slug } = await params;
 const scope = getRequestScope();

 const guide = await readGuide(slug);

 /**
 * Siblings, computed from the grouping use case rather than by filtering the whole corpus
 * here. The route asks for guides by category and removes the one being read; deciding what
 * "related" means is a product rule and lives one layer down.
 */
 const listGuidesByCategory = scope.resolve(LIST_GUIDES_BY_CATEGORY);
 const groups = unwrapOrThrow(await listGuidesByCategory());
 const related =
 groups
 .find((group) => group.category === guide.category)
 ?.guides.filter((sibling) => sibling.slug !== guide.slug) ?? [];

 const t = scope.resolve(TRANSLATOR);
 const ctaLabel = t.t('cta.analyze');
 const reassurance = t.t('cta.reassurance');

 return (
 <>
 <GuideStructuredData guide={guide} siteUrl={appConfig.url} />

 <GuideHero guide={guide} ctaLabel={ctaLabel} reassurance={reassurance} />
 <GuideRisks risks={guide.typicalRisks} />
 <GuideChecklist steps={guide.checklist} />
 <GuideFaqSection faqs={guide.faqs} />
 <GuideRelated categoryLabel={guide.categoryLabel} guides={related} />

 <LandingClosingCta ctaLabel={ctaLabel} reassurance={reassurance} />
 </>
 );
}
