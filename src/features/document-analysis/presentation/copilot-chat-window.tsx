'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Text, Card } from '@/shared/ui';
import { SendIcon, SparklesIcon, BotIcon, UserIcon } from 'lucide-react';

export interface CopilotChatWindowProps {
  documentId: string;
}

export function CopilotChatWindow({ documentId }: CopilotChatWindowProps) {
  const [messages, setMessages] = useState<{ id: string, role: string, content: string }[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Legal AI Copilot. I've analyzed this document. What would you like to know about the clauses, risks, or obligations?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Placeholder assistant message
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, messages: newMessages })
      });

      if (!res.ok) throw new Error('Network response was not ok');
      
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
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + '\n(Network error - please try again)' } : m));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] border-border-strong/50 shadow-lg bg-surface-1/50 backdrop-blur-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border-subtle bg-surface-2/80">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <SparklesIcon className="size-4" />
        </div>
        <div>
          <Text size="sm" weight="semibold" className="text-text-primary font-geist tracking-tight">Resolution Copilot</Text>
          <Text size="xs" tone="secondary" className="font-medium">Powered by Gemini 1.5 Pro</Text>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scroll-smooth">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-surface-3 text-text-secondary' : 'bg-brand-primary text-white shadow-md'}`}>
              {m.role === 'user' ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
            </div>
            
            <div className={`flex flex-col max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-surface-3 text-text-primary rounded-tr-sm' 
                  : 'bg-brand-primary/5 border border-brand-primary/20 text-text-primary rounded-tl-sm shadow-sm'
              }`}>
                <Text size="sm" className="font-inter leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </Text>
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-4 flex-row">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-md">
              <BotIcon className="size-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 rounded-tl-sm flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="size-2 rounded-full bg-brand-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="size-2 rounded-full bg-brand-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-surface-1 border-t border-border-subtle">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about liabilities, terms, or renegotiation strategies..."
            className="w-full pr-14 pl-5 py-4 rounded-[1.5rem] bg-surface-2 border-border-strong focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary shadow-inner"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 p-0 rounded-full bg-brand-primary hover:bg-brand-secondary transition-all shadow-md flex items-center justify-center text-white disabled:opacity-50 disabled:bg-surface-3 disabled:text-text-tertiary"
          >
            <SendIcon className="size-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

