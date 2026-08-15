'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Text, Card } from '@/shared/ui';
import { SendIcon, SparklesIcon, BotIcon, UserIcon, RefreshCwIcon, PlusIcon, Loader2Icon } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateSuggestionsAction } from './chat-actions';

export interface CopilotChatWindowProps {
  documentId: string;
  suggestedQuestions?: readonly string[];
  reanalyzedAt?: number | null;
  plan?: { canChat: boolean; usage: { chatMsgs: number }; limits: { chatMsgs: number } };
}

export function CopilotChatWindow({ documentId, suggestedQuestions = [], reanalyzedAt, plan }: CopilotChatWindowProps) {
  const [messages, setMessages] = useState<{ id: string, role: string, content: string }[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Legal AI Copilot. I've analyzed this document. What would you like to know about the clauses, risks, or obligations?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>(
    suggestedQuestions?.length ? [...suggestedQuestions] : []
  );
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(!suggestedQuestions?.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoLoadDoneRef = useRef(false);

  // Sync displayedSuggestions when prop changes
  useEffect(() => {
    const id = setTimeout(() => {
      if (suggestedQuestions && suggestedQuestions.length > 0) {
        setDisplayedSuggestions([...suggestedQuestions]);
        setIsSuggestionsLoading(false);
        autoLoadDoneRef.current = false;
      } else {
        setDisplayedSuggestions([]);
        setIsSuggestionsLoading(true);
        autoLoadDoneRef.current = false;
      }
    }, 0);
    return () => clearTimeout(id);
  }, [suggestedQuestions]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const fresh = await generateSuggestionsAction(documentId);
      if (fresh.length) {
        setDisplayedSuggestions(prev => {
          const existing = new Set(prev);
          const novel = fresh.filter(q => !existing.has(q));
          return novel.length ? [...prev, ...novel] : prev;
        });
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Auto-load more suggestions when fewer than 2 remain
  useEffect(() => {
    if (!isSuggestionsLoading && !isLoadingMore && displayedSuggestions.length < 2 && !autoLoadDoneRef.current) {
      autoLoadDoneRef.current = true;
      handleLoadMore();
    }
    if (displayedSuggestions.length >= 2) {
      autoLoadDoneRef.current = false;
    }
  }, [displayedSuggestions.length, isSuggestionsLoading, isLoadingMore]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  // Restore separator from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`clearcut_reanalysis_${documentId}`);
    if (!stored) return;
    try {
      const { separatorAfterIndex } = JSON.parse(stored) as { separatorAfterIndex: number };
      setTimeout(() => {
        setMessages(prev => {
          if (prev.some(m => m.role === 'system')) return prev;
          const result = [...prev];
          result.splice(Math.min(separatorAfterIndex, result.length), 0, {
            id: `reanalysis-stored`,
            role: 'system',
            content: 'reanalyzed',
          });
          return result;
        });
      }, 0);
    } catch {}
  }, [documentId]);

  // Insert separator when re-analysis completes
  useEffect(() => {
    if (!reanalyzedAt) return;
    setTimeout(() => {
      setMessages(prev => {
        localStorage.setItem(
          `clearcut_reanalysis_${documentId}`,
          JSON.stringify({ separatorAfterIndex: prev.length }),
        );
        return [...prev, { id: `reanalysis-${reanalyzedAt}`, role: 'system', content: 'reanalyzed' }];
      });
    }, 0);
  }, [reanalyzedAt, documentId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    const removeAssistantPlaceholder = () =>
      setMessages(prev => prev.filter(m => m.id !== assistantId));

    try {
      setChatError(null);
      const filteredMessages = newMessages.filter(m => m.role !== 'system');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, messages: filteredMessages })
      });

      if (!res.ok) {
        removeAssistantPlaceholder();
        setChatError('Failed to connect to the chat service. Please try again.');
        return;
      }
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
        }
      }

      const SENTINEL = '__CHAT_ERROR__';
      if (fullContent.includes(SENTINEL)) {
        removeAssistantPlaceholder();
        const isQuota = fullContent.includes(`${SENTINEL}:RATE_LIMIT`);
        const isPolicy = fullContent.includes(`${SENTINEL}:CONTENT_POLICY`);
        setChatError(
          isQuota ? 'Rate limit exceeded. Please try again later.'
          : isPolicy ? 'Your message was blocked by our content policy.'
          : 'An unexpected error occurred while generating the response.'
        );
        return;
      }

    } catch (err) {
      console.error(err);
      removeAssistantPlaceholder();
      setChatError('Network error - please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-1/50 backdrop-blur-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border-subtle bg-surface-2/80 z-20">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 shadow-inner">
          <SparklesIcon className="size-4" />
        </div>
        <div>
          <Text size="sm" weight="semibold" className="text-text-primary font-geist tracking-tight">Resolution Copilot</Text>
          <Text size="xs" tone="secondary" className="font-medium">Powered by Gemini 2.5 Flash</Text>
        </div>
      </div>

      {/* Messages Area with Fades */}
      <div className="relative flex-1 min-h-0">
        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-surface-1 to-transparent" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-surface-1 to-transparent" />

        <div ref={scrollRef} className="h-full overflow-y-auto px-4 lg:px-6 pt-6 pb-8 flex flex-col gap-6 scroll-smooth">
          {messages.map((m, idx) => {
            if (m.role === 'system') {
              const prev = messages[idx - 1];
              if (prev?.role === 'system') return null;
              return (
                <div key={m.id} className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border-subtle" />
                  <span className="shrink-0 flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-text-tertiary">
                    <RefreshCwIcon className="h-2.5 w-2.5" />
                    Document re-analyzed
                  </span>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
              );
            }

            return (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${m.role === 'user' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20'}`}>
                {m.role === 'user' ? <span className="text-[10px] font-bold">U</span> : <BotIcon className="size-4" />}
              </div>
              
              <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-amber-500/12 border border-amber-500/20 text-text-primary rounded-tr-sm shadow-sm' 
                    : 'bg-surface-2 border border-border-subtle text-text-primary rounded-tl-sm shadow-sm'
                }`}>
                  {m.role === 'user' ? (
                    <Text size="sm" className="leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </Text>
                  ) : (
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-text-primary leading-relaxed text-sm">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 flex-row">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                <BotIcon className="size-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-surface-2 border border-border-subtle rounded-tl-sm flex items-center gap-1.5 shadow-sm h-[44px]">
                <span className="size-1.5 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {chatError && (
        <div className="shrink-0 mx-4 mb-2 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-500 shadow-sm z-20 relative">
          <span>{chatError}</span>
        </div>
      )}

      {/* -- Chat limit upgrade banner -- */}
      {plan && !plan.canChat && (
        <div className="shrink-0 mx-4 mb-2 flex items-center justify-between gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs z-20 relative">
          <span className="text-red-500 font-medium">Chat limit reached ({plan.limits.chatMsgs}/month). Upgrade to continue.</span>
          <a href="/pricing" className="shrink-0 font-semibold text-brand-primary hover:underline flex items-center gap-1">
            Upgrade <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}

      {/* Sticky Blurred Input Area */}
      <div className="shrink-0 border-t border-border-subtle bg-surface-1/40 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-3 pt-3 pb-4 sm:px-4 sm:py-4 z-20">
        {messages.length >= 1 && (isSuggestionsLoading || displayedSuggestions.length > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {isSuggestionsLoading || isLoadingMore ? (
              [110, 140, 120].map((w) => (
                <div
                  key={w}
                  className="h-8 shrink-0 animate-pulse rounded-full border border-border-subtle bg-surface-2"
                  style={{ width: `${w}px` }}
                />
              ))
            ) : (
              displayedSuggestions.map(prompt => (
                <button 
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setDisplayedSuggestions(prev => prev.filter(s => s !== prompt));
                    sendMessage(prompt);
                  }}
                  disabled={isLoading || (plan && !plan.canChat)}
                  className="whitespace-nowrap px-3.5 py-2 rounded-full bg-surface-2/80 backdrop-blur-md border border-border-subtle hover:bg-amber-500/10 hover:border-amber-500/40 text-xs font-medium text-text-secondary hover:text-text-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))
            )}
            {!isSuggestionsLoading && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore || isLoading || (plan && !plan.canChat)}
                className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <PlusIcon className="h-3 w-3" />}
                More
              </button>
            )}
          </div>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="relative">
          <div className={`flex items-end gap-2 rounded-2xl border bg-surface-1 transition-all duration-200 ${plan && !plan.canChat ? 'border-border-strong opacity-80' : 'border-border-strong focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20'}`}>
            <textarea 
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={plan && !plan.canChat ? 'Chat limit reached — upgrade to continue' : "Ask about liabilities, terms, or specific clauses..."}
              rows={1}
              disabled={isLoading || (plan && !plan.canChat)}
              className="w-full resize-none bg-transparent pl-4 pr-2 py-3.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none border-0 focus:ring-0 min-h-[48px] max-h-[120px] leading-relaxed disabled:opacity-50"
            />
            <div className="p-2 shrink-0 flex flex-col justify-end h-full gap-1 items-end">
              {plan && plan.canChat && (
                <span className="text-[9px] text-text-tertiary tabular-nums mr-1 sm:hidden">
                  {plan.usage.chatMsgs}/{plan.limits.chatMsgs}
                </span>
              )}
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading || (plan && !plan.canChat)}
                className="size-9 p-0 rounded-xl bg-amber-500 hover:bg-amber-600 transition-all shadow-md flex items-center justify-center text-white disabled:opacity-50 disabled:bg-surface-3 disabled:text-text-tertiary active:scale-95"
              >
                <SendIcon className="size-4 ml-0.5" />
              </Button>
            </div>
          </div>
          
          {plan && plan.canChat && (
            <div className="hidden sm:flex mt-1.5 px-2 items-center justify-between">
              <span className="text-[10px] text-text-tertiary">Copilot can make mistakes. Check important info.</span>
              <span className="text-[10px] text-text-tertiary tabular-nums">{plan.usage.chatMsgs} / {plan.limits.chatMsgs} msgs</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

