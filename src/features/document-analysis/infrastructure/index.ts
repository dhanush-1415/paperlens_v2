/**
 * Adapter exports.
 *
 * **`module.ts` is the only file permitted to import this**, and ESLint enforces it:
 * `application/` and `presentation/` are both blocked from any path containing
 * `infrastructure/`. That single restriction is what makes the ports real — if a use case
 * could import `createHeuristicAnalyzer`, the interface in `domain/ports.ts` would be
 * documentation rather than a boundary.
 */

export {
 createFakeAnalysisDataSource,
 type AnalysisRecord,
 type FakeAnalysisDataSource,
 type FakeAnalysisDataSourceOptions,
 type FlagRecord,
} from './fake-analysis-data-source';

export {
 createDocumentAnalysisRepository,
 type DocumentAnalysisRepositoryDeps,
} from './document-analysis-repository';

export { createHeuristicAnalyzer } from './heuristic-analyzer';
