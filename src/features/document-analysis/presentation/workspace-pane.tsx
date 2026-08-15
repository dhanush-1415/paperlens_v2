'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, MessageSquare, ChevronsUp, ChevronsDown, ChevronUp, ChevronDown, Pause } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { CopilotChatWindow } from './copilot-chat-window';
import { TextPreview } from './text-preview';
import { PdfViewer } from './pdf-viewer';

export interface WorkspacePaneProps {
  documentId: string;
  suggestedQuestions: readonly string[];
  rawText: string;
  fileUrl?: string | null;
  mimeType?: string | null;
  plan?: { canChat: boolean; usage: { chatMsgs: number }; limits: { chatMsgs: number } };
}

export function WorkspacePane({ documentId, suggestedQuestions, rawText, fileUrl, mimeType, plan }: WorkspacePaneProps) {
  const [tab, setTab] = useState<'chat' | 'document'>('chat');
  const viewerRef = useRef<HTMLDivElement>(null);

  /* -- Teleprompter State -- */
  const [scrollSpeed, setScrollSpeed] = useState<1 | 2 | 5 | 10>(1);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollDir, setAutoScrollDir] = useState<'up' | 'down'>('down');
  const rafRef = useRef<number | null>(null);
  
  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const toggleAutoScroll = useCallback((dir: 'up' | 'down') => {
    setIsAutoScrolling(prev => {
      if (prev && autoScrollDir === dir) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return false;
      }
      setAutoScrollDir(dir);
      return true;
    });
  }, [autoScrollDir]);

  useEffect(() => {
    if (!isAutoScrolling) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (viewerRef.current) {
        // Base speed is ~60px per second at 1x
        const distance = (60 * scrollSpeed * dt) / 1000;
        viewerRef.current.scrollBy({
          top: autoScrollDir === 'down' ? distance : -distance,
          behavior: 'auto',
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [isAutoScrolling, autoScrollDir, scrollSpeed]);

  const scrollToTop = () => {
    setIsAutoScrolling(false);
    viewerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const scrollToBottom = () => {
    setIsAutoScrolling(false);
    if (viewerRef.current) {
      viewerRef.current.scrollTo({ top: viewerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full lg:w-[450px] xl:w-[500px] h-[60vh] lg:h-full border-t lg:border-t-0 lg:border-l border-border-strong bg-surface-2 shrink-0 flex flex-col shadow-2xl relative">
      
      {/* Tab switcher */}
      <div className="absolute top-4 left-4 right-4 z-20 shrink-0 flex rounded-2xl border border-border-subtle bg-surface-1/80 p-1 gap-1 backdrop-blur-2xl shadow-sm">
        <button
          onClick={() => setTab('chat')}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-1.5 transition-all duration-200 rounded-xl',
            tab === 'chat'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
          )}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold">AI Chat</span>
        </button>
        <button
          onClick={() => setTab('document')}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-1.5 transition-all duration-200 rounded-xl',
            tab === 'document'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
          )}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold">Original Doc</span>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden mt-16">
        {/* Tab 1 — AI Chat */}
        <div className={cn(
          'absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out',
          tab === 'chat' ? 'translate-x-0' : '-translate-x-full',
        )}>
          {/* We strip the internal header of CopilotChatWindow if needed, or just let it render below the tabs */}
          <CopilotChatWindow documentId={documentId} suggestedQuestions={suggestedQuestions} plan={plan} />
        </div>

        {/* Tab 2 — Original Document */}
        <div className={cn(
          'absolute inset-0 flex flex-col bg-surface-1 transition-transform duration-300 ease-in-out overflow-hidden',
          tab === 'document' ? 'translate-x-0' : 'translate-x-full',
        )}>
          <div className="flex items-center gap-2 border-b border-border-subtle p-4 pb-3 shrink-0">
             <FileText className="size-4 text-brand-primary" />
             <span className="text-sm font-semibold text-text-primary">Source Text</span>
          </div>

          <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
            {fileUrl && mimeType?.startsWith('application/pdf') ? (
              <PdfViewer src={fileUrl} ref={viewerRef} />
            ) : fileUrl && mimeType?.startsWith('image/') ? (
              <div ref={viewerRef} className="flex-1 overflow-auto p-4 flex items-center justify-center">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl} alt="Original Document" className="max-w-full rounded-lg shadow-sm" />
              </div>
            ) : fileUrl && mimeType?.startsWith('audio/') ? (
              <div ref={viewerRef} className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center gap-6 text-text-tertiary">
                <div className="size-20 rounded-full bg-brand-primary/10 flex items-center justify-center relative">
                   <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />
                   <MessageSquare className="size-8 text-brand-primary relative z-10" />
                </div>
                <audio controls src={fileUrl} className="w-full max-w-sm" />
              </div>
            ) : fileUrl && mimeType === 'text/csv' ? (
              <TextPreview type="csv" src={fileUrl} innerRef={viewerRef} />
            ) : fileUrl && (mimeType === 'text/html' || mimeType === 'application/xml') ? (
              <TextPreview type="html" src={fileUrl} innerRef={viewerRef} />
            ) : (
              <TextPreview type="text" initialContent={rawText || 'No source text available.'} innerRef={viewerRef} />
            )}
            
            {/* -- Scroll controls ------------ */}
            <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex flex-col items-center justify-center">
              <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-xl border border-border-strong bg-surface-1/90 p-1 shadow-md backdrop-blur-sm">
                
                {/* Scroll to top */}
                <button
                  onClick={scrollToTop}
                  title="Scroll to top"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-tertiary transition-all hover:bg-surface-2 hover:text-text-primary active:scale-90"
                >
                  <ChevronsUp className="h-5 w-5" />
                </button>

                {/* Auto-scroll up */}
                <button
                  onClick={() => toggleAutoScroll('up')}
                  title={isAutoScrolling && autoScrollDir === 'up' ? 'Stop' : 'Auto-scroll up'}
                  className={cn(
                    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-90',
                    isAutoScrolling && autoScrollDir === 'up'
                      ? 'animate-pulse bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
                      : 'text-text-tertiary hover:bg-surface-2 hover:text-text-primary',
                  )}
                >
                  {isAutoScrolling && autoScrollDir === 'up'
                    ? <Pause      className="h-4 w-4" />
                    : <ChevronUp  className="h-5 w-5" />}
                </button>

                <div className="h-px w-full bg-border-subtle" />

                {/* Speed selector */}
                {([1, 2, 5, 10] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setScrollSpeed(s)}
                    title={`${s}× speed`}
                    className={cn(
                      'flex h-7 w-8 cursor-pointer items-center justify-center rounded-md text-[11px] font-semibold transition-all active:scale-90',
                      scrollSpeed === s
                        ? 'border border-amber-500/40 bg-amber-500/20 text-amber-600'
                        : 'text-text-tertiary hover:bg-surface-2 hover:text-text-primary',
                    )}
                  >
                    {s}×
                  </button>
                ))}

                <div className="h-px w-full bg-border-subtle" />

                {/* Auto-scroll down */}
                <button
                  onClick={() => toggleAutoScroll('down')}
                  title={isAutoScrolling && autoScrollDir === 'down' ? 'Stop' : 'Auto-scroll down'}
                  className={cn(
                    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-90',
                    isAutoScrolling && autoScrollDir === 'down'
                      ? 'animate-pulse bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
                      : 'text-text-tertiary hover:bg-surface-2 hover:text-text-primary',
                  )}
                >
                  {isAutoScrolling && autoScrollDir === 'down'
                    ? <Pause       className="h-4 w-4" />
                    : <ChevronDown className="h-5 w-5" />}
                </button>

                {/* Scroll to bottom */}
                <button
                  onClick={scrollToBottom}
                  title="Scroll to bottom"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-tertiary transition-all hover:bg-surface-2 hover:text-text-primary active:scale-90"
                >
                  <ChevronsDown className="h-5 w-5" />
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
