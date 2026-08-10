/**
 * `document-analysis` — the public API (requirement 25).
 *
 * Everything outside this feature imports from `@/features/document-analysis` and nothing
 * deeper. The ESLint zone in `eslint.config.mjs` enforces it: a route that reaches for
 * `@/features/document-analysis/infrastructure/...` fails lint, not review. What that buys is
 * the freedom to move, rename and rewrite every file below this one without a codemod — the
 * only promise the feature has made is this list.
 *
 * ### Two entry points, on purpose
 *
 * | File | Imported by | Contains |
 * | --- | --- | --- |
 * | `index.ts` (this file) | routes, other features | types, components, mappers, tokens |
 * | `module.ts` | `server/bootstrap.ts` only | `registerDocumentAnalysis(container)` |
 *
 * The split is not stylistic — it breaks a genuine import cycle. `presentation/actions.ts`
 * imports `@/server/bootstrap` for `action()` and `checkPermissionResult()`. If the
 * composition root imported *this* barrel to get the registration function, the graph would be
 * `bootstrap → index → presentation/actions → bootstrap`. And `action()` is not lazy: it runs
 * at module scope and resolves the container as it does, so the cycle would be evaluated, not
 * merely declared — the failure is a `TypeError` on an undefined import during boot, at a
 * point in the trace that names none of the files responsible.
 *
 * `module.ts` never imports `presentation/`, so importing it directly is the edge that does not
 * close the loop. The rule, stated plainly for whoever adds the second feature: **the
 * composition root imports `module.ts`; everyone else imports `index.ts`.**
 *
 * ### What is deliberately absent
 *
 * · **Repository and data-source implementations.** They are named by tokens; the container
 * hands out whichever is bound. A caller that could import `createFakeAnalysisDataSource`
 * would eventually import it, and the swap that this whole arrangement exists to permit
 * would stop being a one-line change in `module.ts`.
 * · **`analyzeDocumentSchema`.** The form posts to the action and the action validates. A
 * second caller re-implementing the parse would be a second definition of "valid input",
 * and the two would diverge on the day the limit changes.
 * · **Entities.** `DocumentAnalysis` carries `ownerId` and is tainted. Callers get DTOs; the
 * type is exported for the boundary that maps one to the other, not for rendering.
 */

/* ── Domain vocabulary ─────────────────────────────────────────────────────────────────────
 * Types and value lists a caller genuinely needs: a route rendering a type filter needs
 * `DOCUMENT_TYPES`, a page prop typed as a level needs `RiskLevel`. All pure, all free of
 * runtime weight.
 */
export {
 CLAUSE_CATEGORIES,
 DOCUMENT_TYPES,
 /**
 * Public because it is half of `DocumentAnalysisRepository.save()`. A port whose argument
 * type is private cannot be implemented from outside the feature, which would make the
 * abstraction decorative — and it is what the repository contract suite constructs.
 */
 type AnalysisDraft,
 type ClauseCategory,
 type DocumentAnalysis,
 type DocumentAnalysisSummary,
 type DocumentType,
 type RiskFlag,
 type RiskLevel,
} from './domain';

/* ── Ports ────────────────────────────────────────────────────────────────────────────────
 * The two abstractions this feature is written against. Exported as types only, and for one
 * reason: so an implementation can be written — and held to the shared contract suite in
 * `src/test/contracts/` — from outside the feature. Nothing here exposes an implementation;
 * `module.ts` still decides which one the container hands out.
 */
export type { AnalysisRequest, DocumentAnalysisRepository, DocumentAnalyzer } from './domain';

/* ── Use-case contracts ───────────────────────────────────────────────────────────────────
 * The function shapes a route resolves from the container. Exported as types only: the
 * factories that build them are an implementation detail of `module.ts`.
 */
export type {
 AnalyzeDocument,
 AnalyzeDocumentInput,
 GetDocumentAnalysis,
 ListRecentAnalyses,
} from './application';

/* ── DTOs and their mappers ───────────────────────────────────────────────────────────────
 * The only shapes permitted to cross to a client, and the only sanctioned way to produce one.
 */
export {
 toAnalysisDto,
 toSummaryDto,
 type AnalysisDto,
 type AnalysisSummaryDto,
 type RiskFlagDto,
 type RiskScoreDto,
} from './application';

/* ── DI tokens ────────────────────────────────────────────────────────────────────────────
 * How a route asks for a use case. The tokens are exported and the implementations are not,
 * which is the entire point: a caller can name what it wants and cannot name what provides it.
 */
export {
 ANALYZE_DOCUMENT,
 GET_DOCUMENT_ANALYSIS,
 LIST_RECENT_ANALYSES,
} from './tokens';

/* ── Presentation ─────────────────────────────────────────────────────────────────────────
 * Components and the label bags they render. No route builds this feature's UI out of
 * primitives; if a screen needs a different arrangement, it gets a component here.
 */
export {
 AnalysisForm,
 AnalysisReport,
 analyzeDocumentAction,
 RiskFlagCard,
 type AnalysisFormLabels,
 type AnalysisFormProps,
 type AnalysisReportLabels,
 type AnalysisReportProps,
 type RiskFlagCardProps,
} from './presentation';

/* ── Feature constants ────────────────────────────────────────────────────────────────────
 * Label maps, so a caller rendering a document type in a breadcrumb spells it the same way
 * the report does.
 */
export { CLAUSE_CATEGORY_LABEL, DOCUMENT_TYPE_LABEL } from './constants';
