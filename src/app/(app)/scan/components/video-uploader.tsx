'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  Video, Upload, AlertTriangle,
  Brain, FileVideo, PlaySquare, Eye,
} from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import { cn } from '@/shared/ui/cn';
import { toast } from 'sonner';

// --- Constants ----------------------------------------------------------------

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB for video
const VIDEO_INPUT_ACCEPT = '.mp4,.mov,.webm';

// Analyzing phases
const VIDEO_PHASES = [
  { icon: Upload,      label: 'Uploading video…',       sub: 'Sending your recording securely'       },
  { icon: Eye,         label: 'AI is watching…',        sub: 'Extracting frames and timestamps'      },
  { icon: FileVideo,   label: 'Transcribing speech…',   sub: 'Converting audio to text'              },
  { icon: Brain,       label: 'Building timeline…',     sub: 'Mapping out critical liabilities'      },
] as const;

// --- Types --------------------------------------------------------------------

type VideoState = 'idle' | 'analyzing' | 'error';

interface VideoUploaderProps {
  onFileReady: (file: File) => Promise<void>;
  onScanningChange?: (scanning: boolean) => void;
  disabled?: boolean;
}

// --- Sub-components -----------------------------------------------------------

function VideoDropZone({
  isDragOver,
  disabled,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
}: {
  isDragOver: boolean;
  disabled?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowse: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop video file or click to browse"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={disabled ? undefined : onBrowse}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) onBrowse(); }}
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer w-full max-w-3xl',
        'min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center gap-6 px-6 py-10 text-center',
        isDragOver
          ? 'border-brand-primary bg-brand-primary/10 scale-[1.01]'
          : 'border-brand-primary/30 bg-surface-1/50 hover:border-brand-primary/50 hover:bg-brand-primary/[0.02]',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <span className="absolute h-20 w-20 rounded-full bg-brand-primary/10" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/20 ring-1 ring-brand-primary/30">
            <Video className="h-7 w-7 text-brand-primary" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-1.5 mt-4">
          <p className="text-lg font-bold text-text-primary tracking-tight">
            {isDragOver ? 'Drop to analyse' : 'Drop your video file here'}
          </p>
          <p className="text-sm text-text-secondary">
            Zoom meetings, legal depositions, or lecture captures
          </p>
        </div>

        {/* Format chips */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {['MP4', 'MOV', 'WEBM'].map((fmt) => (
            <span
              key={fmt}
              className="rounded-full bg-surface-1 border border-border-strong/50 px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm"
            >
              {fmt}
            </span>
          ))}
        </div>

        {/* Browse button */}
        <Button
          variant="premium"
          size="lg"
          onClick={(e) => { e.stopPropagation(); onBrowse(); }}
          disabled={disabled}
          className="mt-2"
        >
          <PlaySquare className="h-4 w-4 mr-2" aria-hidden="true" />
          Browse video files
        </Button>

        <p className="text-xs text-text-tertiary mt-2">Max 25 MB · Frame-by-frame analysis</p>
      </div>
    </div>
  );
}

function VideoAnalyzingState({ phase }: { phase: number }) {
  const phaseData = VIDEO_PHASES[Math.min(phase, VIDEO_PHASES.length - 1)];
  const { icon: PhaseIcon, label, sub } = phaseData || VIDEO_PHASES[0];

  return (
    <div className="relative overflow-hidden w-full max-w-3xl rounded-2xl border-2 border-dashed border-brand-primary/30 bg-surface-1/50 min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-xs">
        {/* Animated icon ring */}
        <div className="relative flex items-center justify-center">
          <span className="absolute h-24 w-24 rounded-full bg-brand-primary/10 animate-ping [animation-duration:2.5s]" />
          <span className="absolute h-16 w-16 rounded-full bg-brand-primary/20" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/30 ring-1 ring-brand-primary/40">
            <PhaseIcon
              key={phase}
              className="h-6 w-6 text-brand-primary animate-in fade-in zoom-in-75 duration-300"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="space-y-1 text-center">
          <p
            key={`label-${phase}`}
            className="text-base font-bold text-text-primary animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            {label}
          </p>
          <p
            key={`sub-${phase}`}
            className="text-xs text-text-secondary animate-in fade-in duration-500"
          >
            {sub}
          </p>
        </div>

        {/* Phase progress dots */}
        <div className="flex items-center gap-1.5 mt-4">
          {VIDEO_PHASES.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === phase
                  ? 'w-5 bg-brand-primary'
                  : i < phase
                  ? 'w-1.5 bg-brand-primary/40'
                  : 'w-1.5 bg-border-strong',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="relative overflow-hidden w-full max-w-3xl rounded-2xl border-2 border-dashed border-red-500/30 bg-red-500/5 min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
          <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-bold text-text-primary">Analysis failed</p>
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>
        <Button
          variant="secondary"
          onClick={onRetry}
          className="text-red-500"
        >
          Try a different file
        </Button>
      </div>
    </div>
  );
}

// --- Main component -----------------------------------------------------------

export function VideoUploader({ onFileReady, onScanningChange, disabled }: VideoUploaderProps) {
  const [state,      setState]     = useState<VideoState>('idle');
  const [error,      setError]     = useState<string | null>(null);
  const [phase,      setPhase]     = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const inputRef   = useRef<HTMLInputElement>(null);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle phases every 4s during analysis (Video is slower)
  useEffect(() => {
    let initPhase: ReturnType<typeof setTimeout>;
    if (state === 'analyzing') {
      initPhase = setTimeout(() => setPhase(0), 0);
      phaseTimer.current = setInterval(() => {
        setPhase((p) => Math.min(p + 1, VIDEO_PHASES.length - 1));
      }, 4000);
    } else {
      if (phaseTimer.current) clearInterval(phaseTimer.current);
    }
    return () => { clearTimeout(initPhase); if (phaseTimer.current) clearInterval(phaseTimer.current); };
  }, [state]);

  const validateAndAnalyze = useCallback(async (f: File) => {
    if (f.size > MAX_BYTES) {
      toast.error(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB.`);
      return;
    }

    setState('analyzing');
    onScanningChange?.(true);
    try {
      await onFileReady(f);
      setState('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(msg);
      setState('error');
    } finally {
      onScanningChange?.(false);
    }
  }, [onFileReady, onScanningChange]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void validateAndAnalyze(f);
    e.target.value = ''; // allow re-selecting same file
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void validateAndAnalyze(f);
  }

  function handleRetry() {
    setError(null);
    setState('idle');
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={VIDEO_INPUT_ACCEPT}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
      />

      {state === 'idle' && (
        <VideoDropZone
          isDragOver={isDragOver}
          disabled={disabled}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onBrowse={() => inputRef.current?.click()}
        />
      )}

      {state === 'analyzing' && (
        <VideoAnalyzingState phase={phase} />
      )}

      {state === 'error' && (
        <VideoError
          message={error ?? 'Analysis failed. Please try again.'}
          onRetry={handleRetry}
        />
      )}
    </>
  );
}
