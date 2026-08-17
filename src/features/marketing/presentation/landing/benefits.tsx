'use client';

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { Container, Heading, Section, Text, ScrollReveal } from '@/shared/ui';

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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
            className="stroke-brand-secondary"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 3v1m0 4v1m-2.5-2.5h1m4 0h1"
            className="stroke-brand-secondary"
          />
        </svg>
      ),
      title: 'Stop Losing Money',
      headline: 'Catch auto-renewals before they trigger.',
      description:
        'Our proprietary engine scans the fine print to uncover hidden fees, automatic renewals, and penalty clauses that drain your budget.',
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 11h3m-3 3h2"
            className="stroke-brand-secondary"
          />
          <circle cx="8" cy="13" r="1.5" className="fill-brand-secondary stroke-none" />
        </svg>
      ),
      title: 'Instant ROI',
      headline: 'Hours of reading done in 0.8 seconds.',
      description:
        'Why pay lawyers thousands to read routine contracts? Drop a file in, and get a plain English risk assessment instantly.',
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"
          />
          <circle
            cx="18"
            cy="6"
            r="3"
            className="fill-canvas stroke-brand-secondary"
            strokeWidth={1.5}
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 8l2 2"
            className="stroke-brand-secondary"
          />
        </svg>
      ),
      title: 'Ironclad Security',
      headline: 'Zero-knowledge pipeline.',
      description:
        'Bank-grade encryption by default. Your documents are automatically purged from our servers the moment your session ends.',
    },
  ];

  return (
    <Section spacing="lg" divider className="relative overflow-hidden bg-surface-1">
      {/* Ambient glowing orbs */}
      <div className="pointer-events-none absolute top-0 left-[-10%] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(var(--brand-primary-rgb),0.05)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[600px] w-[600px] bg-[radial-gradient(circle,rgba(var(--brand-secondary-rgb),0.05)_0%,transparent_60%)]" />

      <Container width="shell" className="relative z-10 py-8">
        <ScrollReveal
          variant="fade-up"
          className="mx-auto mb-20 flex max-w-3xl flex-col gap-4 text-center"
        >
          <Heading
            level={2}
            size="eyebrow"
            className="font-extrabold tracking-widest text-brand-solid uppercase dark:text-brand-primary"
          >
            Built for peace of mind
          </Heading>
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary md:text-5xl">
            Don't sign another{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              contract blind
            </span>
          </h2>
          <Text size="lg" tone="secondary" className="mx-auto max-w-2xl leading-relaxed">
            Our intelligent pipeline extracts the hidden traps in complex legal and financial
            documents so you can negotiate with absolute confidence.
          </Text>
        </ScrollReveal>

        <ScrollReveal
          variant="stagger-children"
          className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-3"
        >
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="reveal-item group relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-border-strong/50 bg-canvas p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/30 hover:bg-surface-1 hover:shadow-[0_20px_40px_-15px_rgba(var(--brand-primary-rgb),0.2)]"
            >
              <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-bl-[100px] bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-2 text-text-secondary shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:border-brand-primary/20 group-hover:bg-brand-primary/5 group-hover:text-brand-solid dark:group-hover:text-brand-primary">
                {benefit.icon}
              </div>

              <div className="relative z-10 mt-2 flex flex-col gap-3">
                <span className="text-xs font-black tracking-widest text-brand-solid uppercase dark:text-brand-primary">
                  {benefit.title}
                </span>
                <Heading
                  level={3}
                  size="sm"
                  className="font-bold text-text-primary transition-colors group-hover:text-text-primary"
                >
                  {benefit.headline}
                </Heading>
              </div>

              <Text size="sm" tone="secondary" className="relative z-10 leading-relaxed">
                {benefit.description}
              </Text>
            </div>
          ))}
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.3} className="relative z-10 flex justify-center">
          <Link
            href={ROUTES.scan}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-border-strong bg-surface-overlay/80 px-8 py-4 text-sm font-bold text-text-primary backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-primary hover:bg-surface-1 hover:shadow-2xl hover:shadow-brand-primary/20"
          >
            {/* Subtle glow inside the button */}
            <div className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-brand-primary/0 via-brand-primary/10 to-brand-primary/0 transition-transform duration-1000 group-hover:translate-x-[100%]" />
            <svg
              className="size-5 text-brand-solid dark:text-brand-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload a document to see for yourself
            <svg
              className="size-4.5 text-text-tertiary transition-colors duration-300 group-hover:text-brand-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
