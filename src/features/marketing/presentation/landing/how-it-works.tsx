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
        <div className="w-full h-full flex flex-col p-6 bg-surface-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-border-strong/50 animate-in fade-in duration-500">
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
        <div className="w-full h-full flex flex-col p-6 bg-surface-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-border-strong/50 animate-in fade-in duration-500 relative overflow-hidden">
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
        <div className="w-full h-full flex flex-col p-6 bg-surface-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-border-strong/50 animate-in fade-in duration-500">
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
    <Section id="how-it-works" spacing="lg" divider className="relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,rgba(var(--brand-primary-rgb),0.05),transparent_70%)] pointer-events-none" />
      
      <Container width="shell" className="py-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-4 mb-20">
          <Heading level={2} size="eyebrow" className="text-brand-solid dark:text-brand-primary uppercase tracking-widest font-bold">
            How It Works
          </Heading>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary">
            Zero friction from <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">upload to structured analysis</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">
          
          {/* Left Column: Interactive vertical steps */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {steps.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    'text-left p-6 rounded-2xl transition-all duration-500 flex gap-5 group relative overflow-hidden',
                    isActive
                      ? 'bg-surface-1 ring-1 ring-border-strong shadow-card'
                      : 'bg-transparent border border-transparent hover:bg-surface-1/50 hover:border-border-subtle'
                  )}
                >
                  {/* Subtle active gradient background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent pointer-events-none" />
                  )}
                  {/* Active left indicator bar */}
                  {isActive && (
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-brand-primary rounded-r-full shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.5)]" />
                  )}

                  {/* Number bubble */}
                  <span
                    className={cn(
                      'size-10 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 transition-colors duration-500 relative z-10',
                      isActive
                        ? 'bg-brand-primary text-text-on-brand shadow-lg shadow-brand-primary/30'
                        : 'bg-surface-2 text-text-tertiary group-hover:bg-border-strong group-hover:text-text-primary'
                    )}
                  >
                    {step.number}
                  </span>

                  {/* Title & Description */}
                  <div className="flex flex-col gap-2 relative z-10">
                    <Heading
                      level={3}
                      size="sm"
                      className={cn(
                        'font-bold transition-colors duration-500',
                        isActive ? 'text-brand-solid dark:text-brand-primary' : 'text-text-primary group-hover:text-text-primary'
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
          <div className="lg:col-span-7 flex justify-center items-center relative pl-0 lg:pl-10">
            {/* Ambient background glow behind the mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-primary/10 blur-[100px] pointer-events-none rounded-full" />
            
            <div className="w-full max-w-2xl aspect-[4/3] rounded-[2rem] bg-surface-1/60 backdrop-blur-2xl border border-border-strong shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col relative overflow-hidden group">
              
              {/* macOS-style top bar */}
              <div className="h-14 border-b border-border-strong/40 bg-surface-2/20 flex items-center px-5 gap-2 relative">
                <div className="flex gap-2 z-10">
                  <div className="size-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-inner" />
                  <div className="size-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-inner" />
                  <div className="size-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-inner" />
                </div>
                <div className="absolute inset-x-0 mx-auto w-56 h-7 bg-canvas/80 border border-border-subtle rounded-md flex items-center justify-center shadow-sm">
                  <span className="text-[10px] text-text-tertiary font-mono tracking-wider">app.paperlens.io/{activeStep}</span>
                </div>
              </div>

              {/* Injected Active Step Panel */}
              <div className="flex-1 w-full bg-canvas/30 relative flex items-center justify-center p-6 sm:p-10">
                {currentStep.visual}
              </div>

            </div>
          </div>

        </div>
      </Container>
    </Section>
  );
}
