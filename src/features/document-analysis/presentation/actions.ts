'use server';

import { redirect } from 'next/navigation';

import { ANALYTICS, RATE_LIMITER, CLOCK } from '@/core/container';
import { expire } from '@/core/cache/revalidate';
import { documentTags, vaultTags } from '@/core/cache/tags';
import { rateLimitError } from '@/core/errors/app-error';
import { unwrapOrThrow } from '@/core/result/result';
import { ROUTES } from '@/shared/constants/routes';
import { parseFormData } from '@/shared/validation';
import { action, checkPermissionResult, getServerContainer } from '@/server/bootstrap';

import { ANALYSIS_SOURCE, ANALYZE_RATE_SCOPE } from '../constants';
import { ANALYZE_DOCUMENT } from '../tokens';
import { analyzeDocumentSchema } from '../validation';

/**
 * The mutation entry point (requirements 2, 3, 4, 5, 11, 15, 16).
 *
 * ### Why this file is thick and the use case is thin
 *
 * Everything here is a property of *being called by a browser over HTTP*: who the caller is,
 * whether they are allowed, whether they are doing it too fast, what the product wants to
 * measure, which caches the write invalidates, and where the user goes next. None of it is a
 * property of "analyse a document" — a queue worker re-analysing a thousand contracts should
 * do none of these things. Keeping them here and out of `application/` is what lets the use
 * case be tested in three lines and reused by a caller that has no request.
 *
 * ### Why it throws instead of returning `err`
 *
 * `action()` wraps this in `withActionErrors`, which catches, logs, reports and serialises.
 * Returning an `err` from inside would produce `ok(err(…))` — a nested `Result` every caller
 * would have to unwrap twice, and one that skips the logging entirely. So the body throws
 * `AppError`s and the wrapper owns the conversion. `unwrapOrThrow` is the bridge: it takes
 * the `Result` currency the layers below speak and re-raises the error for the boundary.
 *
 * ### The check that must never be deleted
 *
 * `checkPermissionResult` runs *here*, even though `proxy.ts` already redirected an
 * unauthenticated visitor away from `/scan`. Next's own documentation is explicit that proxy
 * is not authorization: a Server Action is a POST endpoint with a public URL, reachable with
 * curl and no page load at all. The proxy is a redirect for humans; this line is the actual
 * boundary.
 */
export const analyzeDocumentAction = action(
 'document.analyze',
 async (_previous: unknown, formData: FormData): Promise<never> => {
 const container = getServerContainer();

 // 1 ─ Authorization. Before anything is parsed, and certainly before anything is stored.
 const session = unwrapOrThrow(await checkPermissionResult('document.create'));

 /**
 * 2 ─ Rate limiting.
 *
 * Keyed on the user id, not the IP: an IP key punishes everyone behind one office NAT and
 * is trivially evaded from a phone. The window is declared in `shared/constants/limits`
 * so support can answer "how many scans an hour" without reading this file.
 *
 * Deliberately *after* the auth check and *before* the parse, because parsing a
 * 200,000-character document is the expensive part and a limiter that runs after it has
 * already paid the cost it exists to avoid.
 */
 const decision = await container.resolve(RATE_LIMITER).consume(ANALYZE_RATE_SCOPE, session.userId);

 if (!decision.allowed) {
 const nowMs = container.resolve(CLOCK)().getTime();
 const retryAfter = Math.max(1, Math.ceil((decision.resetAt - nowMs) / 1_000));
 container.resolve(ANALYTICS).track('quota.exceeded', { quota: 'scans', plan: session.plan });
 throw rateLimitError(retryAfter, ANALYZE_RATE_SCOPE);
 }

 /**
 * 3 ─ Validation, server-side and authoritative.
 *
 * The same schema the form runs before submitting. That check is a courtesy to save a
 * round trip; this one is the one that decides, because a `FormData` body is whatever the
 * sender chose to send.
 *
 * `parseFormData` returns `Result` with field errors already keyed by name, so
 * `unwrapOrThrow` hands the boundary a `VALIDATION` error whose `fieldErrors` survive
 * `toClient()` and land straight in the form's `<Field error>` props.
 */
 const input = unwrapOrThrow(parseFormData(analyzeDocumentSchema, formData));

 // 4 ─ Intent, measured before the outcome is known, so the funnel has a denominator.
 container.resolve(ANALYTICS).track('document.submitted', {
 source: ANALYSIS_SOURCE,
 charCount: input.text.length,
 documentType: input.documentType,
 });

 const startedAt = container.resolve(CLOCK)().getTime();

 // 5 ─ The operation. One resolved use case, one call, no assembly.
 const analysis = unwrapOrThrow(
 await container.resolve(ANALYZE_DOCUMENT)({
 ownerId: session.userId,
 text: input.text,
 documentType: input.documentType,
 ...(input.title === undefined ? {} : { title: input.title }),
 }),
 );

 container.resolve(ANALYTICS).track('document.analyzed', {
 documentId: analysis.id,
 durationMs: container.resolve(CLOCK)().getTime() - startedAt,
 flagCount: analysis.flags.length,
 });

 /**
 * 6 ─ Invalidation, before the redirect.
 *
 * `expire` (not `markStale`) because the person who triggered this write is about to look
 * at the result — stale-while-revalidate would show them an empty vault one render after
 * they filled it. See `core/cache/revalidate.ts` for why those are two different verbs.
 *
 * The document's own tags are a no-op on a create: nothing has cached an id that did not
 * exist a moment ago. They are here because re-analysis will reuse this path, and an
 * invalidation that is correct only for the create case is a bug waiting for the second
 * caller. The vault tag is the one doing real work today.
 */
 expire([...documentTags(analysis.id, session.userId), ...vaultTags(session.userId)]);

 /**
 * 7 ─ Redirect, deliberately outside any try/catch.
 *
 * `redirect()` works by throwing a control-flow signal. `withActionErrors` calls
 * `normalizeError`, which re-throws that signal before treating anything as an error —
 * which is the only reason a redirect inside a wrapped action still redirects instead of
 * becoming a rendered "something went wrong".
 *
 * Redirecting rather than returning the DTO also makes the result addressable: the user
 * can bookmark it, share it, or reload without re-submitting the form.
 */
 redirect(ROUTES.document(analysis.id));
 },
);
