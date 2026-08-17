import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import {
  AnalysisReport,
  GET_DOCUMENT_ANALYSIS,
  toAnalysisDto,
  DocumentActions,
  SidebarCollapser,
  BackButton,
  type AnalysisReportLabels,
} from '@/features/document-analysis';
import { getServerContainer, requirePermission } from '@/server/bootstrap';
import { Container, LoadingState, PageHeader, Section } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Analysis',
  /**
   * `robots: noindex` on a page whose entire content is somebody's private contract. It is
   * behind a session check, so a crawler could not read it anyway — but a URL that leaks into
   * a referrer header and then into an index is a failure mode that costs nothing to close.
   */
  robots: { index: false, follow: false },
};

const LABELS: AnalysisReportLabels = {
  scoreLabel: 'Safety score',
  criticalLabel: 'Critical clauses',
  cautionLabel: 'Worth checking',
  findingsHeading: 'What we found',
  cleanTitle: 'Nothing flagged',
  cleanDescription:
    'We read the whole document and none of the clauses we check for appeared. That is a good sign, not a failed scan.',
  charCount: (count) => `${count.toLocaleString()} characters`,
  analyzedAt: (iso) =>
    new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    ),
  disclaimer:
    'PaperLens explains what a document says. It is not a law firm and this is not legal advice — for a decision that matters, take it to a solicitor.',
};

/**
 * `/document/[id]` — the report.
 *
 * ### The whole data path, in one function
 *
 * `requirePermission` → resolve a use case by token → `Result` → DTO → Server Component. The
 * page never sees a repository, a data source, a cache tag or a row. Swap the fake data source
 * for a real database and this file does not change by a character; that is the property the
 * layering exists to produce, and this is where it is visible.
 *
 * ### Why `notFound()` on the error path
 *
 * `getDocumentAnalysis` returns `err(NOT_FOUND)` both for an id that does not exist and for one
 * that belongs to somebody else — deliberately, in the use case, so the page cannot become an
 * oracle that confirms which documents exist by returning 403 for the ones that do. Rendering
 * the same 404 for both is the other half of that decision.
 */
function Report({ analysis, plan }: { readonly analysis: any; plan: any }) {
  return <AnalysisReport analysis={analysis} labels={LABELS} plan={plan} />;
}

import { prisma } from '@/server/db/prisma';

async function DocumentContainer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission('document.read');
  const result = await getServerContainer().resolve(GET_DOCUMENT_ANALYSIS)(id, session.userId);

  if (!result.ok) notFound();

  const analysisData = result.value;
  const analysisDto = toAnalysisDto(analysisData);

  const isResolved =
    analysisData.flags.length > 0 &&
    analysisData.resolvedFlagIds.length >= analysisData.flags.length;

  const sub = await prisma.userSubscription.findFirst({
    where: { userId: session.userId },
    include: { plan: true },
  });

  const plan = {
    canChat: sub ? sub.chatMessagesUsed < (sub.plan?.quotaChatMessagesPerMonth || 20) : false,
    usage: { chatMsgs: sub?.chatMessagesUsed || 0 },
    limits: { chatMsgs: sub?.plan?.quotaChatMessagesPerMonth || 20 },
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[800px] w-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 shadow-sm">
      {/* Document Topbar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-2 px-6">
        <div className="flex items-center gap-4">
          <BackButton />
        </div>

        {/* Actions: Re-analyze, Translate, Delete etc. */}
        <DocumentActions documentId={id} initialResolved={isResolved} />
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <Report analysis={analysisDto} plan={plan} />
      </main>

      <SidebarCollapser />
    </div>
  );
}

export default function DocumentPage(props: PageProps<'/document/[id]'>) {
  return (
    <Suspense fallback={<LoadingState label="Loading your analysis" />}>
      <DocumentContainer params={props.params} />
    </Suspense>
  );
}
