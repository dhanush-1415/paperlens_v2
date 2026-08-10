'use client';

import { useState, type ReactNode } from 'react';
import { Container, Heading, Section, Text } from '@/shared/ui';
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
      description: 'Drag and drop documents or use mobile scanning. Our ingestion engine supports high-resolution scans, multi-page PDFs, and complex image files.',
      visual: (
        <div className="w-full h-full flex flex-col p-6 bg-canvas/40 backdrop-blur-md rounded-2xl border border-border-strong/40 animate-in fade-in duration-300">
          {/* Mock Ingestion Header */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-border-subtle">
            <span className="text-xs font-bold text-text-primary">Upload Center</span>
            <span className="text-[10px] text-text-tertiary">Accepted: PDF, PNG, JPG, DOCX</span>
          </div>

          {/* Ingestion Dropzone */}
          <div className="flex-1 border-2 border-dashed border-brand-primary/30 rounded-xl bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer group">
            <div className="size-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-solid dark:text-brand-primary mb-3 group-hover:scale-110 transition-transform duration-300">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <span className="text-xs font-bold text-text-primary">Drag & drop files here</span>
            <span className="text-[10px] text-text-tertiary mt-1">or click to browse filesystem</span>
          </div>

          {/* File Queue List */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="p-2.5 rounded-lg bg-surface-2/50 border border-border-subtle/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="size-4 text-brand-solid dark:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-primary">IRS-CP2000-Notice.pdf</span>
                  <span className="text-[9px] text-text-tertiary">2.4 MB · Ready</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-risk-safe-fg px-1.5 py-0.5 bg-risk-safe-bg border border-risk-safe-border rounded-full">100%</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'process',
      number: '02',
      title: 'AI Processing',
      description: 'Our proprietary AI parses the layout, segments document sections, and flags critical clauses, payment deadlines, and potential liabilities in under a second.',
      visual: (
        <div className="w-full h-full flex flex-col p-6 bg-canvas/40 backdrop-blur-md rounded-2xl border border-border-strong/40 animate-in fade-in duration-300 relative overflow-hidden">
          {/* Scanline overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/0 via-brand-primary/10 to-brand-primary/0 animate-scan-document pointer-events-none" />

          {/* Processing Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-subtle relative z-10">
            <span className="text-xs font-bold text-text-primary">AI Parsing & Extraction</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-secondary animate-ping" />
              <span className="text-[10px] font-semibold text-text-secondary">Analyzing...</span>
            </div>
          </div>

          {/* Document visual with highlights */}
          <div className="flex-1 flex flex-col gap-3.5 relative z-10 opacity-90">
            <div className="h-2 w-1/3 bg-border-strong rounded" />
            <div className="h-2.5 w-full bg-border-subtle rounded" />
            
            {/* Highlighted text block */}
            <div className="p-3.5 rounded-lg bg-risk-critical-bg border border-risk-critical-border relative my-1">
              <div className="absolute -left-1 top-[50%] -translate-y-1/2 w-1.5 h-[80%] bg-risk-critical-fg rounded-full" />
              <span className="text-[9px] font-bold text-risk-critical-fg uppercase tracking-wider block mb-1">Liability Clause Identified</span>
              <div className="h-2 w-[90%] bg-risk-critical-fg/30 rounded" />
            </div>

            <div className="h-2.5 w-5/6 bg-border-subtle rounded" />
            <div className="h-2.5 w-[95%] bg-border-subtle rounded" />

            {/* Another highlighted block */}
            <div className="p-3.5 rounded-lg bg-risk-caution-bg border border-risk-caution-border relative my-1">
              <div className="absolute -left-1 top-[50%] -translate-y-1/2 w-1.5 h-[80%] bg-risk-caution-fg rounded-full" />
              <span className="text-[9px] font-bold text-risk-caution-fg uppercase tracking-wider block mb-1">Interest accrues daily if unpaid</span>
              <div className="h-2 w-[80%] bg-risk-caution-fg/30 rounded" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'output',
      number: '03',
      title: 'Structured Output',
      description: 'Instantly view a structured summary of extracted fields, integrated metrics, and risk analysis in a unified, interactive dashboard.',
      visual: (
        <div className="w-full h-full flex flex-col p-6 bg-canvas/40 backdrop-blur-md rounded-2xl border border-brand-primary/30 animate-in fade-in duration-300">
          {/* Output Header */}
          <div className="flex justify-between items-center mb-4.5 pb-2.5 border-b border-border-subtle">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-brand-solid dark:text-brand-primary uppercase tracking-wider">Analysis Complete</span>
              <span className="text-xs font-bold text-text-primary">Extraction Output</span>
            </div>
            <span className="text-[10px] font-bold text-risk-safe-fg bg-risk-safe-bg border border-risk-safe-border px-2 py-0.5 rounded-full">
              Confidence: 99.8%
            </span>
          </div>

          {/* Extracted Fields Table */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-surface-2/40 border border-border-subtle/50 flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-text-tertiary uppercase">Lessor</span>
                <span className="text-[11px] font-semibold text-text-primary">Aetrium Holdings</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-2/40 border border-border-subtle/50 flex flex-col gap-0.5">
                <span className="text-[8px] font-bold text-text-tertiary uppercase">Total Liability</span>
                <span className="text-[11px] font-bold text-brand-solid dark:text-brand-primary">$12,480.00</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-risk-critical-bg border border-risk-critical-border flex items-start gap-2.5">
              <svg className="size-4 text-risk-critical-fg shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-extrabold text-risk-critical-fg uppercase">Urgent Deadline</span>
                <span className="text-[10px] text-text-secondary leading-snug">Payment due by August 31, 2026. Interest accrues daily after deadline.</span>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="p-2.5 rounded-lg bg-surface-2/40 border border-border-subtle/50 flex justify-between items-center gap-4 mt-auto">
              <span className="text-[9px] font-bold text-text-tertiary uppercase">Liabilities (YTD)</span>
              <div className="h-6 flex items-end gap-1 flex-1 max-w-[100px] justify-end">
                <div className="w-2.5 bg-brand-primary/30 rounded-t h-[30%]" />
                <div className="w-2.5 bg-brand-primary/30 rounded-t h-[45%]" />
                <div className="w-2.5 bg-brand-primary/30 rounded-t h-[60%]" />
                <div className="w-2.5 bg-brand-primary rounded-t h-[95%]" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps.find((s) => s.id === activeStep) ?? steps[0]!;

  return (
    <Section id="how-it-works" spacing="lg" divider>
      <Container width="shell" className="py-8">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-3 mb-16">
          <Heading level={2} size="eyebrow" className="text-brand-solid dark:text-brand-primary">
            How It Works
          </Heading>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Zero friction from upload to structured analysis
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Interactive vertical steps */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {steps.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    'text-left p-6 rounded-2xl border transition-all duration-300 flex gap-5 group',
                    isActive
                      ? 'border-brand-primary/30 bg-surface-1 shadow-lg shadow-brand-primary/5'
                      : 'border-border-subtle bg-transparent hover:bg-surface-2/30 hover:border-border-strong'
                  )}
                >
                  {/* Number bubble */}
                  <span
                    className={cn(
                      'size-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-300',
                      isActive
                        ? 'bg-brand-primary text-text-on-brand'
                        : 'bg-surface-2 text-text-tertiary group-hover:bg-border-strong group-hover:text-text-primary'
                    )}
                  >
                    {step.number}
                  </span>

                  {/* Title & Description */}
                  <div className="flex flex-col gap-1.5">
                    <Heading
                      level={3}
                      size="sm"
                      className={cn(
                        'transition-colors duration-300',
                        isActive ? 'text-brand-solid dark:text-brand-primary' : 'text-text-primary'
                      )}
                    >
                      {step.title}
                    </Heading>
                    <Text size="sm" tone={isActive ? 'primary' : 'secondary'} className="leading-relaxed">
                      {step.description}
                    </Text>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Visual Demonstration Frame */}
          <div className="lg:col-span-6 flex justify-center items-center">
            <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-surface-2/30 border border-border-strong/50 p-4 shadow-xl flex items-center justify-center relative overflow-hidden group">
              
              {/* Top bar controls */}
              <div className="absolute top-3 left-4 right-4 flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-border-strong" />
                <div className="size-2.5 rounded-full bg-border-strong" />
                <div className="size-2.5 rounded-full bg-border-strong" />
                <div className="h-4 w-36 bg-canvas/40 border border-border-subtle rounded mx-auto flex items-center justify-center">
                  <span className="text-[8px] text-text-tertiary">app.paperlens.io/{activeStep}</span>
                </div>
              </div>

              {/* Injected Active Step Panel */}
              <div className="w-full h-[85%] mt-6 relative flex items-center justify-center px-4">
                {currentStep.visual}
              </div>

            </div>
          </div>

        </div>
      </Container>
    </Section>
  );
}
