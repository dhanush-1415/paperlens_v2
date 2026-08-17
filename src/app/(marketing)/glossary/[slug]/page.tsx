import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { allGlossaryTermsList, GLOSSARY_REGISTRY } from '@/data/glossary';
import { appConfig } from '@/config';

export async function generateStaticParams() {
  return allGlossaryTermsList.map((term) => ({ slug: term.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = GLOSSARY_REGISTRY[slug];

  if (!entry) {
    return {};
  }

  const title = `What is ${entry.term}? Definition & Analysis - PaperLens`;
  const description = `${entry.shortDefinition} Learn how to identify and analyze ${entry.term} in your documents using AI.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${appConfig.url}/glossary/${entry.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${appConfig.url}/glossary/${entry.slug}`,
    },
  };
}

export default async function GlossaryTermPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const entry = GLOSSARY_REGISTRY[slug];

  if (!entry) {
    notFound();
  }

  // Dictionary/Definition Schema for Rich Snippets
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.term,
    description: entry.shortDefinition,
    inDefinedTermSet: `${appConfig.url}/glossary`,
  };

  return (
    <main className="w-full flex-1 bg-canvas py-24 text-text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
      />

      <article className="mx-auto max-w-3xl px-6">
        <header className="mb-12">
          <div className="bg-surface-elevated mb-6 inline-block rounded-full border border-border-subtle px-3 py-1 text-xs font-medium tracking-wider text-text-secondary uppercase">
            {entry.category} Glossary
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-brand-primary md:text-5xl">
            What is {entry.term}?
          </h1>
          <p className="border-l-4 border-brand-primary py-2 pl-6 text-xl text-text-secondary">
            {entry.shortDefinition}
          </p>
        </header>

        <section className="prose prose-lg dark:prose-invert mb-16 max-w-none">
          <h2 className="mb-6 text-2xl font-bold text-text-primary">Detailed Explanation</h2>
          <p className="leading-relaxed text-text-secondary">{entry.detailedExplanation}</p>
        </section>

        <section className="bg-surface-elevated rounded-2xl border border-brand-primary/20 p-8">
          <h3 className="mb-4 text-xl font-bold text-brand-primary">
            How PaperLens AI solves this:
          </h3>
          <p className="mb-8 text-text-secondary">{entry.howPaperLensHelps}</p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-brand-primary px-6 py-3 font-medium text-white transition-all hover:bg-brand-primary/90"
          >
            Analyze {entry.term}s with AI
          </Link>
        </section>
      </article>
    </main>
  );
}
