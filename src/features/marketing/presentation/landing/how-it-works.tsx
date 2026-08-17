'use client';

import { useState, type ReactNode } from 'react';
import { Container, Heading, Section, Text, ScrollReveal } from '@/shared/ui';
import { cn } from '@/shared/ui/cn';

interface StepDetail {
  id: 'upload' | 'process' | 'output';
  number: string;
  title: string;
  description: string;
  visual: ReactNode;
}

export function LandingHowItWorks() {
  const [activeStep, setActiveStep] = useState<'upload' | 'process' | 'output'>('upload');

  const steps: StepDetail[] = [
    {
      id: 'upload',
      number: '01',
      title: 'Upload & Scan',
      description:
        'Drag and drop documents or use mobile scanning. Our ingestion engine supports high-resolution scans, multi-page PDFs, and complex image files.',
      visual: (
        <div className="animate-in fade-in flex h-full w-full flex-col rounded-2xl border border-border-strong/50 bg-surface-1 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] duration-500">
          {/* Mock Ingestion Header */}
          <div className="mb-6 flex items-center justify-between border-b border-border-subtle pb-3">
            <span className="text-xs font-bold text-text-primary">Upload Center</span>
            <span className="text-[10px] text-text-tertiary">Accepted: PDF, PNG, JPG, DOCX</span>
          </div>

          {/* Ingestion Dropzone */}
          <div className="group flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 p-6 text-center transition-colors hover:bg-brand-primary/10">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-solid transition-transform duration-300 group-hover:scale-110 dark:text-brand-primary">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <span className="text-xs font-bold text-text-primary">Drag & drop files here</span>
            <span className="mt-1 text-[10px] text-text-tertiary">
              or click to browse filesystem
            </span>
          </div>

          {/* File Queue List */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg border border-border-subtle/80 bg-surface-2/50 p-2.5">
              <div className="flex items-center gap-2.5">
                <svg
                  className="size-4 text-brand-solid dark:text-brand-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-primary">
                    IRS-CP2000-Notice.pdf
                  </span>
                  <span className="text-[9px] text-text-tertiary">2.4 MB · Ready</span>
                </div>
              </div>
              <span className="rounded-full border border-risk-safe-border bg-risk-safe-bg px-1.5 py-0.5 text-[9px] font-bold text-risk-safe-fg">
                100%
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'process',
      number: '02',
      title: 'AI Processing',
      description:
        'Our proprietary AI parses the layout, segments document sections, and flags critical clauses, payment deadlines, and potential liabilities in under a second.',
      visual: (
        <div className="animate-in fade-in relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border-strong/50 bg-surface-1 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] duration-500">
          {/* Scanline overlay */}
          <div className="pointer-events-none absolute inset-0 animate-scan-document bg-gradient-to-b from-brand-primary/0 via-brand-primary/10 to-brand-primary/0" />

          {/* Processing Header */}
          <div className="relative z-10 mb-4 flex items-center justify-between border-b border-border-subtle pb-3">
            <span className="text-xs font-bold text-text-primary">AI Parsing & Extraction</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-ping rounded-full bg-brand-secondary" />
              <span className="text-[10px] font-semibold text-text-secondary">Analyzing...</span>
            </div>
          </div>

          {/* Document visual with highlights */}
          <div className="relative z-10 flex flex-1 flex-col gap-3.5 opacity-90">
            <div className="h-2 w-1/3 rounded bg-border-strong" />
            <div className="h-2.5 w-full rounded bg-border-subtle" />

            {/* Highlighted text block */}
            <div className="relative my-1 rounded-lg border border-risk-critical-border bg-risk-critical-bg p-3.5">
              <div className="absolute top-[50%] -left-1 h-[80%] w-1.5 -translate-y-1/2 rounded-full bg-risk-critical-fg" />
              <span className="mb-1 block text-[9px] font-bold tracking-wider text-risk-critical-fg uppercase">
                Liability Clause Identified
              </span>
              <div className="h-2 w-[90%] rounded bg-risk-critical-fg/30" />
            </div>

            <div className="h-2.5 w-5/6 rounded bg-border-subtle" />
            <div className="h-2.5 w-[95%] rounded bg-border-subtle" />

            {/* Another highlighted block */}
            <div className="relative my-1 rounded-lg border border-risk-caution-border bg-risk-caution-bg p-3.5">
              <div className="absolute top-[50%] -left-1 h-[80%] w-1.5 -translate-y-1/2 rounded-full bg-risk-caution-fg" />
              <span className="mb-1 block text-[9px] font-bold tracking-wider text-risk-caution-fg uppercase">
                Interest accrues daily if unpaid
              </span>
              <div className="h-2 w-[80%] rounded bg-risk-caution-fg/30" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'output',
      number: '03',
      title: 'Structured Output',
      description:
        'Instantly view a structured summary of extracted fields, integrated metrics, and risk analysis in a unified, interactive dashboard.',
      visual: (
        <div className="animate-in fade-in flex h-full w-full flex-col rounded-2xl border border-border-strong/50 bg-surface-1 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] duration-500">
          {/* Output Header */}
          <div className="mb-4.5 flex items-center justify-between border-b border-border-subtle pb-2.5">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold tracking-wider text-brand-solid uppercase dark:text-brand-primary">
                Analysis Complete
              </span>
              <span className="text-xs font-bold text-text-primary">Extraction Output</span>
            </div>
            <span className="rounded-full border border-risk-safe-border bg-risk-safe-bg px-2 py-0.5 text-[10px] font-bold text-risk-safe-fg">
              Confidence: 99.8%
            </span>
          </div>

          {/* Extracted Fields Table */}
          <div className="flex flex-1 flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5 rounded-lg border border-border-subtle/50 bg-surface-2/40 p-2.5">
                <span className="text-[8px] font-bold text-text-tertiary uppercase">Lessor</span>
                <span className="text-[11px] font-semibold text-text-primary">
                  Aetrium Holdings
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg border border-border-subtle/50 bg-surface-2/40 p-2.5">
                <span className="text-[8px] font-bold text-text-tertiary uppercase">
                  Total Liability
                </span>
                <span className="text-[11px] font-bold text-brand-solid dark:text-brand-primary">
                  $12,480.00
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-risk-critical-border bg-risk-critical-bg p-2.5">
              <svg
                className="mt-0.5 size-4 shrink-0 text-risk-critical-fg"
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
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-extrabold text-risk-critical-fg uppercase">
                  Urgent Deadline
                </span>
                <span className="text-[10px] leading-snug text-text-secondary">
                  Payment due by August 31, 2026. Interest accrues daily after deadline.
                </span>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="mt-auto flex items-center justify-between gap-4 rounded-lg border border-border-subtle/50 bg-surface-2/40 p-2.5">
              <span className="text-[9px] font-bold text-text-tertiary uppercase">
                Liabilities (YTD)
              </span>
              <div className="flex h-6 max-w-[100px] flex-1 items-end justify-end gap-1">
                <div className="h-[30%] w-2.5 rounded-t bg-brand-primary/30" />
                <div className="h-[45%] w-2.5 rounded-t bg-brand-primary/30" />
                <div className="h-[60%] w-2.5 rounded-t bg-brand-primary/30" />
                <div className="h-[95%] w-2.5 rounded-t bg-brand-primary" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps.find((s) => s.id === activeStep) ?? steps[0]!;

  return (
    <Section id="how-it-works" spacing="lg" divider className="relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="pointer-events-none absolute top-0 right-0 h-[50%] w-[50%] bg-[radial-gradient(ellipse_at_top_right,rgba(var(--brand-primary-rgb),0.05),transparent_70%)]" />

      <Container width="shell" className="relative z-10 py-8">
        <ScrollReveal
          variant="fade-up"
          className="mx-auto mb-20 flex max-w-2xl flex-col gap-4 text-center"
        >
          <Heading
            level={2}
            size="eyebrow"
            className="font-bold tracking-widest text-brand-solid uppercase dark:text-brand-primary"
          >
            How It Works
          </Heading>
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
            Zero friction from{' '}
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              upload to structured analysis
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal
          variant="fade-up"
          delay={0.2}
          className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-12"
        >
          {/* Left Column: Interactive vertical steps */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {steps.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  aria-expanded={isActive}
                  aria-controls="how-it-works-visual"
                  id={`how-it-works-tab-${step.id}`}
                  className={cn(
                    'group relative flex gap-5 overflow-hidden rounded-2xl p-6 text-left transition-all duration-500',
                    isActive
                      ? 'bg-surface-1 shadow-card ring-1 ring-border-strong'
                      : 'border border-transparent bg-transparent hover:border-border-subtle hover:bg-surface-1/50',
                  )}
                >
                  {/* Subtle active gradient background */}
                  {isActive && (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent" />
                  )}
                  {/* Active left indicator bar */}
                  {isActive && (
                    <div className="absolute top-1/2 left-0 h-12 w-1 -translate-y-1/2 rounded-r-full bg-brand-primary shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.5)]" />
                  )}

                  {/* Number bubble */}
                  <span
                    className={cn(
                      'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-colors duration-500',
                      isActive
                        ? 'bg-brand-primary text-text-on-brand shadow-lg shadow-brand-primary/30'
                        : 'bg-surface-2 text-text-tertiary group-hover:bg-border-strong group-hover:text-text-primary',
                    )}
                  >
                    {step.number}
                  </span>

                  {/* Title & Description */}
                  <div className="relative z-10 flex flex-col gap-2">
                    <Heading
                      level={3}
                      size="sm"
                      className={cn(
                        'font-bold transition-colors duration-500',
                        isActive
                          ? 'text-brand-solid dark:text-brand-primary'
                          : 'text-text-primary group-hover:text-text-primary',
                      )}
                    >
                      {step.title}
                    </Heading>
                    <Text
                      size="sm"
                      tone={isActive ? 'primary' : 'secondary'}
                      className="leading-relaxed"
                    >
                      {step.description}
                    </Text>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Visual Demonstration Frame */}
          <div className="relative flex items-center justify-center pl-0 lg:col-span-7 lg:pl-10">
            {/* Ambient background glow behind the mockup */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/10 blur-[100px]" />

            <div className="group relative flex aspect-[4/3] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-border-strong bg-surface-1/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
              {/* macOS-style top bar */}
              <div className="relative flex h-14 items-center gap-2 border-b border-border-strong/40 bg-surface-2/20 px-5">
                <div className="z-10 flex gap-2">
                  <div className="size-3.5 rounded-full border border-[#E0443E]/50 bg-[#FF5F56] shadow-inner" />
                  <div className="size-3.5 rounded-full border border-[#DEA123]/50 bg-[#FFBD2E] shadow-inner" />
                  <div className="size-3.5 rounded-full border border-[#1AAB29]/50 bg-[#27C93F] shadow-inner" />
                </div>
                <div className="absolute inset-x-0 mx-auto flex h-7 w-56 items-center justify-center rounded-md border border-border-subtle bg-canvas/80 shadow-sm">
                  <span className="font-mono text-[10px] tracking-wider text-text-tertiary">
                    app.paperlens.io/{activeStep}
                  </span>
                </div>
              </div>

              {/* Injected Active Step Panel */}
              <div
                id="how-it-works-visual"
                role="region"
                aria-labelledby={`how-it-works-tab-${activeStep}`}
                className="relative flex w-full flex-1 items-center justify-center bg-canvas/30 p-6 sm:p-10"
              >
                {currentStep.visual}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
