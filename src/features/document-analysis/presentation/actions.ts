'use server';

import { redirect } from 'next/navigation';

import { ANALYTICS, RATE_LIMITER, CLOCK } from '@/core/container';
import { expire } from '@/core/cache/revalidate';
import { documentTags, vaultTags } from '@/core/cache/tags';
import { rateLimitError } from '@/core/errors/app-error';
import { unwrapOrThrow } from '@/core/result/result';
import { ROUTES } from '@/shared/constants/routes';
import { parseFormData } from '@/shared/validation';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/config/env.server';
import { v4 as uuidv4 } from 'uuid';
import { action, checkPermissionResult, getServerContainer } from '@/server/bootstrap';
import { getUserPlan, incrementScanUsage } from '@/server/dal/plan';
import { forbiddenError, validationError } from '@/core/errors/app-error';

import { ANALYSIS_SOURCE, ANALYZE_RATE_SCOPE } from '../constants';
import { ANALYZE_DOCUMENT } from '../tokens';
import { analyzeDocumentSchema } from '../validation';

import { vectorizeDocument } from '../application/vectorize-document';
import { dispatchWebhookEvent } from '@/features/webhooks/application';

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
  async (_previous: unknown, formData: FormData): Promise<never | { id: string }> => {
    const container = getServerContainer();

    // 1 ─ Authorization. Before anything is parsed, and certainly before anything is stored.
    const session = unwrapOrThrow(await checkPermissionResult('document.create'));

    // 1.5 ─ Subscription Quota Check
    const planData = await getUserPlan();
    if (!planData.entitlements.canScan) {
      throw forbiddenError(
        'Scan quota exceeded. Please upgrade your plan in the Billing dashboard.',
      );
    }

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
    const decision = await container
      .resolve(RATE_LIMITER)
      .consume(ANALYZE_RATE_SCOPE, session.userId);

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
    const file = formData.get('file') as File | null;
    let media: { data: string; mimeType: string } | undefined = undefined;
    let fileUrl: string | undefined = undefined;
    let mimeType: string | undefined = undefined;

    if (file && file.size > 0) {
      mimeType = file.type;

      // Upload original file to Supabase Storage
      console.info(`[Action] Uploading ${file.size} byte file to Supabase Storage...`);
      if (serverEnv.SUPABASE_URL && serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabaseAdmin = createClient(
            serverEnv.SUPABASE_URL,
            serverEnv.SUPABASE_SERVICE_ROLE_KEY,
          );
          const fileExt = file.name.split('.').pop() || 'bin';
          const filePath = `${session.userId}/${uuidv4()}.${fileExt}`;
          const buffer = Buffer.from(await file.arrayBuffer());

          await supabaseAdmin.storage.from('vault-documents').upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

          const { data } = supabaseAdmin.storage.from('vault-documents').getPublicUrl(filePath);
          fileUrl = data.publicUrl;

          // EXTRACT TEXT VIA FASTAPI
          console.info(`[Action] Requesting text extraction from FastAPI for ${fileUrl}...`);
          const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
          const extractRes = await fetch(`${fastApiUrl}/api/v1/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_url: fileUrl, filename: file.name }),
          });

          if (extractRes.ok) {
            const extractData = await extractRes.json();
            if (extractData.status === 'success') {
               if (extractData.content.type === 'text') {
                   formData.set('text', extractData.content.text);
               } else if (extractData.content.type === 'vision') {
                   formData.set('text', extractData.content.text || '[Image File]');
                   media = { data: extractData.content.images[0], mimeType: 'image/jpeg' };
               }
            }
          } else {
             console.error('[Action] FastAPI extraction failed:', await extractRes.text());
          }

        } catch (e) {
          console.error('Failed to upload or extract via FastAPI', e);
        }
      }
    }

    const input = unwrapOrThrow(parseFormData(analyzeDocumentSchema, formData));

    // 4 ─ Intent, measured before the outcome is known, so the funnel has a denominator.
    container.resolve(ANALYTICS).track('document.submitted', {
      source: ANALYSIS_SOURCE,
      charCount: input.text.length,
      documentType: input.documentType,
    });

    const startedAt = container.resolve(CLOCK)().getTime();

    // 5 ─ The operation. One resolved use case, one call, no assembly.
    console.info(`[Action] Invoking Gemini Analysis with ${media ? 'Media (Vision)' : 'Text'} payload...`);
    const analysis = unwrapOrThrow(
      await container.resolve(ANALYZE_DOCUMENT)({
        ownerId: session.userId,
        text: input.text,
        media,
        documentType: input.documentType,
        tone: input.tone,
        fileUrl,
        mimeType,
        ...(input.title === undefined ? {} : { title: input.title }),
      }),
    );

    console.info(`[Action] Gemini Analysis completed successfully in ${container.resolve(CLOCK)().getTime() - startedAt}ms.`);

    container.resolve(ANALYTICS).track('document.analyzed', {
      documentId: analysis.id,
      durationMs: container.resolve(CLOCK)().getTime() - startedAt,
      flagCount: analysis.flags.length,
    });

    // Background vectorize for RAG Semantic Search
    void vectorizeDocument(analysis.id, analysis.rawText);

    // Background Webhook dispatch for B2B ERPs
    void dispatchWebhookEvent(session.userId, 'document.analyzed', {
      analysisId: analysis.id,
      title: analysis.title,
      riskLevel: analysis.score.level,
      flagsCount: analysis.flags.length,
    });

    // 5.5 ─ Increment Usage Tracking
    await incrementScanUsage(session.userId);

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

    if (formData.get('noRedirect') === 'true') {
      return { id: analysis.id } as any;
    }

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

export const resolveFlagAction = action(
  'document.resolveFlag',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const session = unwrapOrThrow(await checkPermissionResult('document.read'));
    const documentId = formData.get('documentId') as string;
    const flagId = formData.get('flagId') as string;

    if (!documentId || !flagId) {
      throw forbiddenError('Missing required identifiers');
    }

    const { prisma } = await import('@/server/db/prisma');

    const doc = await prisma.documentAnalysis.findFirst({
      where: { id: documentId, ownerId: session.userId },
    });

    if (!doc) throw forbiddenError('Document not found');

    const isResolved = doc.resolvedFlagIds.includes(flagId);
    const updatedIds = isResolved
      ? doc.resolvedFlagIds.filter((id) => id !== flagId)
      : [...doc.resolvedFlagIds, flagId];

    await prisma.documentAnalysis.update({
      where: { id: documentId },
      data: { resolvedFlagIds: updatedIds },
    });

    expire([...documentTags(documentId, session.userId)]);

    redirect(ROUTES.document(documentId));
  },
);

export const analyzeUrlAction = action(
  'document.analyzeUrl',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const container = getServerContainer();
    const session = unwrapOrThrow(await checkPermissionResult('document.create'));

    const planData = await getUserPlan();
    if (!planData.entitlements.canScan) {
      throw forbiddenError(
        'Scan quota exceeded. Please upgrade your plan in the Billing dashboard.',
      );
    }

    const decision = await container
      .resolve(RATE_LIMITER)
      .consume(ANALYZE_RATE_SCOPE, session.userId);
    if (!decision.allowed) {
      const nowMs = container.resolve(CLOCK)().getTime();
      const retryAfter = Math.max(1, Math.ceil((decision.resetAt - nowMs) / 1_000));
      throw rateLimitError(retryAfter, ANALYZE_RATE_SCOPE);
    }

    const url = formData.get('url') as string;
    if (!url || !/^https?:\/\//i.test(url)) {
      throw validationError({ url: ['Invalid URL provided.'] });
    }

    let extractedText = '';
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'PaperLensBot/1.0' } });
      if (!response.ok) throw new Error('Failed to fetch URL');
      const html = await response.text();

      extractedText = html
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
    } catch (e) {
      throw validationError({
        url: ['Could not read the contents of this URL. Ensure it is public and accessible.'],
      });
    }

    const startedAt = container.resolve(CLOCK)().getTime();

    const analysis = unwrapOrThrow(
      await container.resolve(ANALYZE_DOCUMENT)({
        ownerId: session.userId,
        text: extractedText,
        documentType: 'other',
        title: url,
      }),
    );

    await incrementScanUsage(session.userId);
    expire([...documentTags(analysis.id, session.userId), ...vaultTags(session.userId)]);
    redirect(ROUTES.document(analysis.id));
  },
);

export const reanalyzeDocumentAction = action(
  'document.reanalyze',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const session = unwrapOrThrow(await checkPermissionResult('document.create'));
    const container = getServerContainer();

    const documentId = formData.get('documentId') as string;
    const tone = formData.get('tone') as 'simple' | 'professional' | undefined;

    if (!documentId) {
      throw forbiddenError('Missing required identifiers');
    }

    const { prisma } = await import('@/server/db/prisma');

    const doc = await prisma.documentAnalysis.findFirst({
      where: { id: documentId, ownerId: session.userId },
    });

    if (!doc) throw forbiddenError('Document not found');

    const requestedTone = tone || 'professional';
    const isForce = formData.get('force') === 'true';
    const cachedAnalyses = (doc.cachedAnalyses as Record<string, any>) || {};

    let updateData: any;

    if (cachedAnalyses[requestedTone] && !isForce) {
      updateData = cachedAnalyses[requestedTone];
    } else {
      // Manually run the analyzer. 
      // We bypass the ANALYZE_DOCUMENT usecase so we don't create a new database record.
      const { DOCUMENT_ANALYZER } = await import('../tokens');
      const analyzer = container.resolve(DOCUMENT_ANALYZER);
      
      const analysisResult = await analyzer.analyze({
        text: doc.rawText,
        documentType: doc.documentType as any,
        tone: requestedTone as any,
      });

      if (analysisResult.ok === false) {
        throw analysisResult.error;
      }

      const { scoreOf } = await import('../domain/risk');
      const score = scoreOf(analysisResult.value.flags);

      updateData = {
        flags: analysisResult.value.flags as any,
        scoreValue: score.value,
        scoreLevel: score.level,
        summary: analysisResult.value.summary,
        actionPlan: analysisResult.value.actionPlan as string[],
        urgency: analysisResult.value.urgency,
        entities: analysisResult.value.entities as any,
        legitimacy: analysisResult.value.legitimacy,
        confidence: analysisResult.value.confidence,
        suggestedQuestions: analysisResult.value.suggestedQuestions as string[],
      };

      cachedAnalyses[requestedTone] = updateData;
    }

    await prisma.documentAnalysis.update({
      where: { id: documentId },
      data: {
        ...updateData,
        cachedAnalyses,
      },
    });

    expire([...documentTags(documentId, session.userId), ...vaultTags(session.userId)]);
    redirect(ROUTES.document(documentId));
  },
);
