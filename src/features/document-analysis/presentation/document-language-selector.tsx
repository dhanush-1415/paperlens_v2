'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/shared/ui/cn';

const REGIONS = ['Global', 'Asia Pacific', 'South Asia', 'Europe', 'Middle East & Africa'];

export interface DocumentLanguage {
  code:   string;
  name:   string;
  nameEn: string;
  region: string;
}

export const DOCUMENT_LANGUAGES: DocumentLanguage[] = [
  // -- Global ---------------------------------------------------------------
  { code: 'en', name: 'English',      nameEn: 'English',            region: 'Global'             },
  { code: 'es', name: 'Español',      nameEn: 'Spanish',            region: 'Global'             },
  { code: 'fr', name: 'Français',     nameEn: 'French',             region: 'Global'             },
  { code: 'pt', name: 'Português',    nameEn: 'Portuguese',         region: 'Global'             },

  // -- Asia Pacific ---------------------------------------------------------
  { code: 'zh', name: '中文',          nameEn: 'Simplified Chinese', region: 'Asia Pacific'       },
  { code: 'ja', name: '日本語',         nameEn: 'Japanese',           region: 'Asia Pacific'       },
  { code: 'ko', name: '한국어',         nameEn: 'Korean',             region: 'Asia Pacific'       },
  { code: 'id', name: 'Indonesia',    nameEn: 'Indonesian',         region: 'Asia Pacific'       },
  { code: 'vi', name: 'Tiếng Việt',   nameEn: 'Vietnamese',         region: 'Asia Pacific'       },
  { code: 'th', name: 'ภาษาไทย',        nameEn: 'Thai',               region: 'Asia Pacific'       },

  // -- South Asia -----------------------------------------------------------
  { code: 'hi', name: 'हिन्दी',        nameEn: 'Hindi',              region: 'South Asia'         },
  { code: 'bn', name: 'বাংলা',         nameEn: 'Bengali',            region: 'South Asia'         },
  { code: 'ur', name: 'اردو',          nameEn: 'Urdu',               region: 'South Asia'         },
  { code: 'ta', name: 'தமிழ்',         nameEn: 'Tamil',              region: 'South Asia'         },
  { code: 'te', name: 'తెలుగు',        nameEn: 'Telugu',             region: 'South Asia'         },

  // -- Europe ---------------------------------------------------------------
  { code: 'de', name: 'Deutsch',      nameEn: 'German',             region: 'Europe'             },
  { code: 'ru', name: 'Русский',      nameEn: 'Russian',            region: 'Europe'             },
  { code: 'it', name: 'Italiano',     nameEn: 'Italian',            region: 'Europe'             },
  { code: 'tr', name: 'Türkçe',       nameEn: 'Turkish',            region: 'Europe'             },
  { code: 'nl', name: 'Nederlands',   nameEn: 'Dutch',              region: 'Europe'             },
  { code: 'pl', name: 'Polski',       nameEn: 'Polish',             region: 'Europe'             },
  { code: 'uk', name: 'Українська',   nameEn: 'Ukrainian',          region: 'Europe'             },
  { code: 'el', name: 'Ελληνικά',     nameEn: 'Greek',              region: 'Europe'             },

  // -- Middle East & Africa -------------------------------------------------
  { code: 'ar', name: 'العربية',      nameEn: 'Arabic',             region: 'Middle East & Africa' },
  { code: 'fa', name: 'فارسی',        nameEn: 'Persian',            region: 'Middle East & Africa' },
  { code: 'sw', name: 'Kiswahili',    nameEn: 'Swahili',            region: 'Middle East & Africa' },
];

interface Props {
  currentLanguage: string | null; // null = auto
  onChange:        (locale: string | null) => void;
  disabled?:       boolean;
}

export function DocumentLanguageSelector({ currentLanguage, onChange, disabled }: Props) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  const currentLang = currentLanguage
    ? DOCUMENT_LANGUAGES.find(l => l.code === currentLanguage) ?? null
    : null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // Focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim()
    ? DOCUMENT_LANGUAGES.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.nameEn.toLowerCase().includes(query.toLowerCase()),
      )
    : null;

  function handleSelect(code: string | null) {
    onChange(code);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium',
          'cursor-pointer transition-all duration-150 select-none bg-surface-1 shadow-sm',
          currentLanguage
            ? 'border-brand-primary/40 bg-brand-primary/5 text-brand-primary hover:border-brand-primary/60 hover:bg-brand-primary/10'
            : 'border-border-subtle bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text-primary',
          disabled && 'pointer-events-none opacity-50',
          open && (currentLanguage
            ? 'border-brand-primary/60 bg-brand-primary/10'
            : 'border-border-strong bg-surface-2 text-text-primary'),
        )}
      >
        <Globe className={cn(
          'h-3 w-3 shrink-0 transition-colors',
          currentLanguage ? 'text-brand-primary' : 'text-text-tertiary',
        )} />
        <span className="max-w-[90px] truncate">
          {currentLang ? currentLang.name : 'Auto'}
        </span>
        <ChevronDown className={cn(
          'h-3 w-3 shrink-0 transition-transform duration-200 text-text-tertiary',
          open && 'rotate-180',
        )} />
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 bottom-[calc(100%+6px)] sm:bottom-auto sm:top-[calc(100%+6px)] z-50',
          'w-[280px] rounded-2xl border border-border-subtle',
          'bg-surface-1/95 backdrop-blur-xl',
          'shadow-lg',
          'overflow-hidden',
          'animate-in fade-in zoom-in-95 duration-150',
        )}>
          <div className="sticky top-0 z-10 bg-surface-1/98 backdrop-blur-sm border-b border-border-subtle/50 px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-border-subtle px-2.5 py-1.5 transition-colors focus-within:border-brand-primary/30">
              <Search className="h-3 w-3 shrink-0 text-text-tertiary" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search languages..."
                className="flex-1 min-w-0 bg-transparent text-[12px] text-text-primary placeholder:text-text-tertiary outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar py-1.5">
            {!query && (
              <div className="px-2 pb-1">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left',
                    'transition-colors duration-100',
                    currentLanguage === null
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-text-primary hover:bg-surface-2',
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-base shadow-sm border border-border-subtle/50">
                    🌐
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold leading-none">Auto</p>
                    <p className="text-[10px] text-text-tertiary mt-1 leading-tight">
                      Match document language
                    </p>
                  </div>
                  {currentLanguage === null && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
                  )}
                </button>
                <div className="mt-1 border-t border-border-subtle/50" />
              </div>
            )}

            {filtered !== null ? (
              <div className="px-2">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-text-tertiary">
                    No languages found
                  </p>
                ) : (
                  filtered.map(lang => (
                    <LangOption
                      key={lang.code}
                      lang={lang}
                      selected={currentLanguage === lang.code}
                      onSelect={handleSelect}
                    />
                  ))
                )}
              </div>
            ) : (
              REGIONS.map(region => {
                const langs = DOCUMENT_LANGUAGES.filter(l => l.region === region);
                if (!langs.length) return null;
                return (
                  <div key={region} className="px-2">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-tertiary/70">
                      {region}
                    </p>
                    {langs.map(lang => (
                      <LangOption
                        key={lang.code}
                        lang={lang}
                        selected={currentLanguage === lang.code}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-border-subtle/50 px-4 py-2 bg-surface-2/50">
            <p className="text-[10px] text-text-tertiary text-center">
              AI analysis & chat will use the selected language
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LangOption({
  lang,
  selected,
  onSelect,
}: {
  lang: { code: string; name: string; nameEn: string };
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lang.code)}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left',
        'transition-colors duration-100',
        selected
          ? 'bg-brand-primary/10 text-brand-primary'
          : 'text-text-primary hover:bg-surface-2',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn('text-[13px] font-medium leading-tight', selected && 'font-semibold')}>
          {lang.name}
        </p>
        <p className="text-[10px] text-text-tertiary mt-0.5 leading-none">{lang.nameEn}</p>
      </div>
      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-primary" />}
    </button>
  );
}
