'use client';

import { useState, useCallback, useEffect, useActionState, useRef } from 'react';
import { Heading, Text, Button } from '@/shared/ui';
import { Dialog } from '@/shared/ui/components';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Camera, X, AlertTriangle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { UploadCloudIcon, ScanIcon, VaultIcon } from '@/shared/ui/icons/dashboard-icons';
import { InfoIcon, ShieldIcon, DocumentIcon } from '@/shared/ui/icons';
import { cn } from '@/shared/ui/cn';
import {
  analyzeDocumentAction,
  analyzeUrlAction,
} from '@/features/document-analysis/presentation/actions';
import { ScannerCamera } from '@/features/document-analysis/presentation/scanner-camera';
import { AudioUploader } from './audio-uploader';
import { VideoUploader } from './video-uploader';
import { SecurityBadges } from './security-badges';

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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the top of the dropzone so the tabs are visible below the header.
    const scrollTimer = setTimeout(() => {
      if (containerRef.current) {
        const y = containerRef.current.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({
          top: Math.max(0, y),
          behavior: 'smooth',
        });
      }
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
      if (
        result.error.code === 'FORBIDDEN' ||
        result.error.message?.toLowerCase().includes('quota') ||
        result.error.message?.toLowerCase().includes('plan')
      ) {
        setIsUpgradeModalOpen(true);
      } else {
        toast.error(result.error.message || 'Failed to process document. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (textState && !textState.ok && textState.error) {
      setTimeout(() => handleAnalysisResult(textState), 0);
    }
  }, [textState]);

  const [isCameraActive, setIsCameraActive] = useState(false);

  const executeUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const analysisFormData = new FormData();
      analysisFormData.append('file', file);
      analysisFormData.append('documentType', 'other');
      analysisFormData.append('title', file.name);

      const result = (await analyzeDocumentAction(null, analysisFormData)) as any;
      handleAnalysisResult(result);
      if (result && !result.ok) throw new Error('Analysis failed');
    } catch (e: any) {
      if (e?.message?.includes('NEXT_REDIRECT')) throw e;
      console.error(e);
      // We rely on handleAnalysisResult to show the specific error (if any)
      // but we throw so the caller (ScannerCamera) resets its state.
      throw e;
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
    const rejectedBinaryExtensions = [
      '.exe',
      '.zip',
      '.tar',
      '.gz',
      '.rar',
      '.7z',
      '.iso',
      '.dmg',
      '.bin',
      '.dll',
      '.so',
    ];

    // We allow a wide range, but must protect against raw application binaries
    if (
      rejectedBinaryExtensions.includes(ext) ||
      (!ext && file.type === 'application/octet-stream')
    ) {
      toast.error('Unsupported file format. Please upload a document, text file, or media file.');
      return;
    }

    if (file.size > MAX_COMPRESSIBLE_SIZE) {
      toast.error(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`,
      );
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
        const textIsMeaningful =
          extractedText.trim().length > 20 && letterCount / extractedText.trim().length > 0.4;

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
          toast.error(
            `Compressed file is still ${(compressed.size / 1024 / 1024).toFixed(1)} MB — try a smaller or simpler file.`,
          );
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

          const result = (await analyzeDocumentAction(null, analysisFormData)) as any;
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
        result = (await analyzeUrlAction(null, formData)) as any;
      } else {
        const formData = new FormData();
        formData.append('text', input);
        formData.append('documentType', 'other');
        formData.append('title', 'Text Snippet');
        result = (await analyzeDocumentAction(null, formData)) as any;
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
    <div className="flex h-full w-full flex-col" ref={containerRef}>
      <Dialog
        size="xl"
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title=""
      >
        <div className="flex flex-col gap-4 px-2 py-2">
          {/* CRO: Loss Aversion & Urgency */}
          <div className="mb-2 px-4 text-center">
            <h2 className="font-geist mb-2 text-2xl font-black tracking-tight text-text-primary md:text-3xl">
              Don't lose your momentum
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-text-secondary">
              Your document is waiting to be analyzed, but you've exhausted your free scans.
              <strong className="font-semibold text-text-primary">
                {' '}
                Upgrade now to instantly unlock deep AI extraction and uncover hidden liabilities
                before it's too late.
              </strong>
            </p>
          </div>

          {/* CRO: Forced Binary Choice & Contrast (Decoy Effect applied to Enterprise) */}
          <div className="mt-2 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
            {/* Pro Tier (The No-Brainer) */}
            <div className="relative flex transform flex-col overflow-hidden rounded-3xl border-[3px] border-brand-primary bg-surface-2 p-6 shadow-[0_0_40px_-10px_rgba(var(--brand-primary-rgb),0.4)] md:-translate-y-2 md:p-8">
              <div className="absolute top-0 right-0 rounded-bl-xl bg-brand-primary px-4 py-1.5 text-[10px] font-black tracking-widest text-brand-ink uppercase shadow-lg">
                Most Popular
              </div>
              <div className="pointer-events-none absolute top-0 left-0 -z-10 h-32 w-full bg-gradient-to-b from-brand-primary/15 to-transparent" />

              <h3 className="text-xl font-black text-text-primary">Professional</h3>
              <p className="mt-1 min-h-[20px] text-xs text-text-secondary">
                Immediate, unmetered AI intelligence.
              </p>

              <div className="my-4 flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-text-primary">$29</span>
                <span className="text-xs font-semibold text-text-tertiary">/ month</span>
              </div>

              <Button
                variant="premium"
                className="group w-full scale-100 py-5 text-sm font-black shadow-[0_0_25px_-5px_rgba(var(--brand-primary-rgb),0.6)] transition-transform hover:scale-[1.02] active:scale-95"
                onClick={() => router.push('/billing')}
              >
                Upgrade & Resume Scan{' '}
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Button>

              <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-brand-primary/20 pt-6">
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <span>
                    <strong className="font-bold">500 Scans</strong> per month
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <span>
                    <strong className="font-bold">Instant ROI:</strong> Multi-page AI extraction
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <span>
                    <strong className="font-bold">Priority</strong> background processing
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-text-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <span>
                    <strong className="font-bold">Permanent</strong> encrypted vault storage
                  </span>
                </li>
              </ul>
            </div>

            {/* Enterprise Tier (The Anchor/Decoy) */}
            <div className="flex flex-col rounded-3xl border border-border-strong bg-surface-1 p-6 opacity-70 transition-opacity hover:opacity-100 md:p-8">
              <h3 className="text-lg font-bold text-text-primary">Enterprise</h3>
              <p className="mt-1 min-h-[20px] text-xs text-text-secondary">
                Custom deployment for legal teams.
              </p>

              <div className="my-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-text-primary">
                  Custom
                </span>
              </div>

              <Button
                variant="secondary"
                className="w-full border-border-strong py-5 text-sm font-bold hover:bg-surface-2"
                onClick={() => router.push('/contact')}
              >
                Contact Sales
              </Button>

              <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-border-subtle/50 pt-6 text-text-secondary">
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
                  Unlimited organizational scans
                </li>
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
                  Dedicated Account Manager
                </li>
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
                  On-Premise / VPC Deployment
                </li>
                <li className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
                  Custom compliance models
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center border-t border-border-subtle/50 pt-4">
            <p className="text-[10px] font-semibold tracking-widest text-text-tertiary uppercase">
              100% secure • AES-256 Encryption • Cancel anytime
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isModalOpen}
        onClose={() => {
          if (!isCompressing) {
            setIsModalOpen(false);
            setOversizedFile(null);
          }
        }}
        dismissOnBackdropClick={!isCompressing}
        title="File Too Large"
        description={
          oversizedFile
            ? `The file you selected is ${(oversizedFile.size / 1024 / 1024).toFixed(1)} MB, which exceeds the 4.5 MB upload limit. ${oversizedFile.type === 'application/pdf' ? 'We will extract the text locally before uploading to save bandwidth.' : 'We can securely compress this image for you right now.'}`
            : ''
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setOversizedFile(null);
              }}
              disabled={isCompressing}
            >
              Cancel
            </Button>
            <Button variant="premium" onClick={handleCompressAndScan} loading={isCompressing}>
              {isCompressing
                ? oversizedFile?.type === 'application/pdf'
                  ? `Extracting (${compressionPct}%)`
                  : `Compressing (${compressionPct}%)`
                : oversizedFile?.type === 'application/pdf'
                  ? 'Extract & Continue'
                  : 'Compress & Continue'}
            </Button>
          </>
        }
      >
        {isCompressing && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-text-secondary">
              <span>
                {oversizedFile?.type === 'application/pdf'
                  ? 'Extracting text...'
                  : 'Compressing...'}
              </span>
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
      <div className="scrollbar-hide mb-6 flex w-full justify-start overflow-x-auto pb-2 sm:mb-8 sm:pb-0 md:justify-center">
        <div className="inline-flex min-w-max items-center rounded-2xl border border-border-subtle bg-surface-2/80 p-1.5 shadow-inner backdrop-blur-md md:mx-auto">
          {[
            { id: 'document', label: 'Upload', icon: <DocumentIcon className="size-4 shrink-0" /> },
            { id: 'url', label: 'URL / Text', icon: <ScanIcon className="size-4 shrink-0" /> },
            {
              id: 'audio',
              label: 'Audio',
              icon: (
                <svg
                  className="size-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              ),
            },
            {
              id: 'video',
              label: 'Video',
              icon: (
                <svg
                  className="size-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect height="14" rx="2" ry="2" width="15" x="1" y="5" />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 outline-none sm:px-5 sm:text-sm',
                activeTab === tab.id
                  ? 'border border-border-strong bg-surface-1 text-brand-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                  : 'border border-transparent text-text-secondary hover:bg-surface-2/50 hover:text-text-primary',
              )}
            >
              <span
                className={cn(
                  'transition-colors',
                  activeTab === tab.id ? 'text-brand-primary' : 'text-text-tertiary',
                )}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Linear Stack matching clearcut-app */}
      <div className="mx-auto flex w-full flex-col gap-6">
        {/* Active Tab Content Area */}
        <div
          className={cn(
            'group relative flex flex-col overflow-hidden rounded-3xl p-4 transition-all duration-400 sm:p-10 lg:p-12',
            activeTab === 'url'
              ? 'min-h-[50vh] border border-brand-primary/20 bg-brand-primary/[0.02] shadow-sm sm:min-h-[65vh]'
              : activeTab === 'video' || activeTab === 'audio'
                ? 'min-h-[50vh] border border-brand-primary/20 bg-brand-primary/[0.02] p-0 shadow-sm sm:min-h-[65vh] sm:p-0 lg:p-0'
                : isDragging
                  ? 'min-h-[50vh] scale-[1.005] border-2 border-brand-primary bg-brand-primary/[0.04] shadow-[0_0_60px_-15px_rgba(37,99,235,0.15)] sm:min-h-[70vh]'
                  : 'min-h-[50vh] border border-brand-primary/20 bg-brand-primary/[0.02] shadow-sm hover:border-brand-primary/40 hover:shadow-md sm:min-h-[70vh]',
          )}
          onDragOver={activeTab !== 'url' ? onDragOver : undefined}
          onDragLeave={activeTab !== 'url' ? onDragLeave : undefined}
          onDrop={activeTab !== 'url' ? onDrop : undefined}
        >
          {/* Ambient Glow for Drag State */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/5 transition-opacity duration-500',
              isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
            )}
          />

          {activeTab === 'url' ? (
            <div key="url" className="relative z-10 flex h-full w-full animate-fade-in-up flex-col">
              <div className="mt-2 mb-6 flex items-center gap-4">
                <div className="inline-flex size-12 items-center justify-center rounded-xl border border-border-subtle bg-surface-1 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                  <svg
                    className="size-5 text-brand-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="21" x2="3" y1="6" y2="6" />
                    <line x1="15" x2="3" y1="12" y2="12" />
                    <line x1="17" x2="3" y1="18" y2="18" />
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <Heading
                    level={2}
                    size="md"
                    className="font-geist mb-0.5 font-bold tracking-tight text-text-primary"
                  >
                    Analyze Text or URL
                  </Heading>
                  <Text size="sm" tone="secondary" className="font-inter">
                    Paste any document text or a public web link below.
                  </Text>
                </div>
              </div>

              <div className="group/input relative flex min-h-[320px] w-full flex-1 flex-col gap-4 sm:min-h-[280px]">
                <div className="relative flex flex-1 flex-col rounded-2xl border border-border-strong/50 bg-surface-1 shadow-sm transition-all duration-300 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20">
                  <textarea
                    required
                    maxLength={200000}
                    placeholder={
                      'Paste a URL — https://example.com/privacy\n\nor paste the document text directly...'
                    }
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isAnalyzing}
                    className="font-inter h-full w-full flex-1 resize-none rounded-2xl border-none bg-transparent px-4 pt-4 pb-8 text-sm text-text-primary outline-none placeholder:text-text-tertiary sm:text-base"
                  />
                  <div className="pointer-events-none absolute right-3 bottom-2.5 select-none">
                    <span
                      className={cn(
                        'text-[10px] font-medium transition-colors',
                        urlInput.length >= 200000
                          ? 'text-destructive'
                          : urlInput.length > 180000
                            ? 'text-warning'
                            : 'text-text-tertiary',
                      )}
                    >
                      {urlInput.length.toLocaleString()} / 200,000
                    </span>
                  </div>
                </div>

                <Button
                  variant="premium"
                  className="h-12 w-full rounded-xl font-semibold shadow-lg shadow-brand-primary/20 transition-all duration-300"
                  loading={isAnalyzing}
                  onClick={() => handleUrlAnalyze()}
                  disabled={!urlInput.trim() || isAnalyzing}
                >
                  <svg
                    className="mr-2 size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="21" x2="3" y1="6" y2="6" />
                    <line x1="15" x2="3" y1="12" y2="12" />
                    <line x1="17" x2="3" y1="18" y2="18" />
                  </svg>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Text / URL'}
                </Button>
              </div>
            </div>
          ) : activeTab === 'video' ? (
            <div
              key="video"
              className="relative z-10 flex h-full w-full animate-fade-in-up flex-col items-center justify-center text-center"
            >
              <VideoUploader
                onFileReady={async (file) => {
                  await executeUpload(file);
                }}
                disabled={isUploading}
              />
            </div>
          ) : activeTab === 'audio' ? (
            <div
              key="audio"
              className="relative z-10 flex h-full w-full animate-fade-in-up flex-col items-center justify-center text-center"
            >
              <AudioUploader
                onFileReady={async (file) => {
                  await executeUpload(file);
                }}
                disabled={isUploading}
              />
            </div>
          ) : (
            <div
              key="default"
              className="relative z-10 flex h-full w-full animate-fade-in-up flex-col items-center justify-center"
            >
              <ScannerCamera
                onResult={handleAnalysisResult}
                onFileReady={executeUpload}
                onScanningChange={setIsUploading}
                disabled={isUploading}
              />
            </div>
          )}
        </div>

        {/* -- Bottom Utilities Area -- */}

        {/* Supported formats strip */}
        <div className="rounded-2xl border border-border-subtle bg-surface-2/30 px-4 py-4 sm:px-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <span className="text-[11px] font-bold tracking-widest whitespace-nowrap text-text-tertiary uppercase">
                Supported
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-[13px] font-medium text-text-secondary sm:text-xs">
                <span className="flex items-center gap-1.5">
                  <DocumentIcon className="h-3.5 w-3.5 text-text-tertiary" /> PDF, DOCX, TXT
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="h-3.5 w-3.5 text-text-tertiary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  Images
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="h-3.5 w-3.5 text-text-tertiary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M3 15h18" />
                    <path d="M9 3v18" />
                    <path d="M15 3v18" />
                  </svg>
                  CSV, Excel
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="h-3.5 w-3.5 text-text-tertiary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  Audio &amp; Video
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-1 px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap text-text-secondary shadow-sm">
                <svg
                  className="h-3 w-3 text-brand-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Max 10 MB
              </span>
            </div>
          </div>
        </div>

        {/* Security Badges */}
        <SecurityBadges className="mt-2" />

        <p className="mx-auto mt-2 max-w-sm text-center text-[10px] text-text-tertiary/70">
          By uploading a document, you agree to our{' '}
          <a href="/terms" className="underline transition-colors hover:text-text-primary">
            Terms of Service
          </a>{' '}
          and acknowledge our{' '}
          <a href="/privacy" className="underline transition-colors hover:text-text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
