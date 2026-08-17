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
        behavior: 'smooth',
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
    <div className="flex h-full w-full flex-col">
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
      <div className="mb-8 flex items-center justify-center sm:justify-start">
        <div className="inline-flex items-center rounded-2xl border border-brand-primary/10 bg-brand-primary/[0.03] p-1.5 shadow-inner backdrop-blur-md">
          {[
            { id: 'document', label: 'Upload', icon: <DocumentIcon className="size-4" /> },
            { id: 'link', label: 'URL', icon: <ScanIcon className="size-4" /> },
            {
              id: 'text',
              label: 'Text',
              icon: (
                <svg
                  className="size-4"
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
              ),
            },
            {
              id: 'audio',
              label: 'Audio',
              icon: (
                <svg
                  className="size-4"
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
                  className="size-4"
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
                'relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 outline-none',
                activeTab === tab.id
                  ? 'border border-brand-primary/20 bg-brand-primary/10 text-brand-primary shadow-sm ring-1 ring-brand-primary/10'
                  : 'border border-transparent text-text-secondary hover:bg-brand-primary/5 hover:text-brand-primary/80',
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

      {/* Main Layout: Asymmetric Split Grid */}
      <div className="flex min-h-[520px] w-full flex-col gap-8 lg:flex-row">
        {/* Left Side: Omni-Drop Vault (Premium Focus) */}
        <div
          className={cn(
            'group relative flex flex-1 flex-col overflow-hidden rounded-3xl p-10 transition-all duration-400 sm:p-14',
            activeTab === 'link'
              ? 'border border-brand-primary/20 bg-brand-primary/[0.02] shadow-sm'
              : isDragging
                ? 'scale-[1.005] border-2 border-brand-primary bg-brand-primary/[0.04] shadow-[0_0_60px_-15px_rgba(37,99,235,0.15)]'
                : 'border border-brand-primary/20 bg-brand-primary/[0.02] shadow-sm hover:border-brand-primary/40 hover:shadow-md',
          )}
          onDragOver={activeTab !== 'link' ? onDragOver : undefined}
          onDragLeave={activeTab !== 'link' ? onDragLeave : undefined}
          onDrop={activeTab !== 'link' ? onDrop : undefined}
        >
          {/* Ambient Glow for Drag State */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/5 transition-opacity duration-500',
              isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
            )}
          />

          {activeTab === 'text' ? (
            <div
              key="text"
              className="relative z-10 flex h-full w-full animate-fade-in-up flex-col"
            >
              <div className="mt-2 mb-8 flex items-center gap-4">
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
                    Paste Raw Text
                  </Heading>
                  <Text size="sm" tone="secondary" className="font-inter">
                    Instantly scan raw clauses, paragraphs, or entire policy documents.
                  </Text>
                </div>
              </div>

              <form
                action={textFormAction}
                className="group/input relative min-h-[240px] w-full flex-1"
              >
                {textState && !textState.ok && textState.error && !textState.error.fieldErrors && (
                  <div className="absolute -top-12 right-0 left-0 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                    {textState.error.messageKey}
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-brand-primary/5 opacity-0 blur-xl transition-opacity duration-500 group-focus-within/input:opacity-100" />
                <div className="relative flex h-full flex-col rounded-2xl border border-border-strong/50 bg-surface-1 p-1.5 shadow-sm transition-all duration-300 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20">
                  <textarea
                    name="text"
                    required
                    placeholder="Paste your contract clauses or text here..."
                    className="font-inter w-full flex-1 resize-none border-none bg-transparent px-4 py-4 text-base text-text-primary outline-none placeholder:text-text-tertiary"
                  />
                  <input type="hidden" name="documentType" value="other" />
                  <div className="flex items-center justify-between border-t border-border-subtle/50 px-4 py-3">
                    <span className="text-xs font-semibold tracking-wider text-text-tertiary uppercase">
                      Text Analysis Engine
                    </span>
                    <Button type="submit" variant="premium" loading={isTextPending}>
                      {isTextPending ? 'Analyzing...' : 'Analyze Text'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          ) : activeTab === 'link' ? (
            <div
              key="link"
              className="relative z-10 mx-auto flex h-full w-full max-w-3xl animate-fade-in-up flex-col items-center justify-center text-center"
            >
              <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-1 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                <ScanIcon className="size-6 text-brand-primary" />
              </div>
              <Heading
                level={2}
                size="md"
                className="font-geist mb-3 font-bold tracking-tight text-text-primary"
              >
                Analyze a Web Link
              </Heading>
              <Text size="md" tone="secondary" className="font-inter mb-10 max-w-lg">
                Paste a URL to a privacy policy, terms of service, or any public document. Our
                engine will fetch and parse it instantly.
              </Text>

              <div className="group/input relative mb-8 w-full">
                <div className="absolute inset-0 rounded-full bg-brand-primary/5 opacity-0 blur-xl transition-opacity duration-500 group-focus-within/input:opacity-100" />
                <div className="relative flex items-center rounded-full border border-border-strong/50 bg-surface-1 p-1.5 shadow-sm transition-all duration-300 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20 hover:border-border-strong">
                  <div className="pl-5 text-text-tertiary">
                    <svg
                      className="size-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/terms"
                    className="font-inter flex-1 border-none bg-transparent px-4 py-3 text-base text-text-primary outline-none placeholder:text-text-tertiary"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isAnalyzing}
                  />
                  <Button
                    variant="premium"
                    className="h-11 rounded-full px-6"
                    onClick={() => handleUrlAnalyze()}
                    disabled={!urlInput.trim() || isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="mr-2 text-xs font-semibold tracking-wider text-text-tertiary uppercase">
                  Quick Try:
                </span>
                {[
                  { label: 'OpenAI Privacy', icon: '🔒' },
                  { label: 'Stripe Terms', icon: '💳' },
                  { label: 'GitHub SLA', icon: '🐙' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-raised hover:text-text-primary"
                  >
                    <span>{chip.icon}</span> {chip.label}
                  </button>
                ))}
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

        {/* Right Side: Trust & Metadata Panel (Bento Style) */}
        <div className="flex w-full flex-col gap-6 lg:w-[380px]">
          {/* Bento Box 1: Privacy & Security */}
          <div className="flex flex-1 flex-col justify-center rounded-3xl border border-border-subtle bg-surface-1 p-8 shadow-sm">
            <div className="font-geist mb-8 inline-flex w-fit items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text-primary">
              <ShieldIcon className="size-3.5 text-brand-primary" /> Enterprise Grade
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0 text-brand-primary">
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <Heading
                    level={3}
                    size="sm"
                    className="font-geist mb-1 font-bold text-text-primary"
                  >
                    AES-256 Encryption
                  </Heading>
                  <Text size="sm" tone="secondary" className="font-inter leading-relaxed">
                    Data is encrypted in transit and at rest using industry-leading protocols.
                  </Text>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0 text-brand-primary">
                  <VaultIcon className="size-5" />
                </div>
                <div>
                  <Heading
                    level={3}
                    size="sm"
                    className="font-geist mb-1 font-bold text-text-primary"
                  >
                    Zero Data Retention
                  </Heading>
                  <Text size="sm" tone="secondary" className="font-inter leading-relaxed">
                    Files are wiped instantly from our processing servers after analysis.
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Box 2: Specifications */}
          <div className="rounded-3xl border border-border-subtle bg-surface-2/50 p-8 shadow-sm">
            <Heading
              level={3}
              size="sm"
              className="font-geist mb-6 flex items-center gap-2 font-bold text-text-primary"
            >
              <InfoIcon className="size-4 text-text-tertiary" /> Specifications
            </Heading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <Text
                  size="xs"
                  tone="secondary"
                  className="font-inter mb-1 font-semibold tracking-wider uppercase"
                >
                  Max Size
                </Text>
                <Text size="sm" className="font-geist font-medium text-text-primary">
                  25 MB / file
                </Text>
              </div>
              <div>
                <Text
                  size="xs"
                  tone="secondary"
                  className="font-inter mb-1 font-semibold tracking-wider uppercase"
                >
                  Time to Parse
                </Text>
                <Text size="sm" className="font-geist font-medium text-text-primary">
                  ~1.2 seconds
                </Text>
              </div>
              <div className="col-span-2">
                <Text
                  size="xs"
                  tone="secondary"
                  className="font-inter mb-1 font-semibold tracking-wider uppercase"
                >
                  Supported Types
                </Text>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['PDF', 'DOCX', 'TXT', 'MP3', 'WAV', 'PNG', 'JPEG'].map((type) => (
                    <span
                      key={type}
                      className="rounded border border-border-strong/50 bg-surface-1 px-2 py-0.5 font-mono text-[10px] font-bold text-text-secondary"
                    >
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
