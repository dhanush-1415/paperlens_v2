import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { appConfig } from '@/config';

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const { token } = await params;

  // In a real implementation, you would fetch the document summary by token here.
  // We mock the SEO metadata for the product-led growth loop.
  const title = `Document Analysis Summary - PaperLens`;
  const description = `Read the AI-generated summary and extracted insights for this document, powered by PaperLens.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${appConfig.url}/share/${token}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${appConfig.url}/share/${token}`,
    },
    // Ensure Google indexes this page for the backlink loop
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SharedDocumentPage({ params }: { params: { token: string } }) {
  const { token } = await params;

  // Placeholder for actual document fetch
  if (!token) {
    notFound();
  }

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col bg-canvas text-text-primary">
      <div className="mx-auto w-full max-w-4xl flex-1 p-8">
        <header className="mb-12 border-b border-border-subtle pb-8">
          <h1 className="mb-2 text-3xl font-bold text-brand-primary">Document Summary</h1>
          <p className="text-text-secondary">Shared securely via PaperLens</p>
        </header>

        <article className="prose prose-lg dark:prose-invert mb-24 max-w-none">
          <p>
            This is a publicly shared document summary. The original user has securely extracted
            insights from their PDF using PaperLens AI.
          </p>
          {/* Document Content would go here */}
          <div className="bg-surface-elevated flex h-64 items-center justify-center rounded-xl border border-border-subtle text-text-tertiary">
            [Document Content Placeholder]
          </div>
        </article>
      </div>

      {/* 
        CRITICAL SEO COMPONENT: The Product-Led Backlink 
        This footer ensures that every shared document acts as a high-authority backlink 
        pointing directly back to the main PaperLens domain.
      */}
      <footer className="bg-surface-elevated mt-auto w-full border-t border-border-subtle py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-8 md:flex-row">
          <p className="text-text-secondary">
            Analyzed in seconds by{' '}
            <span className="font-semibold text-text-primary">PaperLens AI</span>
          </p>
          <Link
            href="https://paperlens.co"
            className="rounded-lg bg-brand-primary px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-brand-primary/90"
          >
            Analyze Your Own Document
          </Link>
        </div>
      </footer>
    </main>
  );
}
