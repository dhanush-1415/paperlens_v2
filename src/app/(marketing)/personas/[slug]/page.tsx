import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { allPersonasList, PERSONAS_REGISTRY } from '@/data/personas';
import { appConfig } from '@/config';

export async function generateStaticParams() {
  return allPersonasList.map((persona) => ({ slug: persona.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const persona = PERSONAS_REGISTRY[slug];

  if (!persona) {
    return {};
  }

  return {
    title: { absolute: persona.title },
    description: persona.description,
    alternates: { canonical: `${appConfig.url}/personas/${persona.slug}` },
    openGraph: {
      type: 'website',
      title: persona.title,
      description: persona.description,
      url: `${appConfig.url}/personas/${persona.slug}`,
    },
  };
}

export default async function PersonaLandingPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const persona = PERSONAS_REGISTRY[slug];

  if (!persona) {
    notFound();
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: persona.faqs.map((faq) => ({
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
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-brand-primary md:text-6xl">
          {persona.heading}
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-text-secondary md:text-2xl">
          {persona.subheading}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-brand-primary px-8 py-4 font-medium text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      <section className="bg-surface-elevated border-y border-border-subtle py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Helps You</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {persona.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border-subtle bg-canvas p-8 transition-colors hover:border-brand-primary/50"
              >
                <h3 className="mb-4 text-xl font-semibold text-brand-primary">{benefit.title}</h3>
                <p className="leading-relaxed text-text-secondary">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {persona.faqs.map((faq, idx) => (
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
