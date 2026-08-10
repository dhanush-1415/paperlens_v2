'use client';

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { Container, Heading, Section, Text } from '@/shared/ui';

interface BenefitItem {
  icon: React.ReactNode;
  title: string;
  headline: string;
  description: string;
}

export function LandingBenefits() {
  const benefits: BenefitItem[] = [
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" className="stroke-brand-secondary" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 4v1m-2.5-2.5h1m4 0h1" className="stroke-brand-secondary" />
        </svg>
      ),
      title: 'Stop Losing Money',
      headline: 'Catch auto-renewals before they trigger.',
      description: 'Our proprietary engine scans the fine print to uncover hidden fees, automatic renewals, and penalty clauses that drain your budget.',
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11h3m-3 3h2" className="stroke-brand-secondary" />
          <circle cx="8" cy="13" r="1.5" className="fill-brand-secondary stroke-none" />
        </svg>
      ),
      title: 'Instant ROI',
      headline: 'Hours of reading done in 0.8 seconds.',
      description: 'Why pay lawyers thousands to read routine contracts? Drop a file in, and get a plain English risk assessment instantly.',
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
          <circle cx="18" cy="6" r="3" className="stroke-brand-secondary fill-canvas" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 8l2 2" className="stroke-brand-secondary" />
        </svg>
      ),
      title: 'Ironclad Security',
      headline: 'Zero-knowledge pipeline.',
      description: 'Bank-grade encryption by default. Your documents are automatically purged from our servers the moment your session ends.',
    },
  ];

  return (
    <Section spacing="lg" divider surface="raised">
      <Container width="shell" className="py-8">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-3 mb-16">
          <Heading level={2} size="eyebrow" className="text-brand-solid dark:text-brand-primary">
            Built for peace of mind
          </Heading>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Don't sign another contract blind.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group relative flex flex-col gap-5 p-8 rounded-2xl border border-border-subtle bg-surface-1/30 hover:bg-surface-2/40 hover:border-brand-primary/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="size-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-solid dark:text-brand-primary group-hover:scale-110 transition-transform duration-300">
                {benefit.icon}
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-2xs font-bold text-brand-solid dark:text-brand-primary uppercase tracking-wider">
                  {benefit.title}
                </span>
                <Heading level={3} size="sm" className="text-text-primary group-hover:text-brand-solid dark:group-hover:text-brand-primary transition-colors">
                  {benefit.headline}
                </Heading>
              </div>

              <Text size="sm" tone="secondary" className="leading-relaxed">
                {benefit.description}
              </Text>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Link
            href={ROUTES.scan}
            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white px-8 py-4 text-sm font-bold text-brand-primary transition-all shadow-lg hover:shadow-brand-primary/30"
          >
            Upload a document to see for yourself
            <svg className="size-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
