'use client';

import { useState } from 'react';
import { Scale, Globe } from 'lucide-react';
import { cn } from '@/shared/ui/cn';
import { DocumentLanguageSelector } from './document-language-selector';
import { toast } from 'sonner';

export function DocumentSettings({
  documentId,
  initialLanguage = null,
  initialTone = 'simple',
}: {
  documentId: string;
  initialLanguage?: string | null;
  initialTone?: 'simple' | 'professional';
}) {
  const [tone, setTone] = useState<'simple' | 'professional'>(initialTone);
  const [language, setLanguage] = useState<string | null>(initialLanguage);

  const handleToneChange = (newTone: 'simple' | 'professional') => {
    setTone(newTone);
    toast.success(`Tone changed to ${newTone}`);
    // Future backend integration: trigger re-analyze here
  };

  const handleLanguageChange = (newLang: string | null) => {
    setLanguage(newLang);
    toast.success(newLang ? `Language updated` : 'Language set to Auto');
    // Future backend integration: trigger re-analyze here
  };

  return (
    <div className="mx-1 my-2 flex flex-col gap-3">
      {/* Tone Setting */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-2 px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/20">
            <Scale className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs leading-none font-semibold text-text-primary">
              Explanation style
            </p>
            <p className="mt-1 text-[11px] leading-none text-text-tertiary">
              Plain language or full terminology
            </p>
          </div>
        </div>
        <div className="flex shrink-0 rounded-lg border border-border-strong bg-surface-1 p-1">
          {(['simple', 'professional'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleToneChange(t)}
              className={cn(
                'flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                tone === t
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t === 'simple' ? 'Simple' : 'Professional'}
            </button>
          ))}
        </div>
      </div>

      {/* Language Setting */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-2 px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/20">
            <Globe className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs leading-none font-semibold text-text-primary">
              Response language
            </p>
            <p className="mt-1 text-[11px] leading-none text-text-tertiary">
              AI will reply in this language
            </p>
          </div>
        </div>
        <DocumentLanguageSelector currentLanguage={language} onChange={handleLanguageChange} />
      </div>
    </div>
  );
}
