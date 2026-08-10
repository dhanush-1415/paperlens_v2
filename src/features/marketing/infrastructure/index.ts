/**
 * Adapter exports.
 *
 * **`module.ts` is the only file permitted to import this**, and ESLint enforces it. The
 * temptation is stronger here than anywhere else in the codebase — the data is static, a page
 * could just import `DOCUMENT_GUIDES` and render it, and for exactly one afternoon that would
 * be simpler. It is also why the content is behind a port in the first place.
 */

export {
 createStaticContentRepository,
 type StaticContentRepositoryDeps,
} from './static-content-repository';

export { DOCUMENT_GUIDES } from './guides.data';
export { LEGAL_DOCUMENTS } from './legal.data';
export { PRICING_PLAN } from './pricing.data';
