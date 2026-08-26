'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
function isNextRedirect(error: any): boolean {
  if (!error) return false;
  return error.message?.includes('NEXT_REDIRECT') || error.digest?.includes('NEXT_REDIRECT');
}
import type { DocumentAnalysis } from '@/features/document-analysis/domain';
// Allowed extensions and MIME types
export const INPUT_ACCEPT =
  '.pdf,.docx,.rtf,.md,.txt,.csv,.tsv,.xlsx,.xls,.json,.jpeg,.jpg,.png,.webp,.heic,.heif,.gif,.bmp,.tiff,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.opus,.mp4,.mov,.avi,.mkv,.js,.ts,.css,.html,.py,.go,.rs,.java,.cpp,.cs,.php,.rb,.swift,.kt,.sh,.sql,.xml,.yml,.yaml,.toml,.ini,.conf,.env,.log,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,image/bmp,image/tiff,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/markdown,text/plain,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/json,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/flac,audio/webm,audio/opus,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,application/javascript,video/mp2t,text/css,text/html,text/x-python,text/x-go,text/rust,text/x-java-source,text/x-c,text/x-csharp,application/x-php,text/x-ruby,text/x-swift,text/x-kotlin,application/x-sh,application/sql,application/xml,text/yaml,application/toml,text/x-ini,text/x-properties,text/x-env,text/x-log';

export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}

export function isAccepted(file: File): boolean {
  return true; // We do more specific validation later if needed
}
import imageCompression from 'browser-image-compression';
import {
  Camera,
  Upload,
  RotateCcw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  X,
  ScanLine,
  ShieldCheck,
  FileUp,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import { Dialog } from '@/shared/ui/components';
import { toast } from 'sonner';
import { cn } from '@/shared/ui/cn';

// Simple base64 conversion utilities
function canvasToBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return dataUrl.split(',')[1] || '';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = (error) => reject(error);
  });
}

// --- Types -------------------------------------------------------------------

type ScanMode = 'idle' | 'camera' | 'preview' | 'uploading' | 'loading' | 'done' | 'error';

interface ScannerCameraProps {
  onResult: (result: DocumentAnalysis) => void;
  /**
   * When provided, file-pick and drag-and-drop immediately call this handler
   * instead of entering the preview → analyze flow.
   * The parent is responsible for showing success/error toasts.
   * Throwing inside this function transitions the component to its error state.
   */
  onFileReady?: (file: File) => Promise<void>;
  /** Called whenever the scanning/uploading state changes */
  onScanningChange?: (isScanning: boolean) => void;
  /** Extra class names applied to the outer wrapper */
  className?: string;
  /** When true, the scanner is locked — all interactions are disabled */
  disabled?: boolean;
}

// --- Constants ----------------------------------------------------------------

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB — soft limit; above this we compress images before upload
const MAX_COMPRESSIBLE_SIZE = 50 * 1024 * 1024; // 50 MB — hard limit for FastAPI backend

// --- Helpers ------------------------------------------------------------------

/** Returns an error string if the file type is unsupported, else null. */
function validateFileType(file: File): string | null {
  if (isAudioFile(file)) {
    return 'Audio files belong in the Audio tab — switch tabs to analyse your recording.';
  }
  if (!isAccepted(file)) {
    return 'Invalid format. Upload a PDF, Word doc, Excel sheet, image, or text file.';
  }
  return null;
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

// ���-- Component ----------------------------------------------------------------

export function ScannerCamera({
  onResult,
  onFileReady,
  onScanningChange,
  className,
  disabled = false,
}: ScannerCameraProps) {
  const uploadPhases = [
    'Initializing',
    'Uploading',
    'Extracting Text',
    'Analyzing',
    'Finishing up',
  ];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<ScanMode>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Compression modal state
  const [oversizedFile, setOversizedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionPct, setCompressionPct] = useState(0);

  // Cycle through phase messages while uploading
  useEffect(() => {
    if (mode !== 'uploading') {
      setTimeout(() => setPhaseIdx(0), 0);
      return;
    }
    const timers = uploadPhases
      .slice(1)
      .map((_, i) => setTimeout(() => setPhaseIdx(i + 1), (i + 1) * 3200));
    return () => timers.forEach(clearTimeout);
  }, [mode]); // uploadPhases is stable per session (locale-derived)

  // Notify parent when scanning/uploading starts or stops
  useEffect(() => {
    onScanningChange?.(mode === 'uploading' || mode === 'loading');
  }, [mode]);

  // -- Camera lifecycle ------------------------------------------------------

  const startCamera = useCallback(async () => {
    setMode('camera');
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Camera access denied.');
      setMode('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // -- Capture ---------------------------------------------------------------

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64 = canvasToBase64(canvas);
    stopCamera();
    setCapturedImage(`data:image/jpeg;base64,${base64}`);
    setCapturedBase64(base64);
    setMode('preview');
  }, [stopCamera]);

  // -- File processing -------------------------------------------------------
  //
  // When `onFileReady` is provided the component acts as a pure uploader:
  //   idle → uploading → idle (success) | error (failure)
  //
  // When omitted the original preview → analyze flow is used:
  //   idle → preview → loading → done

  const processFile = useCallback(
    async (file: File) => {
      const typeError = validateFileType(file);
      if (typeError) {
        toast.error(typeError);
        return;
      }

      // Hard reject above 50 MB
      if (file.size > MAX_COMPRESSIBLE_SIZE) {
        toast.error(`File too large (${formatMB(file.size)} MB). Maximum size is 50 MB.`);
        return;
      }

      // Between 4.5 MB and 50 MB → show compression modal ONLY for images
      if (file.size > MAX_FILE_SIZE && file.type.startsWith('image/')) {
        setOversizedFile(file);
        setCompressionPct(0);
        setIsModalOpen(true);
        return;
      }

      if (onFileReady) {
        setMode('uploading');
        try {
          await onFileReady(file);
          // Stay in uploading state — router.push in onFileReady navigates away
          // and unmounts this component, so no manual reset is needed.
        } catch (err) {
          if (isNextRedirect(err)) throw err;
          // Parent (onFileReady) is responsible for showing the error toast.
          // Reset to idle so the user can try again without a full error screen.
          setMode('idle');
        }
        return;
      }

      // Original preview flow (no onFileReady prop)
      const base64 = await fileToBase64(file);
      setCapturedImage(`data:${file.type};base64,${base64}`);
      setCapturedBase64(base64);
      setMode('preview');
    },
    [onFileReady],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset input so the same file can be re-selected after modal dismissal
      e.target.value = '';
      if (!file) return;
      await processFile(file);
    },
    [processFile],
  );

  // -- Compression modal handlers --------------------------------------------

  const dismissModal = useCallback(() => {
    if (isCompressing) return; // block dismissal mid-compression
    setIsModalOpen(false);
    setOversizedFile(null);
  }, [isCompressing]);

  const handleCompressAndScan = useCallback(async () => {
    if (!oversizedFile) return;
    setIsCompressing(true);
    setCompressionPct(0);
    try {
      const onProgress = (pct: number) => setCompressionPct(pct);

      if (oversizedFile.type === 'application/pdf') {
         toast.error("Large PDF processing is handled by the backend directly now.");
         setIsModalOpen(false);
         setOversizedFile(null);
         setIsCompressing(false);
         return;
      }

      const compressed = await imageCompression(oversizedFile, {
        maxSizeMB: 4,
        maxWidthOrHeight: 2048,
        initialQuality: 0.7,
        useWebWorker: true,
        onProgress,
      });

      setIsModalOpen(false);
      setOversizedFile(null);
      setIsCompressing(false);
      setCompressionPct(0);

      // Guard: if compression couldn't get below the upload limit, reject cleanly
      // instead of re-entering processFile (which would loop back to this modal).
      if (compressed.size > MAX_FILE_SIZE) {
        toast.error(
          `Compressed file is still ${formatMB(compressed.size)} MB — try a smaller or simpler file.`,
        );
        return;
      }

      // Skip size-check and go straight to the upload / preview flow
      if (onFileReady) {
        setMode('uploading');
        try {
          await onFileReady(compressed);
        } catch (err) {
          if (isNextRedirect(err)) throw err;
          // Parent handles the error toast — reset to idle so user can retry.
          setMode('idle');
        }
      } else {
        const base64 = await fileToBase64(compressed);
        setCapturedImage(`data:${compressed.type};base64,${base64}`);
        setCapturedBase64(base64);
        setMode('preview');
      }
    } catch {
      setIsCompressing(false);
      setCompressionPct(0);
      toast.error('Compression failed. Please try selecting a different file.');
    }
  }, [oversizedFile, onFileReady]);

  // -- Analyze ---------------------------------------------------------------

  const analyzeImage = useCallback(async () => {
    if (!capturedBase64) return;

    // When onFileReady is available, convert the captured JPEG to a File and
    // route through the same analyzeDocumentAction path as file uploads.
    // This gives us storage upload, plan checks, scan counter, and /document/[id] redirect.
    if (onFileReady) {
      const byteString = atob(capturedBase64);
      const arr = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
      const file = new File([arr], 'camera-capture.jpg', { type: 'image/jpeg' });
      setMode('uploading');
      try {
        await onFileReady(file);
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        console.error('[scanner] camera analyze error:', err);
        setErrorMessage('Something went wrong. Please try again.');
        setMode('error');
      }
      return;
    }

    // Fallback: no onFileReady — use legacy /api/analyze path
    setMode('loading');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedBase64, mimeType: 'image/jpeg' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `Server error ${res.status}`);
      }
      const { result } = await res.json();
      setMode('done');
      onResult(result);
    } catch (err) {
      console.error('[scanner] analyze error:', err);
      setErrorMessage('Something went wrong. Please try again.');
      setMode('error');
    }
  }, [capturedBase64, onFileReady, onResult]);

  // -- Reset -----------------------------------------------------------------

  const reset = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setCapturedBase64(null);
    setErrorMessage('');
    setMode('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [stopCamera]);

  // -- Render ----------------------------------------------------------------

  return (
    <>
      {/* -- File-too-large compression modal -------------------------------- */}
      <Dialog
        open={isModalOpen}
        onClose={dismissModal}
        title="File Too Large"
        description={
          oversizedFile
            ? `The file you selected is ${formatMB(oversizedFile.size)} MB, which exceeds the 4.5 MB upload limit. ${
                oversizedFile.type === 'application/pdf'
                  ? "We'll re-render each page as a compressed image and repackage it as a PDF — text stays clearly readable for AI analysis."
                  : 'We can securely compress this image for you right now without losing text readability.'
              }`
            : ''
        }
        footer={
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button
              variant="premium"
              onClick={handleCompressAndScan}
              disabled={isCompressing}
              className="w-full gap-2 font-semibold shadow-lg shadow-brand-primary/25 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compressing…
                </>
              ) : (
                <>
                  <Minimize2 className="h-4 w-4" />
                  Compress &amp; Continue Scan
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={dismissModal}
              disabled={isCompressing}
              className="text-muted-foreground hover:bg-muted hover:text-foreground w-full disabled:opacity-40"
            >
              Select Another File
            </Button>
          </div>
        }
      >
        {isCompressing && (
          <div className="mt-1 space-y-1.5 px-6 pb-6">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Compressing…</span>
              <span className="text-foreground font-medium">{compressionPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full border border-border-subtle bg-surface-1 shadow-inner">
              <div
                className="animate-in fade-in h-full rounded-full bg-gradient-to-r from-brand-primary via-blue-500 to-brand-primary transition-all duration-300 ease-out"
                style={{ width: `${compressionPct}%`, backgroundSize: '200% 100%' }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* -- Main scanner surface --------------------------------------------- */}
      <div className={cn('relative w-full rounded-2xl', className)}>
        {/* Hidden utilities */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept={INPUT_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* -- IDLE: File drop-zone ------------------------------------------- */}
        {(mode === 'idle' || mode === 'error') && (
          <div
            className={cn(
              'relative mx-auto w-full max-w-3xl cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200',
              'flex min-h-[320px] flex-col items-center justify-center gap-5 px-4 py-6 text-center sm:min-h-[500px] sm:gap-6 sm:px-6 sm:py-10',
              isDragOver
                ? 'scale-[1.01] border-brand-primary bg-brand-primary/10'
                : 'border-brand-primary/30 bg-surface-1/50 hover:border-brand-primary/50 hover:bg-brand-primary/[0.02]',
              disabled && 'pointer-events-none opacity-50',
            )}
            onClick={disabled ? undefined : () => fileInputRef.current?.click()}
            onDragOver={
              disabled
                ? undefined
                : (e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }
            }
            onDragLeave={disabled ? undefined : () => setIsDragOver(false)}
            onDrop={
              disabled
                ? undefined
                : async (e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    await processFile(file);
                  }
            }
            role={disabled ? undefined : 'button'}
            tabIndex={disabled ? -1 : 0}
            aria-label={
              disabled
                ? 'Scanner locked — scan limit reached'
                : 'Drop a document or image here, or click to browse files'
            }
            onKeyDown={
              disabled
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }
            }
          >
            <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5">
              {/* Icon */}
              <div className="relative flex items-center justify-center">
                <span className="absolute h-20 w-20 rounded-full bg-brand-primary/10" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/20 ring-1 ring-brand-primary/30">
                  <FileUp className="h-7 w-7 text-brand-primary" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-2 space-y-1.5 text-center">
                <p className="text-lg font-bold tracking-tight text-text-primary">
                  {isDragOver ? 'Drop to analyse' : 'Drop your document here'}
                </p>
                <p className="text-sm text-text-secondary">PDF, images, Word, Excel &amp; more</p>
              </div>

              {/* Accepted type chips */}
              <div
                className="flex flex-wrap justify-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {['PDF', 'Images', 'DOCX'].map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-border-strong/50 bg-surface-1 px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm"
                  >
                    {type}
                  </span>
                ))}
                <span className="rounded-full border border-border-strong/30 bg-surface-1/50 px-3 py-1 text-xs font-semibold text-text-tertiary italic shadow-sm">
                  &amp; more
                </span>
              </div>

              {/* Or divider */}
              <div className="mt-1 flex w-full items-center gap-3 px-4 sm:max-w-xs sm:px-0">
                <div className="h-px flex-1 bg-border-strong/50" />
                <span className="text-xs font-medium text-text-tertiary">or choose an option</span>
                <div className="h-px flex-1 bg-border-strong/50" />
              </div>

              {/* Action Buttons */}
              <div
                className="mt-1 flex w-full gap-3 px-4 sm:max-w-sm sm:px-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={disabled ? undefined : () => fileInputRef.current?.click()}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2.5 rounded-xl px-3 py-4 text-center',
                    'border border-brand-primary/30 bg-brand-primary/5',
                    'transition-all duration-200',
                    disabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:border-brand-primary/60 hover:bg-brand-primary/10 active:scale-[0.97]',
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
                    <Upload className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Browse Files</p>
                    <p className="mt-0.5 text-[11px] leading-tight text-text-secondary">
                      PDF, images, DOCX
                      <br />
                      &amp; more
                    </p>
                  </div>
                </button>

                {/* Use Camera */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={disabled ? undefined : startCamera}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2.5 rounded-xl px-3 py-4 text-center',
                    'border border-border-strong/50 bg-surface-1/50',
                    'transition-all duration-200',
                    disabled
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:border-brand-primary/40 hover:bg-surface-1 active:scale-[0.97]',
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong/50 bg-surface-1">
                    <Camera className="h-5 w-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Use Camera</p>
                    <p className="mt-0.5 text-[11px] leading-tight text-text-secondary">
                      Take a photo live
                    </p>
                  </div>
                </button>
              </div>

              <p className="mt-2 text-xs text-text-tertiary">Max 10 MB · Encrypted &amp; secure</p>
            </div>
          </div>
        )}

        {/* -- CAMERA: Live viewfinder ---------------------------------------- */}
        {mode === 'camera' && (
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              className="w-full"
              playsInline
              muted
              style={{ maxHeight: '70vh', objectFit: 'cover' }}
            />
            {/* Document framing guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-3/4 w-[85%]">
                {/* Corner brackets */}
                {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
                  <div
                    key={c}
                    className={cn(
                      'border-primary absolute h-8 w-8',
                      c === 'tl' && 'top-0 left-0 rounded-tl-lg border-t-[3px] border-l-[3px]',
                      c === 'tr' && 'top-0 right-0 rounded-tr-lg border-t-[3px] border-r-[3px]',
                      c === 'bl' && 'bottom-0 left-0 rounded-bl-lg border-b-[3px] border-l-[3px]',
                      c === 'br' && 'right-0 bottom-0 rounded-br-lg border-r-[3px] border-b-[3px]',
                    )}
                  />
                ))}
              </div>
            </div>
            {/* Controls */}
            <div className="absolute right-0 bottom-0 left-0 flex gap-3 bg-gradient-to-t from-black/70 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Button
                variant="ghost"
                className="flex-1 text-white hover:bg-white/20 hover:text-white"
                onClick={reset}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 shadow-xl"
                onClick={capturePhoto}
              >
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
            </div>
          </div>
        )}

        {/* -- PREVIEW: Confirm before analyze ------------------------------- */}
        {mode === 'preview' && capturedImage && (
          <div className="border-border bg-primary/[0.03] overflow-hidden rounded-2xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured document"
              className="w-full object-contain"
              style={{ maxHeight: '60vh' }}
            />
            <div className="flex gap-3 p-4">
              <Button
                variant="secondary"
                className="flex-1 shadow-sm"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button
                variant="primary"
                className="flex-1 shadow-sm"
                onClick={analyzeImage}
              >
                <Zap className="h-4 w-4" />
                Analyze Document
              </Button>
            </div>
          </div>
        )}

        {/* -- UPLOADING: Storage upload in progress ------------------------- */}
        {mode === 'uploading' && (
          <div className="relative mx-auto flex min-h-[400px] w-full max-w-3xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-brand-primary/20 bg-surface-1 p-8 shadow-2xl sm:min-h-[500px]">
            {/* Ambient Glow */}
            <div
              className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/5 blur-3xl"
              style={{ animationDuration: '4s' }}
            />

            <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-center">
              <div className="relative mb-8">
                <div
                  className="absolute -inset-4 animate-ping rounded-full bg-brand-primary/20"
                  style={{ animationDuration: '3s' }}
                />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 shadow-[0_0_40px_-10px_rgba(37,99,235,0.4)] backdrop-blur-md">
                  <ScanLine className="h-10 w-10 animate-pulse text-brand-primary" />
                </div>
              </div>

              <h3 className="font-geist mb-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Processing Document
              </h3>
              <div className="mb-8 flex h-5 items-center justify-center gap-2 text-center text-sm font-medium text-text-secondary">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
                <span
                  className="animate-in fade-in slide-in-from-bottom-2 inline-block duration-500"
                  key={phaseIdx}
                >
                  {uploadPhases[phaseIdx]}...
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-8 h-2 w-full overflow-hidden rounded-full border border-border-subtle bg-surface-2 shadow-inner">
                <div
                  className="relative h-full overflow-hidden rounded-full bg-brand-primary transition-all duration-[3000ms] ease-out"
                  style={{ width: `${Math.max(5, (phaseIdx / (uploadPhases.length - 1)) * 100)}%` }}
                >
                  <div className="absolute inset-0 h-full w-full -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
              </div>

              {/* Simulated AI extraction logs */}
              <div className="relative flex h-40 w-full flex-col justify-end overflow-hidden rounded-xl border border-[#222] bg-[#0a0a0a] p-4 font-mono text-[10px] leading-relaxed text-[#4ade80] opacity-90 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] sm:p-5 sm:text-xs">
                <div className="pointer-events-none absolute inset-0 z-10 h-8 bg-gradient-to-b from-[#0a0a0a] via-transparent to-transparent" />
                <div className="flex translate-y-2 flex-col gap-1.5 transition-transform duration-500">
                  <div className="opacity-40">&gt; Initializing secure container... [OK]</div>
                  <div className="opacity-50">&gt; Parsing byte stream...</div>
                  <div className="opacity-60">&gt; Extracting vectors and tokenizing text...</div>
                  {phaseIdx > 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 opacity-70">
                      &gt; Locating legally binding clauses... [FOUND]
                    </div>
                  )}
                  {phaseIdx > 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 text-white opacity-80">
                      &gt; Analyzing entity constraints and risk profiles...
                    </div>
                  )}
                  {phaseIdx > 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 font-bold text-brand-primary">
                      &gt; Finalizing specialized compliance report...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -- LOADING: Laser scan -------------------------------------------- */}
        {mode === 'loading' && capturedImage && (
          <div className="border-border bg-primary/[0.03] overflow-hidden rounded-2xl border">
            {/* Image with laser overlay */}
            <div className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Scanning document"
                className="w-full object-contain opacity-80"
                style={{ maxHeight: '55vh' }}
              />
              {/* Dark tint */}
              <div className="bg-background/20 absolute inset-0" />
              {/* Laser line */}
              <div className="animate-cc-laser" aria-hidden="true" />
              {/* Glowing scan label */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground shadow-primary/30 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-lg">
                  <ScanLine className="h-3 w-3 animate-pulse" />
                  Scanning…
                </span>
              </div>
            </div>

            {/* Microcopy */}
            <div className="px-5 py-4 text-center">
              <p className="text-foreground font-semibold">Decrypting bureaucracy…</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Our AI is reading every line — this takes under 10 seconds.
              </p>
              {/* Shimmer progress bar */}
              <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
                <div className="animate-cc-shimmer h-full w-full rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* -- ERROR --------------------------------------------------------- */}
        {mode === 'error' &&
          (() => {
            const isPermissionDenied = /not allowed|permission denied|notallowederror/i.test(
              errorMessage,
            );

            if (isPermissionDenied) {
              return (
                <div className="bg-background/80 animate-in fade-in zoom-in-95 absolute inset-0 z-50 flex items-center justify-center rounded-2xl backdrop-blur-sm duration-200">
                  <div className="mx-4 flex w-full max-w-sm flex-col items-center justify-center gap-5 rounded-3xl border border-border-strong bg-surface-1 p-8 text-center shadow-2xl">
                    <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-black/5">
                      <Camera className="text-muted-foreground h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">Camera access blocked</h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                        Your browser blocked camera access. To re-enable it, click the
                        <strong className="text-text-primary"> camera or lock icon</strong> in your
                        browser&apos;s address bar and allow camera access, then try again.
                      </p>
                    </div>
                    <div className="mt-2 flex w-full flex-col gap-2">
                      <Button
                        variant="premium"
                        className="w-full gap-2 transition-all duration-200 active:scale-[0.98]"
                        onClick={() => {
                          reset();
                          fileInputRef.current?.click();
                        }}
                      >
                        <FileUp className="h-4 w-4" />
                        Upload a file instead
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full gap-2 transition-all duration-200 active:scale-[0.98]"
                        onClick={reset}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="bg-background/80 animate-in fade-in zoom-in-95 absolute inset-0 z-50 flex items-center justify-center rounded-2xl backdrop-blur-sm duration-200">
                <div className="border-destructive/20 mx-4 flex w-full max-w-sm flex-col items-center justify-center gap-5 rounded-3xl border bg-surface-1 p-8 text-center shadow-2xl">
                  <div className="bg-destructive/10 ring-destructive/20 flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
                    <AlertTriangle className="text-destructive h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-destructive text-lg font-bold">Something went wrong</h2>
                    <p className="mt-1.5 text-sm text-text-secondary">{errorMessage}</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-2 w-full gap-2 transition-all duration-200 active:scale-[0.98]"
                    onClick={reset}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            );
          })()}

        {/* -- DONE: Quick confirmation --------------------------------------- */}
        {mode === 'done' && (
          <div
            className={cn(
              'flex min-h-[50vh] flex-col items-center justify-center gap-5 rounded-2xl sm:min-h-[70vh]',
              'border-success/30 bg-success/5 border-2 border-dashed p-8 text-center',
            )}
          >
            <div className="bg-success/10 flex h-16 w-16 items-center justify-center rounded-full">
              <CheckCircle2 className="text-success h-8 w-8" />
            </div>
            <p className="text-success font-semibold">Analysis complete!</p>
            <Button
              variant="secondary"
              className="gap-2 transition-all duration-200 active:scale-[0.98]"
              onClick={reset}
            >
              <Camera className="h-4 w-4" />
              Scan Another
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
