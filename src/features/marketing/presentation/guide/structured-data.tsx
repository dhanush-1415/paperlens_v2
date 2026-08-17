/**
 * Structured data for one guide: a breadcrumb trail and the FAQ pairs.
 *
 * ### Why it is generated from the entity instead of hand-written
 *
 * Structured data that disagrees with the page is worse than none — it is the one SEO mistake
 * that gets a site's rich results suppressed rather than merely ignored. Both blocks below are
 * derived from the same `DocumentGuide` the sections render, so the markup cannot drift from the
 * visible text: a question edited in the corpus changes both, or neither.
 *
 * ### Why `<script>` children and not `dangerouslySetInnerHTML`
 *
 * Next's own JSON-LD guide reaches for `dangerouslySetInnerHTML`, and ESLint bans that API
 * everywhere except the audited theme bootstrap — correctly, because one exception is auditable
 * and a second is a precedent. Passing the JSON as a child of `<script>` produces byte-identical
 * output through the path React already supports for inline scripts.
 *
 * The sanitisation the framework's guide calls for still applies, and is applied: React does not
 * escape text inside `<script>`, so a `</script>` sequence appearing inside guide prose would end
 * the element early and put the rest of the JSON into the document as markup. Escaping every `<`
 * to its unicode form closes that off — the JSON parses identically and the string can no longer
 * contain a tag.
 *
 * ### Why the URLs are absolute
 *
 * `metadataBase` resolves relative canonicals for Next's own metadata, but it does not touch a
 * `<script>` body. A breadcrumb whose items are `/use-cases` is a breadcrumb no consumer can
 * resolve, so the route passes the site origin in — configuration is the app layer's to read.
 */

import type { DocumentGuide } from '../../domain';

export interface GuideStructuredDataProps {
  guide: DocumentGuide;
  /** Absolute origin, no trailing slash — `appConfig.url`, read by the route. */
  siteUrl: string;
}

/** Trailing slashes on the origin would produce `https://x//use-cases`, which is a distinct URL. */
function absolute(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/+$/, '')}${path}`;
}

export function GuideStructuredData({ guide, siteUrl }: GuideStructuredDataProps) {
  const graph: unknown[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absolute(siteUrl, '/') },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Document guides',
          item: absolute(siteUrl, '/use-cases'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: guide.heading,
          item: absolute(siteUrl, `/for/${guide.slug}`),
        },
      ],
    },
  ];

  // A `FAQPage` with no questions is invalid markup rather than an empty one; omit the block.
  if (guide.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c',
  );

  return <script type="application/ld+json">{json}</script>;
}
