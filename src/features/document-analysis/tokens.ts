/**
 * This feature's DI tokens (requirement 8).
 *
 * ### Why these are not in `core/container/tokens.ts`
 *
 * That file says every token is "declared here and nowhere else", and it is right about the
 * tokens it owns — the framework's. It cannot own these. A token is typed by what it resolves
 * to, so `token<DocumentAnalyzer>()` in `core/` would make `core/` import a feature's type,
 * and the whole architecture rests on `core/` not knowing that features exist. ESLint blocks
 * the import outright.
 *
 * So the rule is one level more precise than "one file": **a token is declared in the module
 * that owns the abstraction it names.** Framework abstractions — `LOGGER`, `CLOCK`,
 * `AUTH_PROVIDER` — are owned by `core/`. `DOCUMENT_ANALYZER` is owned by this feature, in
 * this file, and nowhere else. The property that matters is preserved: there is exactly one
 * declaration of each token in the codebase, and `token()` mints a unique symbol so two
 * features cannot collide even if they both pick the name `REPOSITORY`.
 *
 * ### Why tokens live outside `domain/`
 *
 * `token()` comes from `@/core/container`, and `domain/` may not import it. That is not an
 * awkward workaround — it is the layering being right. The *interface* is a domain concept;
 * *how instances get wired* is a framework concern. Keeping them in separate files means the
 * domain stays testable by direct construction, with no container anywhere near it.
 */

import { token } from '@/core/container';

import { type DocumentAnalysisRepository, type DocumentAnalyzer } from './domain';
import {
  type AnalyzeDocument,
  type GetDocumentAnalysis,
  type ListRecentAnalyses,
} from './application';

export const DOCUMENT_ANALYZER = token<DocumentAnalyzer>('feature.documentAnalysis.analyzer');

export const DOCUMENT_ANALYSIS_REPOSITORY = token<DocumentAnalysisRepository>(
  'feature.documentAnalysis.repository',
);

/**
 * Use cases are registered as tokens too, not just their collaborators.
 *
 * The alternative is a Server Action that resolves an analyzer and a repository and then
 * calls `createAnalyzeDocument({...})` itself — which puts assembly in the transport layer, so
 * every new entry point re-does it, and each one is free to assemble it slightly differently.
 * Resolving a fully-built use case means the wiring exists once, in `module.ts`, and a test
 * can override the whole operation with `container.override(ANALYZE_DOCUMENT, fake)` rather
 * than reconstructing its dependency graph.
 */
export const ANALYZE_DOCUMENT = token<AnalyzeDocument>('feature.documentAnalysis.analyzeDocument');

export const GET_DOCUMENT_ANALYSIS = token<GetDocumentAnalysis>(
  'feature.documentAnalysis.getDocumentAnalysis',
);

export const LIST_RECENT_ANALYSES = token<ListRecentAnalyses>(
  'feature.documentAnalysis.listRecentAnalyses',
);
