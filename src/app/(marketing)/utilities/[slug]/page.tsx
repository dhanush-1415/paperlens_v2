import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { allUtilitiesList, UTILITIES_REGISTRY } from '@/data/utilities';
import { appConfig } from '@/config';

export async function generateStaticParams() {
  return allUtilitiesList.map((util) => ({ slug: util.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const utility = UTILITIES_REGISTRY[slug];

  if (!utility) {
    return {};
  }

  return {
    title: { absolute: utility.title },
    description: utility.description,
    alternates: { canonical: `${appConfig.url}/utilities/${utility.slug}` },
    openGraph: {
      type: 'website',
      title: utility.title,
      description: utility.description,
      url: `${appConfig.url}/utilities/${utility.slug}`,
    },
  };
}

export default async function UtilityLandingPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const utility = UTILITIES_REGISTRY[slug];

  if (!utility) {
    notFound();
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: utility.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to ${utility.focusKeywords[0]}`,
    description: utility.description,
    step: utility.steps.map((step, idx) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
      url: `${appConfig.url}/utilities/${utility.slug}#step-${idx + 1}`,
    })),
  };

  return (
    <main className="w-full flex-1 bg-canvas text-text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* Hero & Utility Placeholder */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <h1 className="mb-6 bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl">
          {utility.heading}
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-text-secondary md:text-2xl">
          {utility.subheading}
        </p>

        {/* The "Fake" Client-Side Tool Interface placeholder */}
        <div className="bg-surface-elevated group mx-auto mb-10 flex h-64 w-full max-w-3xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-strong transition-colors hover:border-brand-primary">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 transition-transform group-hover:scale-110">
            <svg
              className="h-8 w-8 text-brand-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">Select PDF files</p>
          <p className="mt-2 text-sm text-text-tertiary">or drop PDFs here</p>
        </div>

        {/* The Upsell CTA */}
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-between gap-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-6 md:flex-row">
          <div className="text-left">
            <h3 className="font-semibold text-brand-primary">
              Done formatting? Let AI read it for you.
            </h3>
            <p className="text-sm text-text-secondary">
              Instantly extract insights and summaries from your PDF.
            </p>
          </div>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-primary px-6 py-2 font-medium whitespace-nowrap text-white hover:bg-brand-primary/90"
          >
            Try PaperLens AI
          </Link>
        </div>
      </section>

      {/* How-To Steps Section */}
      <section className="bg-surface-elevated border-y border-border-subtle py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How to {utility.focusKeywords[0]}
          </h2>
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border-strong before:to-transparent md:before:mx-auto md:before:translate-x-0">
            {utility.steps.map((step, idx) => (
              <div
                key={idx}
                id={`step-${idx + 1}`}
                className="group is-active relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-canvas bg-brand-primary font-bold text-white shadow md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {idx + 1}
                </div>
                <div className="w-[calc(100%-4rem)] rounded-2xl border border-border-subtle bg-canvas p-6 shadow-sm md:w-[calc(50%-2.5rem)]">
                  <h3 className="mb-2 text-lg font-bold text-brand-primary">{step.name}</h3>
                  <p className="text-text-secondary">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {utility.faqs.map((faq, idx) => (
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
