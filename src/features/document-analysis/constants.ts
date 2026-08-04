/**
 * Constants owned by this feature (requirement 19).
 *
 * The rule the codebase follows: a constant lives in `shared/constants` when a second feature
 * would need the same value, and here when it would not. `INPUT_LIMITS.maxDocumentChars` is
 * shared — the vault, the uploader and the billing copy all quote it. The clause taxonomy
 * below is not: nothing outside document analysis has an opinion about arbitration clauses,
 * and putting it in `shared/` would make `shared/` a dumping ground, which is how a shared
 * folder stops being shared and starts being global.
 */

import { type ClauseCategory, type DocumentType } from './domain';

/** Analytics `source` for a paste-box submission. Matches `DocumentSource` in core/analytics. */
export const ANALYSIS_SOURCE = 'paste' as const;

/**
 * Rate-limit scope for this feature's write path.
 *
 * Named here so the action does not spell the string inline. The limit itself lives in
 * `shared/constants/limits`, where a support engineer can answer "how many scans an hour?"
 * without reading a Server Action.
 */
export const ANALYZE_RATE_SCOPE = 'document.analyze' as const;

/** Human-readable document type labels. Keyed by the domain union, so a new type won't compile until it is named. */
export const DOCUMENT_TYPE_LABEL: Readonly<Record<DocumentType, string>> = {
  rental_agreement: 'Rental agreement',
  employment_contract: 'Employment contract',
  terms_of_service: 'Terms of service',
  loan_agreement: 'Loan agreement',
  insurance_policy: 'Insurance policy',
  service_contract: 'Service contract',
  other: 'Other',
};

/**
 * Clause category labels.
 *
 * English strings, not translation keys, and that is a deliberate limit of this scaffold: the
 * `Translator` port exists and the route resolves it, but a full message catalogue for ten
 * categories in N languages is content work rather than architecture. The seam is here —
 * swapping this record for `t(\`clause.${category}\`)` touches this file and nothing else.
 */
export const CLAUSE_CATEGORY_LABEL: Readonly<Record<ClauseCategory, string>> = {
  auto_renewal: 'Automatic renewal',
  arbitration: 'Forced arbitration',
  liability_cap: 'Limited liability',
  unilateral_change: 'One-sided changes',
  termination_penalty: 'Termination penalty',
  data_sharing: 'Data sharing',
  late_fee: 'Late fees',
  indemnity: 'Indemnification',
  non_compete: 'Non-compete',
  jurisdiction: 'Governing law',
};
