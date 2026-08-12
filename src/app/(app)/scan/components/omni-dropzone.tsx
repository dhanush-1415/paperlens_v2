'use client';

import { useState, useCallback, useEffect, useActionState, useRef } from 'react';
import { Heading, Text, Button } from '@/shared/ui';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UploadCloudIcon, ScanIcon, VaultIcon } from '@/shared/ui/icons/dashboard-icons';
import { InfoIcon, ShieldIcon, DocumentIcon } from '@/shared/ui/icons';
import { cn } from '@/shared/ui/cn';
import { analyzeDocumentAction } from '@/features/document-analysis/presentation/actions';

export function OmniDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('document');
  const [textState, textFormAction, isTextPending] = useActionState(analyzeDocumentAction, null);
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Strictly auto-scroll to the bottom of the page when landed.
    // We use a small timeout to ensure all layout paints and animations 
    // have completed calculating their final DOM height.
    const scrollTimer = setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight + 5000, // Overshoot to guarantee bottom
        behavior: 'smooth'
      });
    }, 150);

    return () => clearTimeout(scrollTimer);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      // Direct integration with the zero-dependency text extraction server action
      const analysisFormData = new FormData();
      analysisFormData.append('file', file);
      analysisFormData.append('documentType', 'other');
      analysisFormData.append('title', file.name);
      
      // analyzeDocumentAction will extract text (PDF, DOCX, XLSX, etc.), run analysis, and redirect
      await analyzeDocumentAction(null, analysisFormData);
    } catch (e) {
      console.error(e);
      toast.error('Failed to process document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) handleFile(file);
    }
  };

  // URL analysis handler
  const handleUrlAnalyze = async (overrideText?: string) => {
    const input = (overrideText ?? urlInput).trim();
    if (!input) return;
    setIsAnalyzing(true);
    const isUrl = /^https?:\/\//i.test(input);
    try {
      const res = await fetch(isUrl ? '/api/analyze-url' : '/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl ? { url: input } : { text: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Analysis failed. Please try again.');
        return;
      }
      if (data.documentId) {
        router.refresh();
        router.push(`/document/${data.documentId}`);
      } else {
        // Assuming result handling similar to text submission
        // For simplicity, we reuse handleResult if defined elsewhere
        // If not, you may need to integrate accordingly.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        handleResult && handleResult(data.result);
      }
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Capability Segmented Control */}
      <div className="flex items-center justify-center sm:justify-start mb-8">
        <div className="inline-flex items-center p-1.5 bg-brand-primary/[0.03] backdrop-blur-md border border-brand-primary/10 rounded-2xl shadow-inner">
          {[
            { id: 'document', label: 'Document', icon: <DocumentIcon className="size-4" /> },
            { id: 'link', label: 'URL', icon: <ScanIcon className="size-4" /> },
            { id: 'text', label: 'Text', icon: <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg> },
            { id: 'audio', label: 'Audio', icon: <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg> },
            { id: 'video', label: 'Video', icon: <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect height="14" rx="2" ry="2" width="15" x="1" y="5"/></svg>, soon: true },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 outline-none",
                activeTab === tab.id 
                  ? "text-brand-primary shadow-sm bg-brand-primary/10 border border-brand-primary/20 ring-1 ring-brand-primary/10" 
                  : "text-text-secondary hover:text-brand-primary/80 hover:bg-brand-primary/5 border border-transparent"
              )}
            >
              <span className={cn("transition-colors", activeTab === tab.id ? "text-brand-primary" : "text-text-tertiary")}>
                {tab.icon}
              </span>
              {tab.label}
              {tab.soon && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[9px] uppercase tracking-widest font-bold">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Asymmetric Split Grid */}
      <div className="flex flex-col lg:flex-row gap-8 w-full min-h-[520px]">
        
        {/* Left Side: Omni-Drop Vault (Premium Focus) */}
        <div 
          className={cn(
            "flex-1 relative rounded-3xl transition-all duration-400 flex flex-col p-10 sm:p-14 overflow-hidden group",
            activeTab === 'link' 
              ? "border border-brand-primary/20 bg-brand-primary/[0.02] shadow-sm"
              : isDragging 
                ? "border-2 border-brand-primary bg-brand-primary/[0.04] shadow-[0_0_60px_-15px_rgba(37,99,235,0.15)] scale-[1.005]" 
                : "border border-brand-primary/20 bg-brand-primary/[0.02] shadow-sm hover:border-brand-primary/40 hover:shadow-md"
          )}
          onDragOver={activeTab !== 'link' ? onDragOver : undefined}
          onDragLeave={activeTab !== 'link' ? onDragLeave : undefined}
          onDrop={activeTab !== 'link' ? onDrop : undefined}
        >
          {/* Ambient Glow for Drag State */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/5 pointer-events-none transition-opacity duration-500",
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-50"
          )} />
          
          {activeTab === 'text' ? (
            <div key="text" className="relative z-10 flex flex-col w-full h-full animate-fade-in-up">
              <div className="flex items-center gap-4 mb-8 mt-2">
                <div className="inline-flex items-center justify-center size-12 rounded-xl bg-surface-1 border border-border-subtle shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                  <svg className="size-5 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
                </div>
                <div className="flex flex-col text-left">
                  <Heading level={2} size="md" className="font-geist font-bold tracking-tight text-text-primary mb-0.5">
                    Paste Raw Text
                  </Heading>
                  <Text size="sm" tone="secondary" className="font-inter">
                    Instantly scan raw clauses, paragraphs, or entire policy documents.
                  </Text>
                </div>
              </div>
              
              <form action={textFormAction} className="w-full flex-1 relative group/input min-h-[240px]">
                {textState && !textState.ok && textState.error && !textState.error.fieldErrors && (
                  <div className="absolute -top-12 left-0 right-0 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {textState.error.messageKey}
                  </div>
                )}
                <div className="absolute inset-0 bg-brand-primary/5 blur-xl rounded-2xl transition-opacity duration-500 opacity-0 group-focus-within/input:opacity-100" />
                <div className="relative h-full flex flex-col bg-surface-1 border border-border-strong/50 rounded-2xl shadow-sm p-1.5 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all duration-300">
                  <textarea
                    name="text"
                    required
                    placeholder="Paste your contract clauses or text here..."
                    className="w-full flex-1 bg-transparent border-none outline-none px-4 py-4 font-inter text-text-primary placeholder:text-text-tertiary text-base resize-none"
                  />
                  <input type="hidden" name="documentType" value="other" />
                  <div className="flex justify-between items-center px-4 py-3 border-t border-border-subtle/50">
                    <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Text Analysis Engine</span>
                    <Button type="submit" variant="premium" loading={isTextPending}>
                      {isTextPending ? 'Analyzing...' : 'Analyze Text'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          ) : activeTab === 'link' ? (
            <div key="link" className="relative z-10 flex flex-col w-full h-full max-w-3xl mx-auto justify-center items-center text-center animate-fade-in-up">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-surface-1 border border-border-subtle mb-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                <ScanIcon className="size-6 text-brand-primary" />
              </div>
              <Heading level={2} size="md" className="font-geist font-bold tracking-tight mb-3 text-text-primary">
                Analyze a Web Link
              </Heading>
              <Text size="md" tone="secondary" className="font-inter mb-10 max-w-lg">
                Paste a URL to a privacy policy, terms of service, or any public document. Our engine will fetch and parse it instantly.
              </Text>
              
              <div className="w-full relative group/input mb-8">
                <div className="absolute inset-0 bg-brand-primary/5 blur-xl rounded-full transition-opacity duration-500 opacity-0 group-focus-within/input:opacity-100" />
                <div className="relative flex items-center bg-surface-1 border border-border-strong/50 rounded-full shadow-sm p-1.5 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all duration-300 hover:border-border-strong">
                  <div className="pl-5 text-text-tertiary">
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/terms"
                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 font-inter text-text-primary placeholder:text-text-tertiary text-base"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    disabled={isAnalyzing}
                  />
                  <Button variant="premium" className="h-11 rounded-full px-6" onClick={() => handleUrlAnalyze()} disabled={!urlInput.trim() || isAnalyzing}>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mr-2">Quick Try:</span>
                {[
                  { label: 'OpenAI Privacy', icon: '🔒' },
                  { label: 'Stripe Terms', icon: '💳' },
                  { label: 'GitHub SLA', icon: '🐙' }
                ].map(chip => (
                  <button key={chip.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-raised transition-all">
                    <span>{chip.icon}</span> {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ) : activeTab === 'video' ? (
            <div key="video" className="relative z-10 flex flex-col w-full h-full items-center justify-center text-center animate-fade-in-up">
              <div className="relative mb-8 group cursor-not-allowed">
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full scale-150 opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                {/* Main Video Icon Container */}
                <div className="relative flex items-center justify-center size-24 rounded-3xl bg-gradient-to-br from-brand-primary/10 to-brand-primary/[0.02] border border-brand-primary/30 shadow-lg shadow-brand-primary/5 overflow-hidden backdrop-blur-xl">
                  {/* Decorative Play Button */}
                  <svg className="size-10 text-brand-primary ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  
                  {/* Glass Overlay for "Coming Soon" */}
                  <div className="absolute inset-0 bg-black/10 dark:bg-white/5 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-surface-1/90 px-3 py-1 rounded-lg border border-border-subtle shadow-sm flex items-center gap-1.5">
                      <ShieldIcon className="size-3 text-text-tertiary" />
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Locked</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Heading level={2} size="lg" className="font-geist font-extrabold tracking-tight mb-4 text-text-primary">
                Automated Video Analysis
              </Heading>
              <Text size="md" tone="secondary" className="font-inter max-w-md mx-auto leading-relaxed mb-8">
                Upload lecture recordings or screen captures. Our AI will auto-extract frames, synchronize audio, and map out critical liabilities seamlessly.
              </Text>
              
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border-subtle text-xs font-semibold text-text-secondary shadow-sm">MP4</span>
                <span className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border-subtle text-xs font-semibold text-text-secondary shadow-sm">MOV</span>
                <span className="px-3 py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-xs font-bold text-brand-primary shadow-sm ring-1 ring-brand-primary/10">Auto-Framing AI</span>
              </div>
            </div>
          ) : (
            <div key="default" className="relative z-10 flex flex-col w-full h-full items-center justify-center text-center animate-fade-in-up">
              
              {/* Massive Dashed Dropzone Area */}
              <div className={cn(
                "w-full max-w-3xl flex flex-col items-center justify-center p-12 sm:p-16 rounded-3xl border-2 border-dashed transition-all duration-300",
                isDragging 
                  ? "border-brand-primary bg-brand-primary/[0.05]" 
                  : "border-border-strong/50 bg-surface-1/50 hover:border-brand-primary/50 hover:bg-brand-primary/[0.02]"
              )}>
                {/* Vibrant Gradient Icon */}
                <div className="relative mb-8">
                  <div className={cn(
                    "absolute inset-0 rounded-full bg-brand-primary blur-2xl transition-opacity duration-500",
                    isDragging ? "opacity-40" : "opacity-15 group-hover:opacity-30"
                  )} />
                  <div className={cn(
                    "relative flex items-center justify-center rounded-[2rem] transition-all duration-500 z-10 shadow-xl",
                    isDragging 
                      ? "size-28 bg-brand-primary text-white scale-110 shadow-brand-primary/40" 
                      : "size-24 bg-gradient-to-br from-brand-primary to-brand-primary-hover text-white shadow-brand-primary/20 group-hover:scale-105"
                  )}>
                    <UploadCloudIcon className={cn("transition-all duration-500", isDragging ? "size-12" : "size-10")} />
                  </div>
                </div>
                
                <Heading level={2} size="md" className="font-geist font-extrabold tracking-tight mb-4 text-text-primary">
                  {isDragging ? "Drop to instantly analyze" : activeTab === 'audio' ? "Upload Audio Recording" : "Drag & Drop your files here"}
                </Heading>
                
                <Text size="md" tone="secondary" className="font-inter max-w-sm mx-auto mb-10 leading-relaxed pointer-events-auto">
                  {activeTab === 'audio' 
                    ? "We extract speech from MP3 or WAV files and run our legal risk analysis against the transcription instantly."
                    : "We natively support PDFs, DOCX, TXT, and Images. Our engine will auto-route it."}
                </Text>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={onFileChange} 
                  accept=".pdf,.docx,.txt,.md"
                />
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button 
                    variant="premium" 
                    size="lg"
                    loading={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "transition-all duration-300 pointer-events-auto",
                      isDragging ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                    )}
                  >
                    {isUploading ? 'Uploading...' : 'Browse Files'}
                  </Button>
                  <Text size="sm" tone="secondary" className={cn("hidden sm:block font-inter font-medium transition-opacity duration-300", isDragging ? "opacity-0" : "opacity-100")}>
                    or press <kbd className="px-2 py-1 rounded-md bg-surface-2 border border-border-strong/50 font-mono text-xs ml-1 font-bold text-text-primary shadow-sm">⌘ O</kbd>
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Trust & Metadata Panel (Bento Style) */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6">
          {/* Bento Box 1: Privacy & Security */}
          <div className="flex-1 rounded-3xl bg-surface-1 border border-border-subtle p-8 shadow-sm flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 text-text-primary font-geist font-semibold text-xs mb-8 w-fit border border-border-subtle">
              <ShieldIcon className="size-3.5 text-brand-primary" /> Enterprise Grade
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0 text-brand-primary">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <div>
                  <Heading level={3} size="sm" className="font-geist font-bold mb-1 text-text-primary">AES-256 Encryption</Heading>
                  <Text size="sm" tone="secondary" className="font-inter leading-relaxed">Data is encrypted in transit and at rest using industry-leading protocols.</Text>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0 text-brand-primary">
                  <VaultIcon className="size-5" />
                </div>
                <div>
                  <Heading level={3} size="sm" className="font-geist font-bold mb-1 text-text-primary">Zero Data Retention</Heading>
                  <Text size="sm" tone="secondary" className="font-inter leading-relaxed">Files are wiped instantly from our processing servers after analysis.</Text>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bento Box 2: Specifications */}
          <div className="rounded-3xl bg-surface-2/50 border border-border-subtle p-8 shadow-sm">
            <Heading level={3} size="sm" className="font-geist font-bold mb-6 text-text-primary flex items-center gap-2">
              <InfoIcon className="size-4 text-text-tertiary" /> Specifications
            </Heading>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <Text size="xs" tone="secondary" className="font-inter uppercase tracking-wider font-semibold mb-1">Max Size</Text>
                <Text size="sm" className="font-geist font-medium text-text-primary">25 MB / file</Text>
              </div>
              <div>
                <Text size="xs" tone="secondary" className="font-inter uppercase tracking-wider font-semibold mb-1">Time to Parse</Text>
                <Text size="sm" className="font-geist font-medium text-text-primary">~1.2 seconds</Text>
              </div>
              <div className="col-span-2">
                <Text size="xs" tone="secondary" className="font-inter uppercase tracking-wider font-semibold mb-1">Supported Types</Text>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['PDF', 'DOCX', 'TXT', 'MP3', 'WAV', 'PNG', 'JPEG'].map(type => (
                    <span key={type} className="px-2 py-0.5 rounded bg-surface-1 border border-border-strong/50 text-[10px] font-mono font-bold text-text-secondary">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
