/**
 * The domain layer's surface.
 *
 * Re-exported for the layers above it inside this feature. Nothing outside the feature reads
 * from here — `features/document-analysis/index.ts` decides what the rest of the application
 * is allowed to see, and it is a much smaller set than this.
 */

export {
  CLAUSE_CATEGORIES,
  DOCUMENT_TYPES,
  toSummary,
  type AnalysisDraft,
  type ClauseCategory,
  type DocumentAnalysis,
  type DocumentAnalysisSummary,
  type DocumentType,
  type RiskFlag,
  type RiskLevel,
  type RiskScore,
  type KeyEntity,
} from './document';

export { countByLevel, highestLevel, RISK_SEVERITY, scoreOf, sortFlags } from './risk';

export type { AnalysisRequest, DocumentAnalysisRepository, DocumentAnalyzer } from './ports';
