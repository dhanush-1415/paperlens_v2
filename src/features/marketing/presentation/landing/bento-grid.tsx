import { Heading, Text } from '@/shared/ui';

export interface LandingBentoGridProps {
  id?: string;
}

export function LandingBentoGrid({ id = 'features' }: LandingBentoGridProps) {
  return (
    <section id={id} className="force-dark w-full py-24 relative overflow-hidden bg-canvas">
      {/* Background Glows */}
      <div className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-brand-accent/5 blur-[150px] pointer-events-none" />

      <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-6 flex flex-col gap-12 relative z-10">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-3 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">The Ultimate Unfair Advantage</span>
          <Heading level={2} size="display-md" className="tracking-tight text-text-primary">
            Never Be Blind-Sided Again.
          </Heading>
          <Text tone="secondary" size="md" className="leading-relaxed">
            PaperLens doesn't just read documents; it weaponizes them for you. We highlight exactly what they don't want you to notice. Protect your business and personal assets in seconds.
          </Text>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Risk Radar */}
          <div className="md:col-span-2 group relative flex flex-col justify-between gap-6 rounded-3xl border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-primary/10 hover:border-brand-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-risk-critical-bg text-risk-critical ring-1 ring-risk-critical-border mb-2 shadow-sm">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Financial Risk Radar</h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-md">
                Automatically isolates penalty clauses, fee escalations, and liability traps before you sign anything. Find the gotchas before they find you.
              </p>
            </div>

            {/* Mockup Element */}
            <div className="relative z-10 mt-4 rounded-xl border border-border-subtle bg-surface-2 p-4 shadow-inner">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-2 w-2 rounded-full bg-risk-critical animate-pulse" />
                <span className="text-xs font-semibold text-risk-critical">Critical Risk Detected: Hidden Fee</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-border-strong/40" />
                <div className="h-2 w-4/5 rounded bg-border-strong/40" />
              </div>
            </div>
          </div>

          {/* Card 2: Deadline Extraction */}
          <div className="md:col-span-1 group relative flex flex-col justify-between gap-6 rounded-3xl border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-accent/10 hover:border-brand-accent/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-bl from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-risk-caution-bg text-risk-caution ring-1 ring-risk-caution-border mb-2 shadow-sm">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Timeline Engine</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Never miss a cancellation window again. We extract hidden auto-renewal dates instantly.
              </p>
            </div>
            
            <div className="relative z-10 mt-auto pt-6 border-t border-border-subtle flex flex-col gap-2">
              <span className="text-xs font-bold text-text-primary">Next Deadline</span>
              <span className="text-2xl text-brand-accent">Nov 01</span>
            </div>
          </div>

          {/* Card 3: AI Chat */}
          <div className="md:col-span-1 group relative flex flex-col justify-between gap-6 rounded-3xl border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-risk-safe/10 hover:border-risk-safe/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-risk-safe/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-risk-safe-bg text-risk-safe ring-1 ring-risk-safe-border mb-2 shadow-sm">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Interrogate Documents</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Chat with your file. Ask "Can I get out of this?" and get an answer with exact page citations.
              </p>
            </div>
          </div>

          {/* Card 4: Plain English Translation */}
          <div className="md:col-span-2 group relative flex flex-col justify-between gap-6 rounded-3xl border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-primary/10 hover:border-brand-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20 mb-2 shadow-sm">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Legalese to English</h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-md">
                Instantly converts dense, deceptive contracts into simple, actionable bullet points that anyone can understand.
              </p>
            </div>

            {/* Mockup Element */}
            <div className="relative z-10 mt-4 rounded-xl border border-border-subtle bg-surface-2 p-4 shadow-inner flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-1/2 p-3 border border-border-subtle rounded-lg bg-canvas text-[10px] text-text-tertiary blur-[1px]">
                Whereas the party of the first part hereby agrees to indemnify and hold harmless...
              </div>
              <svg className="size-5 text-brand-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <div className="w-full md:w-1/2 p-3 border border-brand-primary/30 rounded-lg bg-brand-primary/5 text-xs text-brand-primary font-medium">
                You are responsible for all damages.
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
