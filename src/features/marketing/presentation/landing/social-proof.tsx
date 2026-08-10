'use client';

import { useState } from 'react';
import { Container, Heading, Section, Text } from '@/shared/ui';
import DemoRequestModal from '@/shared/ui/DemoRequestModal';

export function LandingSocialProofAndCta() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const logos = [
    {
      name: 'Apex Legal',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
    {
      name: 'Aetrium Financial',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Stellar Care',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      name: 'AuraHR',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Cosvix Clinic',
      icon: (
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Social Proof (Logo Wall) */}
      <Section spacing="sm" divider>
        <Container width="shell" className="py-8 text-center">
          <Heading level={2} size="eyebrow" className="text-text-tertiary tracking-widest uppercase">
            Trusted by Leaders in Finance, Legal, and Healthcare
          </Heading>
          
          <div className="mt-8 flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
            {logos.map((logo) => (
              <div key={logo.name} className="flex items-center gap-2.5 text-text-primary text-sm font-extrabold select-none">
                {logo.icon}
                <span>{logo.name}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Final Closing CTA */}
      <Section spacing="lg" className="bg-gradient-to-b from-canvas via-surface-1/40 to-canvas">
        <Container width="content" className="py-16 text-center flex flex-col items-center gap-8">
          <Heading level={2} size="lg" className="text-text-primary">
            Ready to automate your document workflows?
          </Heading>
          
          <Text size="md" tone="secondary" className="max-w-md leading-relaxed">
            Join enterprise teams processing contracts, tax notices, and regulatory papers with human-level accuracy.
          </Text>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-brand-solid hover:bg-brand-solid-hover px-10 py-5.5 text-base font-bold text-text-on-brand transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-brand-primary/20 cursor-pointer"
          >
            Sign Up for a Free Demo
            <svg className="size-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </Container>
      </Section>

      {/* Request Demo Modal */}
      <DemoRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
