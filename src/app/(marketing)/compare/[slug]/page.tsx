import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { allComparisonsList, COMPARISONS_REGISTRY } from '@/data/comparisons';
import { appConfig } from '@/config';

export async function generateStaticParams() {
  return allComparisonsList.map((comp) => ({ slug: comp.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = COMPARISONS_REGISTRY[slug];

  if (!comparison) {
    return {};
  }

  return {
    title: { absolute: comparison.title },
    description: comparison.description,
    alternates: { canonical: `${appConfig.url}/compare/${comparison.slug}` },
    openGraph: {
      type: 'website',
      title: comparison.title,
      description: comparison.description,
      url: `${appConfig.url}/compare/${comparison.slug}`,
    },
  };
}

export default async function ComparisonLandingPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const comparison = COMPARISONS_REGISTRY[slug];

  if (!comparison) {
    notFound();
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: comparison.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="w-full flex-1 bg-canvas text-text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <h1 className="mb-6 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl">
          {comparison.heading}
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-text-secondary md:text-2xl">
          {comparison.subheading}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-brand-primary px-8 py-4 font-medium text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
          >
            Switch to PaperLens Today
          </Link>
        </div>
      </section>

      <section className="bg-surface-elevated border-y border-border-subtle py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-6 py-4 font-semibold">Feature</th>
                  <th className="px-6 py-4 font-semibold text-brand-primary">PaperLens</th>
                  <th className="px-6 py-4 font-semibold text-text-secondary">
                    {comparison.competitorName}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.points.map((point, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-surface-elevated/50 border-b border-border-subtle transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{point.feature}</td>
                    <td className="px-6 py-4 text-brand-primary">{point.paperlens}</td>
                    <td className="px-6 py-4 text-text-secondary">{point.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {comparison.faqs.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-border-subtle p-6">
              <h3 className="mb-3 text-lg font-medium">{faq.question}</h3>
              <p className="text-text-secondary">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
