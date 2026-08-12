'use client';

import { useState } from 'react';
import { Card, CardContent, Heading, Text, Button, Tabs, type TabItem } from '@/shared/ui';
import { UploadCloudIcon, ScanIcon, VaultIcon } from '@/shared/ui/icons/dashboard-icons';
import { InfoIcon, DocumentIcon } from '@/shared/ui/icons';

export function ScanTabs() {
  const [urlInput, setUrlInput] = useState('');

  const items: TabItem[] = [
    {
      id: 'upload',
      label: (
        <span className="flex items-center gap-2">
          <UploadCloudIcon className="size-4" /> Upload
        </span>
      ),
      content: (
        <Card className="overflow-hidden border-border-strong/50 shadow-md">
          <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border-subtle hover:border-brand-primary/50 transition-colors m-4 rounded-3xl bg-surface-1 hover:bg-surface-2 cursor-pointer group">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary mb-6 group-hover:scale-110 group-hover:bg-brand-primary/20 transition-all duration-300 ring-1 ring-brand-primary/20 shadow-inner">
              <UploadCloudIcon className="size-8" />
            </div>
            <Heading level={3} size="sm" className="font-bold tracking-tight mb-2">
              Drag & Drop your document
            </Heading>
            <Text tone="secondary" className="mb-6 max-w-sm">
              Supports PDF, DOCX, RTF, JPEG, PNG up to 10MB. We use enterprise-grade encryption for all uploads.
            </Text>
            <Button variant="primary" className="shadow-lg shadow-brand-primary/20">
              Browse Files
            </Button>
            <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-text-tertiary">
              <VaultIcon className="size-3" />
              <span>End-to-end encrypted • Zero retention policy</span>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'text',
      label: (
        <span className="flex items-center gap-2">
          <DocumentIcon className="size-4" /> URL / Text
        </span>
      ),
      content: (
        <Card className="overflow-hidden border-border-strong/50 shadow-md">
          <CardContent className="p-1 relative min-h-[400px] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
            
            <div className="p-6 border-b border-border-subtle bg-surface-2/30 flex items-center gap-4">
              <div className="flex size-10 rounded-xl bg-surface-raised items-center justify-center shadow-sm border border-border-subtle">
                <DocumentIcon className="size-5 text-text-primary" />
              </div>
              <div>
                <Heading level={3} size="sm" className="font-bold">Analyze Text or URL</Heading>
                <Text size="xs" tone="secondary">Paste a link or full document text below to extract insights instantly.</Text>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4 relative z-10">
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste a URL (e.g. https://openai.com/privacy) or paste the raw document text here..."
                className="flex-1 w-full rounded-2xl border border-border-strong/50 bg-surface-1 focus:bg-surface-raised px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all resize-none shadow-inner"
              />
              <Button variant="primary" disabled={!urlInput.trim()} className="w-full h-12 font-bold shadow-xl shadow-brand-primary/20 text-sm">
                <ScanIcon className="size-4 mr-2" /> Analyze Content
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'audio',
      label: (
        <span className="flex items-center gap-2">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg> Audio
        </span>
      ),
      content: (
        <Card className="overflow-hidden border-border-strong/50 shadow-md">
          <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border-subtle hover:border-brand-primary/50 transition-colors m-4 rounded-3xl bg-surface-1 hover:bg-surface-2 cursor-pointer group">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary mb-6 group-hover:scale-110 group-hover:bg-brand-primary/20 transition-all duration-300 ring-1 ring-brand-primary/20 shadow-inner">
              <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
            <Heading level={3} size="sm" className="font-bold tracking-tight mb-2">
              Upload Audio File
            </Heading>
            <Text tone="secondary" className="mb-6 max-w-sm">
              Upload a recording of a meeting, verbal agreement, or dictation. We transcribe and analyze it instantly. Supports MP3, WAV, M4A up to 25MB.
            </Text>
            <Button variant="primary" className="shadow-lg shadow-brand-primary/20">
              Select Audio
            </Button>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'video',
      label: (
        <span className="flex items-center gap-2">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect height="14" rx="2" ry="2" width="15" x="1" y="5"/></svg> Video <span className="ml-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-primary leading-none">Soon</span>
        </span>
      ),
      content: (
        <Card className="overflow-hidden border-border-strong/50 shadow-md relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-brand-tertiary/10 pointer-events-none" />
          <CardContent className="p-12 flex flex-col items-center justify-center text-center relative z-10 min-h-[400px]">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-surface-2 mb-6 ring-1 ring-border-strong shadow-lg">
              <svg className="size-8 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect height="14" rx="2" ry="2" width="15" x="1" y="5"/></svg>
            </div>
            
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary uppercase tracking-wider">
              <InfoIcon className="size-3" />
              In Development
            </div>
            
            <Heading level={2} size="md" className="font-extrabold tracking-tight mb-3">
              Video Analysis
            </Heading>
            <Text tone="secondary" className="max-w-md mx-auto leading-relaxed mb-8 font-medium">
              Upload lecture recordings, screen captures, or slow-pan videos. Our engine will auto-extract frames and analyze them seamlessly.
            </Text>
            
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary">MP4 / MOV</div>
              <div className="px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary">Auto-Framing</div>
              <div className="px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary">Multi-page sync</div>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Tabs 
        items={items} 
        label="Upload Modes" 
        variant="pill" 
        className="mb-8 flex flex-col items-center justify-center" 
      />
    </div>
  );
}
