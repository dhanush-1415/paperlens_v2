import 'server-only';

import { CLOCK, type Container } from '@/core/container';

import {
  createAnalyzeDocument,
  createGetDocumentAnalysis,
  createListRecentAnalyses,
} from './application';
import {
  createDocumentAnalysisRepository,
  createGeminiAnalyzer,
} from './infrastructure';
import {
  ANALYZE_DOCUMENT,
  DOCUMENT_ANALYSIS_REPOSITORY,
  DOCUMENT_ANALYZER,
  GET_DOCUMENT_ANALYSIS,
  LIST_RECENT_ANALYSES,
} from './tokens';

/**
 * The feature's composition root (requirement 25).
 *
 * **This is the only file in the entire codebase that may import `./infrastructure`.** Every
 * other file in the feature — every use case, every component, every action — names an
 * abstraction and receives an instance. The concrete classes appear exactly once, here, which
 * is what reduces "replace the analyzer" to editing one line in one file.
 *
 * ### Why the feature registers itself rather than being registered by `bootstrap.ts`
 *
 * The server composition root would otherwise need to know this feature's tokens, its
 * adapters and their construction order — and so would every feature's, until `bootstrap.ts`
 * is a thousand lines that three teams edit and conflict on daily. Inverting it means adding
 * a feature is: write the module, add one `register…` call. Deleting a feature is: delete the
 * folder, delete one line. That is the property "feature-based modular architecture" is
 * actually asking for.
 *
 * ### Why everything is a singleton
 *
 * All five registrations are stateless closures over their dependencies, so a second instance
 * would be waste with no benefit. The data source is the interesting case: it holds the
 * `Map`, so a `transient` lifetime would hand each caller a fresh view of the same
 * module-level store — the same data with more allocation. Making the lifetime explicit here
 * rather than relying on the container's default keeps the reasoning next to the decision.
 *
 * The one thing that is *not* a singleton is anything request-scoped: there is nothing
 * per-request in this feature, and if there were it would be registered with `'scoped'` and
 * resolved through `getRequestScope()` rather than smuggled into a singleton's closure.
 */
export function registerDocumentAnalysis(container: Container): void {
  container.register(DOCUMENT_ANALYZER, () => createGeminiAnalyzer(), 'singleton');

  container.register(
    DOCUMENT_ANALYSIS_REPOSITORY,
    (c) => createDocumentAnalysisRepository(),
    'singleton',
  );

  container.register(
    ANALYZE_DOCUMENT,
    (c) =>
      createAnalyzeDocument({
        analyzer: c.resolve(DOCUMENT_ANALYZER),
        repository: c.resolve(DOCUMENT_ANALYSIS_REPOSITORY),
        now: c.resolve(CLOCK),
      }),
    'singleton',
  );

  container.register(
    GET_DOCUMENT_ANALYSIS,
    (c) => createGetDocumentAnalysis({ repository: c.resolve(DOCUMENT_ANALYSIS_REPOSITORY) }),
    'singleton',
  );

  container.register(
    LIST_RECENT_ANALYSES,
    (c) => createListRecentAnalyses({ repository: c.resolve(DOCUMENT_ANALYSIS_REPOSITORY) }),
    'singleton',
  );
}
