'use client';

import { useState } from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { CopilotChatWindow } from './copilot-chat-window';

export interface WorkspacePaneProps {
  documentId: string;
  suggestedQuestions: readonly string[];
  rawText: string;
}

export function WorkspacePane({ documentId, suggestedQuestions, rawText }: WorkspacePaneProps) {
  const [tab, setTab] = useState<'chat' | 'document'>('chat');

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
          <CopilotChatWindow documentId={documentId} suggestedQuestions={suggestedQuestions} />
        </div>

        {/* Tab 2 — Original Document */}
        <div className={cn(
          'absolute inset-0 flex flex-col bg-surface-1 transition-transform duration-300 ease-in-out p-6 overflow-y-auto',
          tab === 'document' ? 'translate-x-0' : 'translate-x-full',
        )}>
          <div className="flex items-center gap-2 mb-4 border-b border-border-subtle pb-2">
             <FileText className="size-4 text-brand-primary" />
             <span className="text-sm font-semibold text-text-primary">Source Text</span>
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-text-secondary leading-relaxed">
            {rawText || 'No source text available.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
