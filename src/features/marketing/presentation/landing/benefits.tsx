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
    <Section spacing="lg" divider className="relative overflow-hidden bg-surface-1">
      {/* Ambient glowing orbs */}
      <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(var(--brand-primary-rgb),0.05)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(var(--brand-secondary-rgb),0.05)_0%,transparent_60%)] pointer-events-none" />

      <Container width="shell" className="py-8 relative z-10">
        <ScrollReveal variant="fade-up" className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-20">
          <Heading level={2} size="eyebrow" className="text-brand-solid dark:text-brand-primary uppercase tracking-widest font-extrabold">
            Built for peace of mind
          </Heading>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary">
            Don't sign another <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">contract blind</span>
          </h2>
          <Text size="lg" tone="secondary" className="leading-relaxed max-w-2xl mx-auto">
            Our intelligent pipeline extracts the hidden traps in complex legal and financial documents so you can negotiate with absolute confidence.
          </Text>
        </ScrollReveal>

        <ScrollReveal variant="stagger-children" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="reveal-item group relative flex flex-col gap-6 p-8 rounded-3xl border border-border-strong/50 bg-canvas shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-surface-1 hover:border-brand-primary/30 hover:shadow-[0_20px_40px_-15px_rgba(var(--brand-primary-rgb),0.2)] hover:-translate-y-1 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="size-14 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center text-text-secondary group-hover:text-brand-solid dark:group-hover:text-brand-primary group-hover:border-brand-primary/20 group-hover:bg-brand-primary/5 group-hover:scale-110 transition-all duration-500 relative z-10 shadow-sm">
                {benefit.icon}
              </div>

              <div className="flex flex-col gap-3 relative z-10 mt-2">
                <span className="text-xs font-black text-brand-solid dark:text-brand-primary uppercase tracking-widest">
                  {benefit.title}
                </span>
                <Heading level={3} size="sm" className="text-text-primary font-bold group-hover:text-text-primary transition-colors">
                  {benefit.headline}
                </Heading>
              </div>

              <Text size="sm" tone="secondary" className="leading-relaxed relative z-10">
                {benefit.description}
              </Text>
            </div>
          ))}
        </ScrollReveal>
        
        <ScrollReveal variant="fade-up" delay={0.3} className="flex justify-center relative z-10">
          <Link
            href={ROUTES.scan}
            className="group relative inline-flex items-center gap-3 rounded-full bg-surface-overlay/80 backdrop-blur-xl border border-border-strong px-8 py-4 text-sm font-bold text-text-primary transition-all duration-300 hover:border-brand-primary hover:bg-surface-1 hover:shadow-2xl hover:shadow-brand-primary/20 hover:-translate-y-0.5 overflow-hidden"
          >
            {/* Subtle glow inside the button */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/10 to-brand-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
            
            <svg className="size-5 text-brand-solid dark:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload a document to see for yourself
            <svg className="size-4.5 text-text-tertiary group-hover:text-brand-primary transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
