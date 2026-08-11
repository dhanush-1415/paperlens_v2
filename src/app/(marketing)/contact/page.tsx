'use client';

import { useState } from 'react';
import Link from 'next/link';

import { LandingClosingCta, MarketingPageIntro } from '@/features/marketing';
import { ScrollReveal, Button } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';

const CONTACT_CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account', label: 'Account Problem' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-brand-primary', activeBg: 'bg-brand-primary/10 border-brand-primary/30' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500', activeBg: 'bg-amber-500/10 border-amber-500/30' },
  { value: 'high', label: 'High', color: 'text-orange-500', activeBg: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'critical', label: 'Critical', color: 'text-risk-critical', activeBg: 'bg-risk-critical/10 border-risk-critical/30' },
];

const FEATURE_AREAS = [
  { value: 'scanner', label: 'Upload & Scanner' },
  { value: 'vault', label: 'Document Vault' },
  { value: 'chat', label: 'AI Chat' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'pricing', label: 'Pricing & Plans' },
  { value: 'other', label: 'Other' },
];

const FEEDBACK_TYPES = [
  { value: 'feature_request', label: 'Feature Request', activeBg: 'bg-indigo-500/10 border-indigo-500/30', activeText: 'text-indigo-400' },
  { value: 'improvement', label: 'Improvement', activeBg: 'bg-amber-500/10 border-amber-500/30', activeText: 'text-amber-500' },
  { value: 'general', label: 'General', activeBg: 'bg-brand-primary/10 border-brand-primary/30', activeText: 'text-brand-primary' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const filled = hovered || value;
  const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="p-1 transition-transform duration-100 hover:scale-110 active:scale-95 outline-none cursor-pointer"
          >
            <svg
              className={cn(
                'h-11 w-11 transition-all duration-200',
                filled >= s ? 'fill-amber-500 text-amber-500' : 'text-text-tertiary/30 hover:text-amber-500/50'
              )}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>
      <span className={cn('text-sm font-bold transition-all duration-300', filled > 0 ? 'text-amber-500 opacity-100 translate-x-0' : 'opacity-0 -translate-x-2')}>
        {STAR_LABELS[filled]}
      </span>
    </div>
  );
}

export default function ContactPage() {
  const [tab, setTab] = useState<'contact' | 'feedback'>('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Contact State
  const [category, setCategory] = useState('bug');
  const [severity, setSeverity] = useState('medium');
  
  // Feedback State
  const [featureArea, setFeatureArea] = useState('scanner');
  const [feedbackType, setFeedbackType] = useState('improvement');
  const [rating, setRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-24 px-4 bg-canvas text-center">
        <ScrollReveal variant="fade-up" className="flex flex-col items-center max-w-md w-full gap-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-brand-primary/20 blur-[40px] scale-[1.5]" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-primary/10 border border-brand-primary/30 shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.3)] text-brand-primary">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">{tab === 'contact' ? 'Ticket Submitted' : 'Feedback Received'}</h1>
            <p className="text-text-secondary leading-relaxed">
              {tab === 'contact' 
                ? "We've received your report. Our engineering team will investigate and get back to you shortly." 
                : "Thank you! Your feedback genuinely helps us shape the future of PaperLens."}
            </p>
          </div>
          <Button variant="premium" onClick={() => setIsSubmitted(false)} className="mt-4 font-bold shadow-xl shadow-brand-primary/25">Submit Another</Button>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <>
      <MarketingPageIntro
        eyebrow="Get In Touch"
        heading="How can we help?"
        lede="We're here to help you get the most out of PaperLens. Whether you have a technical issue or just want to share some feedback, our team is ready to listen."
      />

      <section className="w-full pb-32 relative overflow-hidden bg-canvas">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--brand-primary-rgb),0.05),transparent_80%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-[95%] md:w-[90%] lg:w-[80%] max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-16 items-start mt-8">
          
          {/* Left Column: Direct Email */}
          <ScrollReveal variant="fade-up" className="w-full lg:w-[320px] shrink-0 flex flex-col gap-8 sticky top-32">
            <div className="bg-surface-1/60 backdrop-blur-xl border border-border-strong rounded-3xl p-8 shadow-sm flex flex-col gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex flex-col gap-2 relative z-10">
                <h3 className="text-lg font-bold text-text-primary">Direct Contact</h3>
                <p className="text-sm text-text-secondary leading-relaxed">Prefer to use your own email client? Reach out directly below.</p>
              </div>
              
              <div className="flex flex-col gap-6 relative z-10">
                <a href="mailto:support@paperlens.co" className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">General Support</span>
                    <span className="text-sm text-text-secondary">support@paperlens.co</span>
                  </div>
                </a>

                <a href="mailto:hello@paperlens.co" className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-text-primary group-hover:text-amber-500 transition-colors">Feedback & Ideas</span>
                    <span className="text-sm text-text-secondary">hello@paperlens.co</span>
                  </div>
                </a>

                <a href="mailto:legal@paperlens.co" className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-risk-critical/10 border border-risk-critical/20 flex items-center justify-center text-risk-critical shrink-0 group-hover:bg-risk-critical group-hover:text-white transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-text-primary group-hover:text-risk-critical transition-colors">Legal Inquiries</span>
                    <span className="text-sm text-text-secondary">legal@paperlens.co</span>
                  </div>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Form Content */}
          <ScrollReveal variant="fade-up" className="flex-1 w-full min-w-0">
            <div className="bg-surface-1/60 backdrop-blur-xl border border-border-strong rounded-[2.5rem] p-8 md:p-12 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/[0.03] to-transparent pointer-events-none" />
              
              <div className="flex bg-surface-2 p-1.5 rounded-2xl border border-border-strong shadow-inner mb-10 relative z-10 w-full">
                <button
                  type="button"
                  onClick={() => setTab('contact')}
                  className={cn(
                    'flex-1 flex justify-center items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-500 cursor-pointer',
                    tab === 'contact' 
                      ? 'bg-[length:200%_auto] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-tertiary text-white shadow-md' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-transparent'
                  )}
                >
                  Report Issue
                </button>
                <button
                  type="button"
                  onClick={() => setTab('feedback')}
                  className={cn(
                    'flex-1 flex justify-center items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-500 cursor-pointer',
                    tab === 'feedback' 
                      ? 'bg-[length:200%_auto] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-tertiary text-white shadow-md' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-transparent'
                  )}
                >
                  Give Feedback
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Full Name</label>
                    <input required placeholder="Jane Doe" className="h-11 rounded-xl bg-surface-2/80 border border-border-strong px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-tertiary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Email Address</label>
                    <input type="email" required placeholder="jane@example.com" className="h-11 rounded-xl bg-surface-2/80 border border-border-strong px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-tertiary" />
                  </div>
                </div>

                {tab === 'contact' ? (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in duration-300">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-primary">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-xl bg-surface-2/80 border border-border-strong px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all cursor-pointer appearance-none relative">
                          {CONTACT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-bold text-text-primary">Severity</label>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {SEVERITY_OPTIONS.map(({ value, label, color, activeBg }) => (
                            <button key={value} type="button" onClick={() => setSeverity(value)} className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 cursor-pointer', severity === value ? cn(activeBg, color, 'shadow-sm') : 'border-border-strong bg-surface-2/80 text-text-secondary hover:border-border-strong hover:bg-surface-raised')}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in duration-300">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-primary">Which area does this relate to?</label>
                        <select value={featureArea} onChange={(e) => setFeatureArea(e.target.value)} className="h-11 rounded-xl bg-surface-2/80 border border-border-strong px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all cursor-pointer appearance-none">
                          {FEATURE_AREAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-bold text-text-primary">Feedback Type</label>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {FEEDBACK_TYPES.map(({ value, label, activeBg, activeText }) => (
                            <button key={value} type="button" onClick={() => setFeedbackType(value)} className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 cursor-pointer', feedbackType === value ? cn(activeBg, activeText, 'shadow-sm') : 'border-border-strong bg-surface-2/80 text-text-secondary hover:border-border-strong hover:bg-surface-raised')}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 animate-in fade-in duration-300 mt-2">
                      <label className="text-sm font-bold text-text-primary">Overall Experience</label>
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-primary">{tab === 'contact' ? 'Subject' : 'Title'}</label>
                  <input required placeholder={tab === 'contact' ? "Brief summary of the issue" : "Give your feedback a short title"} className="h-11 rounded-xl bg-surface-2/80 border border-border-strong px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-tertiary" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-primary">{tab === 'contact' ? 'Description' : 'Message'}</label>
                  <textarea required rows={5} placeholder={tab === 'contact' ? "Describe what happened — steps to reproduce, what you expected..." : "Share your thoughts in detail — the more context, the better..."} className="rounded-xl bg-surface-2/80 border border-border-strong p-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-text-tertiary resize-y min-h-[140px]" />
                </div>

                <Button type="submit" variant="premium" className="w-full h-12 mt-4 font-bold shadow-xl shadow-brand-primary/20 text-[15px]" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : tab === 'contact' ? 'Submit Support Ticket' : 'Send Feedback'}
                </Button>
              </form>
            </div>
          </ScrollReveal>

        </div>
      </section>
      <LandingClosingCta ctaLabel="Analyze a document" reassurance="No card required · Deleted after analysis · Never used for training" />
    </>
  );
}
