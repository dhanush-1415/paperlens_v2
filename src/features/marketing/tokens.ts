/**
 * This feature's DI tokens.
 *
 * Same rule as `features/document-analysis/tokens.ts`: a token is declared in the module that
 * owns the abstraction it names, and it is declared exactly once. `token()` mints a unique
 * symbol, so `CONTENT_REPOSITORY` here and a `CONTENT_REPOSITORY` in some future `docs` feature
 * cannot collide even though they share a name.
 */

import { token } from '@/core/container';

import { type ContentRepository } from './domain';
import {
 type GetDocumentGuide,
 type GetLegalDocument,
 type GetPricing,
 type ListDocumentGuides,
 type ListGuideSlugs,
 type ListGuidesByCategory,
} from './application';

export const CONTENT_REPOSITORY = token<ContentRepository>('feature.marketing.contentRepository');

export const LIST_DOCUMENT_GUIDES = token<ListDocumentGuides>(
 'feature.marketing.listDocumentGuides',
);

export const LIST_GUIDES_BY_CATEGORY = token<ListGuidesByCategory>(
 'feature.marketing.listGuidesByCategory',
);

export const GET_DOCUMENT_GUIDE = token<GetDocumentGuide>('feature.marketing.getDocumentGuide');

export const LIST_GUIDE_SLUGS = token<ListGuideSlugs>('feature.marketing.listGuideSlugs');

export const GET_PRICING = token<GetPricing>('feature.marketing.getPricing');

export const GET_LEGAL_DOCUMENT = token<GetLegalDocument>('feature.marketing.getLegalDocument');
