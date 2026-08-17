import 'server-only';

import { type Container } from '@/core/container';

import {
  createGetDocumentGuide,
  createGetLegalDocument,
  createGetPricing,
  createListDocumentGuides,
  createListGuideSlugs,
  createListGuidesByCategory,
} from './application';
import { createStaticContentRepository } from './infrastructure';
import {
  CONTENT_REPOSITORY,
  GET_DOCUMENT_GUIDE,
  GET_LEGAL_DOCUMENT,
  GET_PRICING,
  LIST_DOCUMENT_GUIDES,
  LIST_GUIDE_SLUGS,
  LIST_GUIDES_BY_CATEGORY,
} from './tokens';

/**
 * The marketing feature's composition root.
 *
 * The only file in this feature that may import `./infrastructure`, and therefore the only
 * place the words `createStaticContentRepository` appear outside their own module. Swapping in
 * a CMS is one line here.
 *
 * ### Why `server-only`
 *
 * The corpus is ~700 lines of prose. It has no business in a client bundle, and without this
 * import nothing would stop a `'use client'` component from transitively pulling the whole
 * thing in — the failure being invisible, because the page would render perfectly and simply
 * cost 60KB more than it should. `server-only` turns that into a build error with a stack
 * trace naming the offending import.
 *
 * ### Why everything is a singleton
 *
 * The repository builds its slug index and validates the corpus in its factory. Transient
 * lifetimes would redo that work on every resolution — which, on a hub page that resolves two
 * use cases, means validating 25 guides twice per render for no benefit whatsoever. The data
 * is immutable and process-wide; one instance is the correct number.
 */
export function registerMarketing(container: Container): void {
  container.register(CONTENT_REPOSITORY, () => createStaticContentRepository(), 'singleton');

  container.register(
    LIST_DOCUMENT_GUIDES,
    (c) => createListDocumentGuides({ repository: c.resolve(CONTENT_REPOSITORY) }),
    'singleton',
  );

  container.register(
    LIST_GUIDES_BY_CATEGORY,
    (c) => createListGuidesByCategory({ repository: c.resolve(CONTENT_REPOSITORY) }),
    'singleton',
  );

  container.register(
    GET_DOCUMENT_GUIDE,
    (c) => createGetDocumentGuide({ repository: c.resolve(CONTENT_REPOSITORY) }),
    'singleton',
  );

  container.register(
    LIST_GUIDE_SLUGS,
    (c) => createListGuideSlugs({ repository: c.resolve(CONTENT_REPOSITORY) }),
    'singleton',
  );

  container.register(
    GET_PRICING,
    (c) => createGetPricing({ repository: c.resolve(CONTENT_REPOSITORY) }),
    'singleton',
  );

  container.register(
    GET_LEGAL_DOCUMENT,
    (c) => createGetLegalDocument({ repository: c.resolve(CONTENT_REPOSITORY) }),
    'singleton',
  );
}
