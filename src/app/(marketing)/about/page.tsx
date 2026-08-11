import type { Metadata } from 'next';

import {
  LandingClosingCta,
  MarketingPageIntro,
} from '@/features/marketing';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'PaperLens was founded with a single belief: individuals and developers should not need a law degree or accounting background to understand their daily documents.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/about' },
};

/* --- Core Principles ------------------------------------------------------- */

const PRINCIPLES = [
  {
    title: 'Built for Everyday Consumers',
    body: 'Legal agreements, lease renewals, and medical EOB details are filled with confusing boilerplate text designed to obfuscate important items. We decode these paragraphs into structured, action-oriented summaries.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Open API & Extensible Distribution',
    body: 'PaperLens V2 is built to fit where you work. With our REST API endpoints on RapidAPI, a Chrome Extension for Gmail and DocuSign attachments, and a streaming SSE web app, analysis is never out of reach.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: 'Absolute Security Covenant',
    body: 'Security is not an afterthought; it is our fundamental core rule. Our Zero Data Retention (ZDR) architecture ensures that your private documents never touch physical hard drives and are never processed for LLM training.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    isSuccess: true,
  },
];

export default function AboutPage() {
  return (
    <>
      <MarketingPageIntro
        eyebrow="Our Mission"
        heading="Deciphering complexity, together."
        lede="PaperLens was founded with a single belief: individuals and developers should not need a law degree or accounting background to understand their daily documents."
      />

      <section className="w-full py-24 relative overflow-hidden bg-canvas">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-[95%] md:w-[90%] lg:w-[70%] max-w-4xl mx-auto relative z-10 flex flex-col gap-8">
          {PRINCIPLES.map((principle) => (
            <div 
              key={principle.title}
              className="group flex flex-col sm:flex-row items-start gap-6 p-8 rounded-3xl bg-surface-1 border border-border-strong shadow-card transition-all duration-500 hover:shadow-2xl hover:border-brand-primary/40 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${principle.isSuccess ? 'bg-risk-safe/10 text-risk-safe border border-risk-safe/20' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'}`}>
                {principle.icon}
              </div>

              <div className="flex flex-col gap-3 z-10">
                <h3 className="text-xl font-bold text-text-primary">
                  {principle.title}
                </h3>
                <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                  {principle.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LandingClosingCta
        ctaLabel="Analyze a document"
        reassurance="No card required · Deleted after analysis · Never used for training"
      />
    </>
  );
}
