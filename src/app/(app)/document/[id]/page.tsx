import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import {
  AnalysisReport,
  GET_DOCUMENT_ANALYSIS,
  toAnalysisDto,
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
async function Report({ id }: { readonly id: string }) {
  /**
   * Permission, not just authentication. `document.read` is in the policy matrix for every
   * role today, which is exactly why it is checked by name: the day a restricted role is added
   * the change is one line in `core/auth/policy.ts`, not an audit of every page.
   */
  const session = await requirePermission('document.read');

  const result = await getServerContainer().resolve(GET_DOCUMENT_ANALYSIS)(id, session.userId);

  if (!result.ok) notFound();

  /**
   * `toAnalysisDto` is not optional politeness. The entity is tainted with
   * `experimental_taintObjectReference`, so passing `result.value` straight into a component
   * tree containing a Client Component throws at render — the mapper is the boundary, and the
   * runtime enforces it rather than trusting this line to be written correctly.
   */
  return <AnalysisReport analysis={toAnalysisDto(result.value)} labels={LABELS} />;
}

export default async function DocumentPage(props: PageProps<'/document/[id]'>) {
  const { id } = await props.params;

  return (
    <Container>
      <Section spacing="lg">
        <PageHeader
          title="Analysis"
          description="Worst clause first. Open a finding to see the exact wording it came from."
        />

        {/*
         * Everything above is static and streams immediately; only the report waits on the
         * session and the read. Under `cacheComponents` this is not a nicety — a request API
         * outside a Suspense boundary is a build error, and the boundary's placement is
         * literally the line between the prerendered shell and the dynamic hole in it.
         */}
        <Suspense fallback={<LoadingState label="Loading your analysis" />}>
          <Report id={id} />
        </Suspense>
      </Section>
    </Container>
  );
}
