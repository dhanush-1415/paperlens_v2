import type { Metadata } from 'next';
import { cache } from 'react';

import { unwrapOrThrow } from '@/core/result/result';
import {
 GET_LEGAL_DOCUMENT,
 LegalDocumentView,
 type LegalDocumentSlug,
} from '@/features/marketing';
import { getRequestScope } from '@/server/bootstrap';

/**
 * The three legal routes, minus their route file.
 *
 * `/terms`, `/privacy` and `/cookies` differ by one string. Written out three times, they are
 * three places to forget `robots`, three `generateMetadata` implementations that drift, and
 * three files to edit when the canonical URL rule changes. Written once here, each route file
 * is two exports and a slug — which is the smallest a Next route can honestly be, because the
 * framework requires `page.tsx` to be a file per URL.
 *
 * The leading underscore is Next's private-folder/file convention: nothing here is routable,
 * regardless of where it sits in `app/`.
 *
 * ### Why this file lives in `app/` and not in the feature
 *
 * It is entirely routing: resolve a use case, unwrap, hand the entity to a view, describe the
 * page to a crawler. The *rendering* is `LegalDocumentView`, which is in the feature because it
 * knows what a `LegalDocument` is. If this helper started deciding what a clause looks like it
 * would have crossed the line; fetching and metadata have not.
 */

/**
 * `unwrapOrThrow` is correct at exactly this boundary and would not be one layer up.
 *
 * The slug is a closed union, so the port has no not-found case — a failure here means the
 * content source itself is unreachable, which is unrecoverable for a page whose entire body is
 * that content. Throwing hands it to `error.tsx`, which is the boundary that exists to render
 * it. The alternative, rendering a legal page with an empty body, is worse than an error page:
 * it looks like the terms are blank.
 *
 * `cache()` because `generateMetadata` and the page both need the document, and Next calls
 * them separately. One lookup per request, not two — free today against a typed array, and the
 * difference between one and two network calls once this is a CMS.
 */
const readLegalDocument = cache(async (slug: LegalDocumentSlug) => {
 const getLegalDocument = getRequestScope().resolve(GET_LEGAL_DOCUMENT);
 return unwrapOrThrow(await getLegalDocument(slug));
});

/**
 * Metadata for one legal page.
 *
 * `title` is the document's own, which the root layout's template suffixes with the product
 * name. Indexed deliberately: a terms page that ranks is a terms page a procurement reviewer
 * can find without asking sales for a link.
 */
export async function legalMetadata(slug: LegalDocumentSlug): Promise<Metadata> {
 const document = await readLegalDocument(slug);

 return {
 title: document.title,
 description: document.description,
 alternates: { canonical: `/${slug}` },
 openGraph: {
 type: 'article',
 title: document.title,
 description: document.description,
 url: `/${slug}`,
 },
 };
}

export async function LegalPage({ slug }: { slug: LegalDocumentSlug }) {
 const document = await readLegalDocument(slug);
 return <LegalDocumentView document={document} />;
}
