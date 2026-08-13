'use client';

import { useState, useCallback, useEffect, useActionState, useRef } from 'react';
import { Heading, Text, Button } from '@/shared/ui';
import { Dialog } from '@/shared/ui/components';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { UploadCloudIcon, ScanIcon, VaultIcon } from '@/shared/ui/icons/dashboard-icons';
import { InfoIcon, ShieldIcon, DocumentIcon } from '@/shared/ui/icons';
import { cn } from '@/shared/ui/cn';
import { analyzeDocumentAction, analyzeUrlAction } from '@/features/document-analysis/presentation/actions';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024;
const MAX_COMPRESSIBLE_SIZE = 10 * 1024 * 1024;

export function OmniDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('document');
  const [textState, textFormAction, isTextPending] = useActionState(analyzeDocumentAction, null);
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [oversizedFile, setOversizedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionPct, setCompressionPct] = useState(0);

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

  const handleAnalysisResult = (result: any) => {
    if (result && !result.ok && result.error) {
      if (result.error.code === 'FORBIDDEN' || result.error.message?.toLowerCase().includes('quota') || result.error.message?.toLowerCase().includes('plan')) {
        setIsUpgradeModalOpen(true);
      } else {
        toast.error(result.error.message || 'Failed to process document. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (textState && !textState.ok && textState.error) {
      handleAnalysisResult(textState);
    }
  }, [textState]);

  const executeUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const analysisFormData = new FormData();
      analysisFormData.append('file', file);
      analysisFormData.append('documentType', 'other');
      analysisFormData.append('title', file.name);
      
      const result = await analyzeDocumentAction(null, analysisFormData) as any;
      handleAnalysisResult(result);
    } catch (e: any) {
      if (e?.message?.includes('NEXT_REDIRECT')) throw e;
      console.error(e);
      toast.error('Failed to process document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    // Extract file extension safely
    const extMatch = file.name.match(/\.[0-9a-z]+$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';
    
    // Explicitly reject known problematic binaries that aren't text/media
    const rejectedBinaryExtensions = ['.exe', '.zip', '.tar', '.gz', '.rar', '.7z', '.iso', '.dmg', '.bin', '.dll', '.so'];
    
    // We allow a wide range, but must protect against raw application binaries
    if (rejectedBinaryExtensions.includes(ext) || (!ext && file.type === 'application/octet-stream')) {
      toast.error('Unsupported file format. Please upload a document, text file, or media file.');
      return;
    }

    if (file.size > MAX_COMPRESSIBLE_SIZE) {
      toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setOversizedFile(file);
      setCompressionPct(0);
      setIsModalOpen(true);
      return;
    }

    await executeUpload(file);
  };

  const handleCompressAndScan = async () => {
    if (!oversizedFile) return;
    setIsCompressing(true);
    setCompressionPct(0);
    try {
      let compressed: File | null = null;
      let extractedText: string | null = null;
      const onProgress = (pct: number) => setCompressionPct(pct);

      if (oversizedFile.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        
        const data = await oversizedFile.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
          onProgress(Math.round((i / pdfDoc.numPages) * 100));
        }
        
        extractedText = fullText.trim();
        
        // HEURISTIC
        const letterCount = (extractedText.match(/\p{L}/gu) ?? []).length;
        const textIsMeaningful = extractedText.trim().length > 20 && letterCount / extractedText.trim().length > 0.4;
        
        if (!textIsMeaningful) {
          // If the text is garbage or empty, it's likely a scanned PDF. 
          // We MUST compress it visually (flattening to JPEGs) to bypass the 4.5MB limit 
          // while preserving visual data for Gemini Vision.
          extractedText = null;
          
          const { compressPdf } = await import('@/features/document-analysis/application');
          compressed = await compressPdf(oversizedFile, {
            targetBytes: MAX_FILE_SIZE,
            onProgress,
          });
        }
      } else {
        const { default: imageCompression } = await import('browser-image-compression');
        compressed = await imageCompression(oversizedFile, {
          maxSizeMB: 4,
          maxWidthOrHeight: 2048,
          initialQuality: 0.7,
          useWebWorker: true,
          onProgress,
        });
      }

      setIsModalOpen(false);
      setOversizedFile(null);
      setIsCompressing(false);
      setCompressionPct(0);

      if (compressed) {
        if (compressed.size > MAX_FILE_SIZE) {
          toast.error(`Compressed file is still ${(compressed.size / 1024 / 1024).toFixed(1)} MB — try a smaller or simpler file.`);
          return;
        }
        await executeUpload(compressed);
        setIsModalOpen(false);
        setOversizedFile(null);
        setIsCompressing(false);
        setCompressionPct(0);
      } else if (extractedText) {
        setIsUploading(true);
        try {
          const analysisFormData = new FormData();
          analysisFormData.append('text', extractedText);
          analysisFormData.append('documentType', 'other');
          analysisFormData.append('title', oversizedFile.name);
          
          const result = await analyzeDocumentAction(null, analysisFormData) as any;
          setIsModalOpen(false);
          setOversizedFile(null);
          handleAnalysisResult(result);
        } catch (e: any) {
          if (e?.message?.includes('NEXT_REDIRECT')) throw e;
          console.error(e);
          toast.error('Failed to process document. Please try again.');
        } finally {
          setIsUploading(false);
          setIsCompressing(false);
          setCompressionPct(0);
        }
      }
    } catch (err) {
      console.error('Compression failed:', err);
      setIsCompressing(false);
      setCompressionPct(0);
      toast.error('Processing failed. Please try selecting a different file.');
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) processFile(file);
    }
  };

  // URL analysis handler
  const handleUrlAnalyze = async (overrideText?: string) => {
    const input = (overrideText ?? urlInput).trim();
    if (!input) return;
    setIsAnalyzing(true);
    const isUrl = /^https?:\/\//i.test(input);
    try {
      let result;
      if (isUrl) {
        const formData = new FormData();
        formData.append('url', input);
        result = await analyzeUrlAction(null, formData) as any;
      } else {
        const formData = new FormData();
        formData.append('text', input);
        formData.append('documentType', 'other');
        formData.append('title', 'Text Snippet');
        result = await analyzeDocumentAction(null, formData) as any;
      }
      handleAnalysisResult(result);
    } catch (e: any) {
      if (e?.message?.includes('NEXT_REDIRECT')) {
        // Redirection error is expected and handled by Next.js
        throw e;
      }
      toast.error('Analysis failed. Please check the input and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Dialog
        size="xl"
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title=""
      >
        <div className="flex flex-col gap-4 py-2 px-2">
          {/* CRO: Loss Aversion & Urgency */}
          <div className="text-center mb-2 px-4">
            <h2 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight font-geist mb-2">Don't lose your momentum</h2>
            <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Your document is waiting to be analyzed, but you've exhausted your free scans. 
              <strong className="text-text-primary font-semibold"> Upgrade now to instantly unlock deep AI extraction and uncover hidden liabilities before it's too late.</strong>
            </p>
          </div>
          
          {/* CRO: Forced Binary Choice & Contrast (Decoy Effect applied to Enterprise) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mt-2">
            {/* Pro Tier (The No-Brainer) */}
            <div className="flex flex-col rounded-3xl border-[3px] border-brand-primary bg-surface-2 p-6 md:p-8 relative shadow-[0_0_40px_-10px_rgba(var(--brand-primary-rgb),0.4)] transform md:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-primary text-brand-ink text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest shadow-lg">Most Popular</div>
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/15 to-transparent pointer-events-none -z-10" />
              
              <h3 className="text-xl font-black text-text-primary">Professional</h3>
              <p className="text-xs text-text-secondary mt-1 min-h-[20px]">Immediate, unmetered AI intelligence.</p>
              
              <div className="my-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-text-primary tracking-tighter">$29</span>
                <span className="text-xs font-semibold text-text-tertiary">/ month</span>
              </div>
              
              <Button variant="premium" className="w-full shadow-[0_0_25px_-5px_rgba(var(--brand-primary-rgb),0.6)] py-5 text-sm font-black scale-100 transition-transform hover:scale-[1.02] active:scale-95 group" onClick={() => router.push('/billing')}>
                Upgrade & Resume Scan <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
              
              <ul className="flex flex-col gap-3 mt-6 pt-6 border-t border-brand-primary/20 flex-1">
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" /> 
                  <span><strong className="font-bold">500 Scans</strong> per month</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" /> 
                  <span><strong className="font-bold">Instant ROI:</strong> Multi-page AI extraction</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" /> 
                  <span><strong className="font-bold">Priority</strong> background processing</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" /> 
                  <span><strong className="font-bold">Permanent</strong> encrypted vault storage</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Tier (The Anchor/Decoy) */}
            <div className="flex flex-col rounded-3xl border border-border-strong bg-surface-1 p-6 md:p-8 opacity-70 transition-opacity hover:opacity-100">
              <h3 className="text-lg font-bold text-text-primary">Enterprise</h3>
              <p className="text-xs text-text-secondary mt-1 min-h-[20px]">Custom deployment for legal teams.</p>
              
              <div className="my-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-text-primary tracking-tight">Custom</span>
              </div>
              
              <Button variant="secondary" className="w-full py-5 text-sm font-bold border-border-strong hover:bg-surface-2" onClick={() => router.push('/contact')}>
                Contact Sales
              </Button>
              
              <ul className="flex flex-col gap-3 mt-6 pt-6 border-t border-border-subtle/50 flex-1 text-text-secondary">
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" /> 
                  Unlimited organizational scans
                </li>
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" /> 
                  Dedicated Account Manager
                </li>
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" /> 
                  On-Premise / VPC Deployment
                </li>
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" /> 
                  Custom compliance models
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border-subtle/50 flex flex-col items-center justify-center">
            <p className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase">
              100% secure • AES-256 Encryption • Cancel anytime
            </p>
          </div>
        </div>
      </Dialog>
      
      <Dialog
        open={isModalOpen}
        onClose={() => { if (!isCompressing) { setIsModalOpen(false); setOversizedFile(null); } }}
        dismissOnBackdropClick={!isCompressing}
        title="File Too Large"
        description={oversizedFile ? `The file you selected is ${(oversizedFile.size / 1024 / 1024).toFixed(1)} MB, which exceeds the 4.5 MB upload limit. ${oversizedFile.type === 'application/pdf' ? "We will extract the text locally before uploading to save bandwidth." : "We can securely compress this image for you right now."}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsModalOpen(false); setOversizedFile(null); }} disabled={isCompressing}>Cancel</Button>
            <Button variant="premium" onClick={handleCompressAndScan} loading={isCompressing}>
              {isCompressing 
                ? oversizedFile?.type === 'application/pdf' ? `Extracting (${compressionPct}%)` : `Compressing (${compressionPct}%)` 
                : oversizedFile?.type === 'application/pdf' ? 'Extract & Continue' : 'Compress & Continue'}
            </Button>
          </>
        }
      >
        {isCompressing && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-text-secondary">
              <span>{oversizedFile?.type === 'application/pdf' ? 'Extracting text...' : 'Compressing...'}</span>
              <span>{compressionPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-300 ease-out"
                style={{ width: `${compressionPct}%` }}
              />
            </div>
          </div>
        )}
      </Dialog>
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
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                "w-full max-w-3xl flex flex-col items-center justify-center p-12 sm:p-16 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
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
                    : "We natively support PDFs, Docs, Media, Code, and Config logs. Our engine will auto-route it."}
                </Text>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={onFileChange} 
                  accept=".pdf,.docx,.rtf,.md,.txt,.csv,.tsv,.xlsx,.xls,.json,.jpeg,.jpg,.png,.webp,.heic,.heif,.gif,.bmp,.tiff,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.opus,.mp4,.mov,.avi,.mkv,.js,.ts,.css,.html,.py,.go,.rs,.java,.cpp,.cs,.php,.rb,.swift,.kt,.sh,.sql,.xml,.yml,.yaml,.toml,.ini,.conf,.env,.log"
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
