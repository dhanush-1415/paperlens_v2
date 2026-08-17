'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button, Input, Text } from '@/shared/ui';
import { MessageSquareIcon, XIcon, SendIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/ui';

export function VaultChat() {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/vault',
    initialMessages: [
      { id: '1', role: 'assistant', content: 'Hi! I am your Vault AI Copilot. Ask me anything about the documents you have analyzed.' }
    ]
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
          className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/30 hover:scale-105 transition-transform"
        >
          <MessageSquareIcon className="size-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[550px] w-[380px] flex-col rounded-2xl border border-border-subtle bg-surface-1 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between bg-brand-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="size-5" />
              <Text className="font-bold text-white">Vault Copilot</Text>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <XIcon className="size-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-2/30" ref={scrollRef}>
            {messages.map(m => (
              <div key={m.id} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === 'user' 
                    ? "bg-brand-primary text-white rounded-br-none" 
                    : "bg-surface-1 border border-border-subtle text-text-primary rounded-bl-none shadow-sm"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-1 border border-border-subtle text-text-primary rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
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
                className="flex-1 rounded-full bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary px-4 h-10"
              />
              <Button type="submit" disabled={!input.trim() || isLoading} className="rounded-full size-10 p-0 shrink-0 bg-brand-primary hover:bg-brand-secondary shadow-md flex items-center justify-center">
                <SendIcon className="size-4 -ml-0.5 text-white" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
