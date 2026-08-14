/**
 * Use case: analyse a pasted document and persist the result.
 *
 * A use case is the answer to "what can this system do", stated once, in one place, with no
 * reference to how it was triggered. This one does not know it was called by a Server Action;
 * it would behave identically driven by a queue worker, a CLI or a test. That is the property
 * being bought — and the reason it takes its collaborators as arguments rather than importing
 * them.
 *
 * ### What is deliberately *not* here
 *
 * Authentication, rate limiting, analytics and cache invalidation all live in the Server
 * Action above. They are properties of *this delivery mechanism* — an HTTP request from a
 * browser — not of the operation. A batch re-analysis job should not consume a user's
 * per-hour interactive quota, and a test of the analysis rules should not have to stand up a
 * rate limiter to run. Fusing them in is the standard way a use case becomes untestable.
 *
 * What *is* here is the ownership check, because "an analysis belongs to exactly one user" is
 * a rule of the system rather than of the transport.
 */

import { internalError, validationError, type AppError } from '@/core/errors/app-error';
import { err, isErr, ok, type Result } from '@/core/result/result';
import { INPUT_LIMITS } from '@/shared/constants/limits';

import {
 scoreOf,
 type AnalysisDraft,
 type DocumentAnalysis,
 type DocumentAnalysisRepository,
 type DocumentAnalyzer,
 type DocumentType,
} from '../domain';

export interface AnalyzeDocumentDeps {
 readonly analyzer: DocumentAnalyzer;
 readonly repository: DocumentAnalysisRepository;
 /**
 * Injected, never `new Date()`. A use case that reads the wall clock directly cannot be
 * tested for "expires in 30 days" without either waiting thirty days or monkey-patching a
 * global — and the lint rule that bans `Date.now()` in feature code exists to make this
 * non-negotiable rather than aspirational.
 */
 readonly now: () => Date;
}

export interface AnalyzeDocumentInput {
 readonly ownerId: string;
 readonly text: string;
 readonly media?: {
   readonly data: string;
   readonly mimeType: string;
 };
 readonly documentType: DocumentType;
 /** Optional. Derived from the document's own first line when absent. */
 readonly title?: string;
}

/**
 * First non-empty line, trimmed to something that fits in a list row.
 *
 * A fallback rather than a prompt: asking a user to name a document before they have seen
 * what is in it is asking them to do work the system can do. The ellipsis is a real character
 * rather than three dots so it wraps and reads correctly at any font size.
 */
function deriveTitle(text: string, documentType: DocumentType): string {
 const firstLine = text
 .split('\n')
 .map((line) => line.trim())
 .find((line) => line.length > 0);

 if (!firstLine) return DEFAULT_TITLES[documentType];

 return firstLine.length > MAX_DERIVED_TITLE
 ? `${firstLine.slice(0, MAX_DERIVED_TITLE - 1).trimEnd()}…`
 : firstLine;
}

const MAX_DERIVED_TITLE = 72;

const DEFAULT_TITLES: Readonly<Record<DocumentType, string>> = {
 rental_agreement: 'Untitled rental agreement',
 employment_contract: 'Untitled employment contract',
 terms_of_service: 'Untitled terms of service',
 loan_agreement: 'Untitled loan agreement',
 insurance_policy: 'Untitled insurance policy',
 service_contract: 'Untitled service contract',
 other: 'Untitled document',
};

export type AnalyzeDocument = (
 input: AnalyzeDocumentInput,
) => Promise<Result<DocumentAnalysis, AppError>>;

export function createAnalyzeDocument(deps: AnalyzeDocumentDeps): AnalyzeDocument {
 return async function analyzeDocument(input) {
 const text = input.text.trim();

 /**
 * Re-validated here even though the action already ran the zod schema.
 *
 * Not defensive duplication — a different guarantee. The schema protects the *form*: it
 * produces field errors a UI can render. This protects the *use case*: it holds for every
 * caller, including the queue worker that has no form and the test that constructs input
 * by hand. Validation at the edge is for messages; validation at the core is for
 * invariants.
 */
 if (!input.media) {
  if (text.length < INPUT_LIMITS.minDocumentChars) {
  return err(
  validationError({ text: [`Needs at least ${INPUT_LIMITS.minDocumentChars} characters.`] }),
  );
  }

  if (text.length > INPUT_LIMITS.maxDocumentChars) {
  return err(
  validationError({ text: [`Exceeds ${INPUT_LIMITS.maxDocumentChars} characters.`] }),
  );
  }
 }

 const flags = await deps.analyzer.analyze({ text, documentType: input.documentType, media: input.media });

 /**
 * Propagated, not swallowed. The analyzer's failure is the operation's failure, and the
 * error it produced already carries the code, severity and retryability the boundary
 * needs. Wrapping it in a new error here would replace a precise cause with a vague one.
 */
 if (isErr(flags)) return flags;

 const rawText = flags.value.transcription || text || '[Media File: No text extracted]';

 const dateEntities = flags.value.entities?.filter(e => e.iconHint === 'calendar' || e.label.toLowerCase().includes('date') || e.label.toLowerCase().includes('deadline'));
 let deadlineDate: string | null = null;
 const firstDateEntity = dateEntities?.[0];
 if (firstDateEntity) {
    const d = new Date(firstDateEntity.value);
    if (!isNaN(d.getTime())) {
      deadlineDate = d.toISOString();
    }
 }

 const draft: AnalysisDraft = {
 ownerId: input.ownerId,
 title: input.title?.trim() || deriveTitle(rawText, input.documentType),
 documentType: input.documentType,
 charCount: rawText.length,
 flags: flags.value.flags,
 score: scoreOf(flags.value.flags),
 summary: flags.value.summary,
 actionPlan: flags.value.actionPlan,
 deadlineDate: deadlineDate,
 urgency: flags.value.urgency,
 rawText: rawText,
 entities: flags.value.entities,
 legitimacy: flags.value.legitimacy,
 confidence: flags.value.confidence,
 suggestedQuestions: flags.value.suggestedQuestions,
 analyzedAt: deps.now().toISOString(),
 };

 const saved = await deps.repository.save(draft);
 if (isErr(saved)) return saved;

 /**
 * A store that returns a row belonging to someone else is either compromised or wrong,
 * and either way this is the last place the mistake is cheap. The check costs one
 * comparison and turns a data-leak class of bug into a 500.
 */
 if (saved.value.ownerId !== input.ownerId) {
 return err(internalError('Repository returned an analysis owned by a different user'));
 }

 return ok(saved.value);
 };
}
