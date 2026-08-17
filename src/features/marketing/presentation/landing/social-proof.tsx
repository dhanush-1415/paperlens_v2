'use client';

import { useState } from 'react';
import { Container, Heading, Section, Text, Button, ScrollReveal } from '@/shared/ui';
import DemoRequestModal from '@/shared/ui/DemoRequestModal';

export function LandingSocialProofAndCta() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const logos = [
    {
      name: 'Apex Legal',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          />
        </svg>
      ),
    },
    {
      name: 'Aetrium Financial',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: 'Stellar Care',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
    },
    {
      name: 'AuraHR',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      name: 'Cosvix Clinic',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Social Proof (Logo Wall) */}
      <Section spacing="sm" className="border-b border-border-subtle/50 bg-canvas">
        <Container width="shell" className="relative overflow-hidden text-center">
          <ScrollReveal variant="fade-up">
            <Heading
              level={2}
              size="eyebrow"
              className="relative z-10 tracking-widest text-text-tertiary uppercase"
            >
              Trusted by Leaders in Finance, Legal, and Healthcare
            </Heading>

            <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0 md:gap-20">
              {logos.map((logo) => (
                <div
                  key={logo.name}
                  className="flex items-center gap-3 text-base font-extrabold text-text-primary transition-transform duration-300 select-none hover:scale-105 md:text-lg"
                >
                  <div className="text-brand-primary">{logo.icon}</div>
                  <span className="tracking-tight">{logo.name}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Final Closing CTA */}
      <div className="force-dark w-full">
        <Section
          spacing="lg"
          className="relative overflow-hidden border-b border-border-strong/30 bg-canvas"
        >
          <Container
            width="content"
            className="relative z-10 flex flex-col items-center gap-8 text-center"
          >
            <ScrollReveal
              variant="fade-up"
              className="relative flex max-w-3xl flex-col items-center gap-4"
            >
              <div className="mb-2 inline-flex items-center justify-center rounded-full border border-border-strong bg-surface-1 px-5 py-1.5 shadow-sm backdrop-blur-md">
                <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
                  Get Started Today
                </span>
              </div>

              <Heading
                level={2}
                size="display-md"
                className="font-extrabold tracking-tight text-text-primary drop-shadow-sm"
              >
                Ready to automate your{' '}
                <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  document workflows?
                </span>
              </Heading>
              <Text size="lg" tone="secondary" className="leading-relaxed">
                Join enterprise teams processing contracts, tax notices, and regulatory papers with
                human-level accuracy.{' '}
                <strong className="text-text-primary">No credit card required.</strong>
              </Text>
            </ScrollReveal>

            <ScrollReveal
              variant="fade-up"
              delay={0.2}
              className="mt-4 flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-border-strong bg-surface-1 p-8 shadow-card"
            >
              <Button
                variant="premium"
                onClick={() => setIsModalOpen(true)}
                className="group h-16 w-full cursor-pointer overflow-hidden border border-brand-primary/20 px-12 text-lg font-bold shadow-xl shadow-brand-primary/40 hover:border-brand-primary/50"
              >
                Sign Up for a Free Demo
                <svg
                  className="size-5 transition-transform duration-300 group-hover:translate-x-1.5"
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
              </Button>
              <div className="flex items-center gap-3 text-xs font-semibold tracking-wider text-text-tertiary uppercase">
                <svg
                  className="size-4 text-risk-safe"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Setup takes less than 2 minutes
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </div>

      {/* Request Demo Modal */}
      <DemoRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
