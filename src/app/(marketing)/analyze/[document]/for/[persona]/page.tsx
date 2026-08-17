import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { PERSONAS_REGISTRY } from '@/data/personas';
import { DOCUMENT_GUIDES } from '@/features/marketing/infrastructure/guides.data';
import { appConfig } from '@/config';

export async function generateStaticParams() {
  const params: { document: string; persona: string }[] = [];

  // Create the cross-multiplied matrix
  for (const guide of DOCUMENT_GUIDES) {
    for (const personaSlug of Object.keys(PERSONAS_REGISTRY)) {
      params.push({
        document: guide.slug,
        persona: personaSlug,
      });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { document: string; persona: string };
}): Promise<Metadata> {
  const { document, persona } = await params;

  const personaData = PERSONAS_REGISTRY[persona];
  const documentData = DOCUMENT_GUIDES.find((g) => g.slug === document);

  if (!personaData || !documentData) {
    return {};
  }

  const title = `Analyze ${documentData.heading} for ${personaData.heading.replace('PaperLens for ', '')} - PaperLens`;
  const description = `The ultimate AI tool for ${personaData.heading.replace('PaperLens for ', '')} to review, analyze, and extract insights from ${documentData.heading}s.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${appConfig.url}/analyze/${document}/${persona}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${appConfig.url}/analyze/${document}/${persona}`,
    },
  };
}

export default async function MatrixLandingPage({
  params,
}: {
  params: { document: string; persona: string };
}) {
  const { document, persona } = await params;

  const personaData = PERSONAS_REGISTRY[persona];
  const documentData = DOCUMENT_GUIDES.find((g) => g.slug === document);

  if (!personaData || !documentData) {
    notFound();
  }

  const personaAudience = personaData.heading.replace('PaperLens for ', '');

  return (
    <main className="w-full flex-1 bg-canvas text-text-primary">
      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <div className="mb-6 inline-block rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-sm font-medium text-brand-primary">
          Tailored for {personaAudience}
        </div>
        <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight md:text-6xl">
          Analyze{' '}
          <span className="bg-gradient-to-r from-brand-primary to-text-primary bg-clip-text text-transparent">
            {documentData.heading}s
          </span>{' '}
          Instantly
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-text-secondary md:text-2xl">
          Stop manually reading {documentData.heading}s. Our AI is specifically designed to help{' '}
          {personaAudience.toLowerCase()} extract exactly what they need in seconds.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-brand-primary px-8 py-4 font-medium text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
          >
            Start Analyzing Free
          </Link>
        </div>
      </section>

      {/* Cross-pollinated Features Section */}
      <section className="bg-surface-elevated border-y border-border-subtle py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold">
                Why {personaAudience} use PaperLens for this:
              </h2>
              <ul className="space-y-6">
                {documentData.typicalRisks.slice(0, 3).map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-semibold text-text-primary">
                        Avoid this risk:
                      </h4>
                      <p className="leading-relaxed text-text-secondary">{risk}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-canvas p-8 shadow-sm">
              <h3 className="mb-6 text-2xl font-bold text-brand-primary">
                How our AI solves this for you:
              </h3>
              <ul className="space-y-6">
                {personaData.benefits.map((benefit, idx) => (
                  <li
                    key={idx}
                    className="border-b border-border-subtle pb-4 last:border-0 last:pb-0"
                  >
                    <h4 className="mb-2 text-lg font-semibold">{benefit.title}</h4>
                    <p className="text-text-secondary">{benefit.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Action Checklist */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="mb-8 text-3xl font-bold">Ready to review your {documentData.heading}?</h2>
        <div className="mx-auto mb-12 grid max-w-2xl gap-4 text-left">
          {documentData.checklist.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-elevated flex items-center gap-3 rounded-lg border border-border-subtle p-4"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-text-secondary">{item}</p>
            </div>
          ))}
        </div>
        <Link
          href="/signup"
          className="inline-block rounded-xl bg-text-primary px-8 py-4 font-medium text-canvas transition-all hover:bg-text-secondary"
        >
          Automate This Checklist with AI
        </Link>
      </section>
    </main>
  );
}
