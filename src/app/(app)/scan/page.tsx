import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AnalysisForm, type AnalysisFormLabels } from '@/features/document-analysis';
import { INPUT_LIMITS } from '@/shared/constants/limits';
import { Container, Heading, PageHeader, Section, Skeleton, Text } from '@/shared/ui';
import { requireSession } from '@/server/bootstrap';

export const metadata: Metadata = {
 title: 'Scan a document',
 description:
 'Paste a contract, lease or notice and see the clauses that cost you money, ranked by severity.',
};

/**
 * `/scan` — the feature's entry point.
 *
 * The page is thirty lines and does four things: check the session, build the labels, render
 * the form, set the metadata. It contains no business logic, no data access and no knowledge
 * of how an analysis is produced — which is the actual test of whether the architecture holds.
 * Everything below the form comes from `@/features/document-analysis`, through its public API,
 * with no path deeper than the feature name.
 */

const LABELS: AnalysisFormLabels = {
 documentLabel: 'Your document',
 documentDescription:
 'Paste the full text. Nothing is stored until the analysis finishes, and only you can read it.',
 documentPlaceholder: 'Paste your contract, lease, offer letter or terms of service here…',
 typeLabel: 'Document type',
 titleLabel: 'Title',
 titleDescription: 'Optional. We derive one from the first line if you leave this blank.',
 titlePlaceholder: 'Flat 3, Kingsway — tenancy agreement',
 submit: 'Analyse document',
 submitting: 'Reading your document…',
 errorTitle: 'We could not analyse that',
 counter: '{count} / {max} characters',
};

/**
 * The gate, isolated in its own component.
 *
 * `requireSession()` reads `cookies()` and throws `unauthorized()` when there is nothing to
 * read, so it is request data and must sit inside a Suspense boundary under `cacheComponents`.
 * Keeping it in a leaf means the page heading and the form's static chrome still prerender.
 *
 * The check is real, not decorative: `proxy.ts` already bounced a visitor with no session
 * cookie, but a cookie is not a session — it can be stale, revoked, or forged — and the proxy
 * never validates it. This is the first place the session is actually verified, and the Server
 * Action verifies again, because a POST to it never passes through this page at all.
 */
async function ScanForm() {
 await requireSession();
 return <AnalysisForm labels={LABELS} />;
}

export default function ScanPage() {
 return (
 <Container>
 <Section spacing="lg">
 <PageHeader
 title="Scan a document"
 description="Paste the text and we will read it the way a lawyer would — worst clause first."
 />

 <Suspense
 fallback={
 <div className="flex flex-col gap-6">
 <Skeleton className="h-64 w-full" />
 <Skeleton className="h-11 w-40" />
 </div>
 }
 >
 <ScanForm />
 </Suspense>

 <div className="mt-10 border-t border-border-subtle pt-6">
 <Heading level={2} size="eyebrow">
 What we look for
 </Heading>
 <Text size="sm" tone="secondary" measure className="mt-2">
 Automatic renewal, forced arbitration, one-sided amendment rights, termination
 penalties, liability caps, indemnities, late fees, data sharing, non-competes and
 governing law — up to {INPUT_LIMITS.maxDocumentChars.toLocaleString()} characters per
 document.
 </Text>
 </div>
 </Section>
 </Container>
 );
}
