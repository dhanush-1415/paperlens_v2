'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Text, Card } from '@/shared/ui';
import {
  SendIcon,
  SparklesIcon,
  BotIcon,
  UserIcon,
  RefreshCwIcon,
  PlusIcon,
  Loader2Icon,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { generateSuggestionsAction } from './chat-actions';

export interface CopilotChatWindowProps {
  documentId: string;
  suggestedQuestions?: readonly string[];
  reanalyzedAt?: number | null;
  plan?: { canChat: boolean; usage: { chatMsgs: number }; limits: { chatMsgs: number } };
}

export function CopilotChatWindow({
  documentId,
  suggestedQuestions = [],
  reanalyzedAt,
  plan,
}: CopilotChatWindowProps) {
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your Legal AI Copilot. I've analyzed this document. What would you like to know about the clauses, risks, or obligations?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>(
    suggestedQuestions?.length ? [...suggestedQuestions] : [],
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
        setDisplayedSuggestions((prev) => {
          const existing = new Set(prev);
          const novel = fresh.filter((q) => !existing.has(q));
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
    if (
      !isSuggestionsLoading &&
      !isLoadingMore &&
      displayedSuggestions.length < 2 &&
      !autoLoadDoneRef.current
    ) {
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
        setMessages((prev) => {
          if (prev.some((m) => m.role === 'system')) return prev;
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
      setMessages((prev) => {
        localStorage.setItem(
          `clearcut_reanalysis_${documentId}`,
          JSON.stringify({ separatorAfterIndex: prev.length }),
        );
        return [
          ...prev,
          { id: `reanalysis-${reanalyzedAt}`, role: 'system', content: 'reanalyzed' },
        ];
      });
    }, 0);
  }, [reanalyzedAt, documentId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
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
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    const removeAssistantPlaceholder = () =>
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));

    try {
      setChatError(null);
      const filteredMessages = newMessages.filter((m) => m.role !== 'system');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, messages: filteredMessages }),
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
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
          );
        }
      }

      const SENTINEL = '__CHAT_ERROR__';
      if (fullContent.includes(SENTINEL)) {
        removeAssistantPlaceholder();
        const isQuota = fullContent.includes(`${SENTINEL}:RATE_LIMIT`);
        const isPolicy = fullContent.includes(`${SENTINEL}:CONTENT_POLICY`);
        setChatError(
          isQuota
            ? 'Rate limit exceeded. Please try again later.'
            : isPolicy
              ? 'Your message was blocked by our content policy.'
              : 'An unexpected error occurred while generating the response.',
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
    <div className="relative flex h-full flex-col overflow-hidden bg-surface-1/50 backdrop-blur-xl">
      {/* Header */}
      <div className="z-20 flex items-center gap-3 border-b border-border-subtle bg-surface-2/80 px-6 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shadow-inner ring-1 ring-amber-500/20">
          <SparklesIcon className="size-4" />
        </div>
        <div>
          <Text size="sm" weight="semibold" className="font-geist tracking-tight text-text-primary">
            Resolution Copilot
          </Text>
          <Text size="xs" tone="secondary" className="font-medium">
            Powered by Gemini 2.5 Flash
          </Text>
        </div>
      </div>

      {/* Messages Area with Fades */}
      <div className="relative min-h-0 flex-1">
        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-surface-1 to-transparent" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-surface-1 to-transparent" />

        <div
          ref={scrollRef}
          className="flex h-full flex-col gap-6 overflow-y-auto scroll-smooth px-4 pt-6 pb-8 lg:px-6"
        >
          {messages.map((m, idx) => {
            if (m.role === 'system') {
              const prev = messages[idx - 1];
              if (prev?.role === 'system') return null;
              return (
                <div key={m.id} className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border-subtle" />
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-text-tertiary">
                    <RefreshCwIcon className="h-2.5 w-2.5" />
                    Document re-analyzed
                  </span>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${m.role === 'user' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20'}`}
                >
                  {m.role === 'user' ? (
                    <span className="text-[10px] font-bold">U</span>
                  ) : (
                    <BotIcon className="size-4" />
                  )}
                </div>

                <div
                  className={`flex max-w-[85%] flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      m.role === 'user'
                        ? 'rounded-tr-sm border border-amber-500/20 bg-amber-500/12 text-text-primary shadow-sm'
                        : 'rounded-tl-sm border border-border-subtle bg-surface-2 text-text-primary shadow-sm'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <Text size="sm" className="leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </Text>
                    ) : (
                      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed text-text-primary">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex flex-row gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                <BotIcon className="size-4" />
              </div>
              <div className="flex h-[44px] items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border-subtle bg-surface-2 px-4 py-3 shadow-sm">
                <span
                  className="size-1.5 animate-bounce rounded-full bg-amber-500/60"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-amber-500/60"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-amber-500/60"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {chatError && (
        <div className="relative z-20 mx-4 mb-2 flex shrink-0 items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-500 shadow-sm">
          <span>{chatError}</span>
        </div>
      )}

      {/* -- Chat limit upgrade banner -- */}
      {plan && !plan.canChat && (
        <div className="relative z-20 mx-4 mb-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs">
          <span className="font-medium text-red-500">
            Chat limit reached ({plan.limits.chatMsgs}/month). Upgrade to continue.
          </span>
          <a
            href="/pricing"
            className="flex shrink-0 items-center gap-1 font-semibold text-brand-primary hover:underline"
          >
            Upgrade <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}

      {/* Sticky Blurred Input Area */}
      <div className="z-20 shrink-0 border-t border-border-subtle bg-surface-1/40 px-3 pt-3 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-2xl sm:px-4 sm:py-4">
        {messages.length >= 1 && (isSuggestionsLoading || displayedSuggestions.length > 0) && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-3">
            {isSuggestionsLoading || isLoadingMore
              ? [110, 140, 120].map((w) => (
                  <div
                    key={w}
                    className="h-8 shrink-0 animate-pulse rounded-full border border-border-subtle bg-surface-2"
                    style={{ width: `${w}px` }}
                  />
                ))
              : displayedSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setDisplayedSuggestions((prev) => prev.filter((s) => s !== prompt));
                      sendMessage(prompt);
                    }}
                    disabled={isLoading || (plan && !plan.canChat)}
                    className="rounded-full border border-border-subtle bg-surface-2/80 px-3.5 py-2 text-xs font-medium whitespace-nowrap text-text-secondary shadow-sm backdrop-blur-md transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
            {!isSuggestionsLoading && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore || isLoading || (plan && !plan.canChat)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-amber-500 transition-all hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <Loader2Icon className="h-3 w-3 animate-spin" />
                ) : (
                  <PlusIcon className="h-3 w-3" />
                )}
                More
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="relative"
        >
          <div
            className={`flex items-end gap-2 rounded-2xl border bg-surface-1 transition-all duration-200 ${plan && !plan.canChat ? 'border-border-strong opacity-80' : 'border-border-strong focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20'}`}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                plan && !plan.canChat
                  ? 'Chat limit reached — upgrade to continue'
                  : 'Ask about liabilities, terms, or specific clauses...'
              }
              rows={1}
              disabled={isLoading || (plan && !plan.canChat)}
              className="max-h-[120px] min-h-[48px] w-full resize-none border-0 bg-transparent py-3.5 pr-2 pl-4 text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-tertiary focus:ring-0 disabled:opacity-50"
            />
            <div className="flex h-full shrink-0 flex-col items-end justify-end gap-1 p-2">
              {plan && plan.canChat && (
                <span className="mr-1 text-[9px] text-text-tertiary tabular-nums sm:hidden">
                  {plan.usage.chatMsgs}/{plan.limits.chatMsgs}
                </span>
              )}
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || (plan && !plan.canChat)}
                className="disabled:bg-surface-3 flex size-9 items-center justify-center rounded-xl bg-amber-500 p-0 text-white shadow-md transition-all hover:bg-amber-600 active:scale-95 disabled:text-text-tertiary disabled:opacity-50"
              >
                <SendIcon className="ml-0.5 size-4" />
              </Button>
            </div>
          </div>

          {plan && plan.canChat && (
            <div className="mt-1.5 hidden items-center justify-between px-2 sm:flex">
              <span className="text-[10px] text-text-tertiary">
                Copilot can make mistakes. Check important info.
              </span>
              <span className="text-[10px] text-text-tertiary tabular-nums">
                {plan.usage.chatMsgs} / {plan.limits.chatMsgs} msgs
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
