import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { allToolsList, TOOLS_REGISTRY } from '@/data/tools';
import { appConfig } from '@/config';

export async function generateStaticParams() {
  return allToolsList.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS_REGISTRY[slug];

  if (!tool) {
    return {};
  }

  return {
    title: { absolute: tool.title },
    description: tool.description,
    alternates: { canonical: `${appConfig.url}/tools/${tool.slug}` },
    openGraph: {
      type: 'website',
      title: tool.title,
      description: tool.description,
      url: `${appConfig.url}/tools/${tool.slug}`,
    },
  };
}

export default async function ToolLandingPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const tool = TOOLS_REGISTRY[slug];

  if (!tool) {
    notFound();
  }

  // Generate FAQ schema dynamically
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((faq) => ({
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
      {/* Dynamic FAQ Schema for zero-click snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <h1 className="mb-6 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl">
          {tool.heading}
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-text-secondary md:text-2xl">
          {tool.subheading}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-brand-primary px-8 py-4 font-medium text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
          >
            Start Analyzing for Free
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-elevated border-y border-border-subtle py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">Why use our {tool.heading}?</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {tool.features.map((feature, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border-subtle bg-canvas p-8 transition-colors hover:border-brand-primary/50"
              >
                <h3 className="mb-4 text-xl font-semibold text-brand-primary">{feature.title}</h3>
                <p className="leading-relaxed text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {tool.faqs.map((faq, idx) => (
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
