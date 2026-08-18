'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button, Input, Text } from '@/shared/ui';
import { MessageSquareIcon, XIcon, SendIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/ui';

export function VaultChat() {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // @ts-expect-error AI SDK version mismatch bypass
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    // @ts-expect-error AI SDK version mismatch bypass
    api: '/api/chat/vault',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content:
          'Hi! I am your Vault AI Copilot. Ask me anything about the documents you have analyzed.',
      },
    ],
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/30 transition-transform hover:scale-105"
        >
          <MessageSquareIcon className="size-6" />
        </button>
      )}

      {isOpen && (
        <div className="animate-in slide-in-from-bottom-5 fixed right-6 bottom-6 z-50 flex h-[550px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-brand-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="size-5" />
              <Text className="font-bold text-white">Vault Copilot</Text>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 transition-colors hover:text-white"
            >
              <XIcon className="size-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-surface-2/30 p-4" ref={scrollRef}>
            {messages.map((m: any) => (
              <div
                key={m.id}
                className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                    m.role === 'user'
                      ? 'rounded-br-none bg-brand-primary text-white'
                      : 'rounded-bl-none border border-border-subtle bg-surface-1 text-text-primary shadow-sm',
                  )}
                >
                  {m.content || (m.parts && m.parts[0]?.text) || m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none border border-border-subtle bg-surface-1 px-4 py-2.5 text-text-primary shadow-sm">
                  <Loader2Icon className="size-4 animate-spin text-brand-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border-subtle bg-surface-1 p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your documents..."
                className="h-10 flex-1 rounded-full border-transparent bg-surface-2 px-4 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary p-0 shadow-md hover:bg-brand-secondary"
              >
                <SendIcon className="-ml-0.5 size-4 text-white" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
