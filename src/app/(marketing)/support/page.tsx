import type { Metadata } from 'next';
import Link from 'next/link';

import {
  LandingClosingCta,
  MarketingPageIntro,
} from '@/features/marketing';
import { ROUTES } from '@/shared/constants';
import { ScrollReveal } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Contact & Support',
  description: 'Need help with PaperLens? Get in touch with our engineering team, browse our FAQs, or report an issue.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/support' },
};

const SUPPORT_CHANNELS = [
  {
    title: 'General Support',
    body: 'Need help with your account, billing, or general questions? Our support team is here to help you get the most out of PaperLens.',
    email: 'support@paperlens.co',
    actionLabel: 'Email Support',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Report an Issue',
    body: 'Encountered a bug or technical problem? Describe what happened and our engineering team will investigate immediately.',
    email: 'engineering@paperlens.co',
    actionLabel: 'Report a Bug',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    isRisk: true,
  },
  {
    title: 'Feature Requests',
    body: 'Feature requests, workflow improvements, or general thoughts — we read and discuss every single submission to shape our roadmap.',
    email: 'hello@paperlens.co',
    actionLabel: 'Share Ideas',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function SupportPage() {
  return (
    <>
      <MarketingPageIntro
        eyebrow="Contact & Support"
        heading="How can we help?"
        lede="Report an issue, ask a technical question, or get in touch with our team directly. We are here to help."
      />

      <section className="w-full py-24 relative overflow-hidden bg-canvas">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.05),transparent_80%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-[95%] md:w-[90%] lg:w-[80%] max-w-6xl mx-auto relative z-10 flex flex-col gap-24">
          
          <ScrollReveal variant="stagger-children" className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SUPPORT_CHANNELS.map((channel) => (
              <div 
                key={channel.title}
                className="reveal-item group flex flex-col gap-6 p-8 md:p-10 rounded-[2rem] bg-surface-1/40 backdrop-blur-xl border border-border-strong/50 shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-brand-primary/30 hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${channel.isRisk ? 'bg-risk-critical/10 text-risk-critical border border-risk-critical/20 group-hover:bg-risk-critical group-hover:text-white group-hover:shadow-[0_0_15px_rgba(var(--risk-critical-rgb),0.4)] transition-all duration-500' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 group-hover:bg-brand-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.4)] transition-all duration-500'}`}>
                  {channel.icon}
                </div>

                <div className="flex flex-col gap-3 z-10 flex-1">
                  <h3 className="text-xl font-bold text-text-primary">
                    {channel.title}
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                    {channel.body}
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-brand-primary-hover transition-colors z-10 w-fit mt-2 group-hover:underline"
                >
                  {channel.actionLabel}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </ScrollReveal>

          <ScrollReveal variant="fade-up" className="grid gap-12 lg:grid-cols-[1fr_400px] items-start bg-surface-2/30 border border-border-strong/50 rounded-[2.5rem] p-8 md:p-16 backdrop-blur-md relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col gap-8 relative z-10">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">Direct Contact</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary">Need more help?</h2>
                <p className="text-base text-text-secondary leading-relaxed max-w-xl">
                  Can't find the answer you're looking for? Reach out to our technical support team or send us product feedback.
                </p>
              </div>

              <div className="flex flex-col gap-6 max-w-md">
                <Link href="/contact" className="flex items-center gap-4 p-5 rounded-2xl bg-surface-1 border border-border-strong/50 hover:border-brand-primary/30 transition-all group shadow-sm hover:shadow-md">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-canvas transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">Contact Support</span>
                    <span className="text-sm text-text-secondary group-hover:text-brand-primary transition-colors">Submit a ticket or feedback →</span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-8 relative z-10 p-8 rounded-[2rem] bg-canvas border border-border-strong/50 shadow-sm">
              <h3 className="text-xl font-bold text-text-primary border-b border-border-strong/30 pb-4">Service Levels</h3>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-text-primary">Response Time</span>
                  <span className="text-sm text-text-secondary">We aim to respond to all inquiries within 24 hours during business days.</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-text-primary">Business Hours</span>
                  <span className="text-sm text-text-secondary">Monday – Friday<br/>9:00 AM – 6:00 PM (EST)</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-text-primary">Self Service</span>
                  <span className="text-sm text-text-secondary">
                    Browse our <Link href="/faq" className="text-brand-primary hover:underline font-bold">FAQ</Link> for immediate answers.
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      <LandingClosingCta
        ctaLabel="Analyze a document"
        reassurance="No card required · Deleted after analysis · Never used for training"
      />
    </>
  );
}
