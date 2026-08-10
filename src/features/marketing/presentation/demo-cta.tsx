'use client';

import { useState } from 'react';
import DemoRequestModal from '@/shared/ui/DemoRequestModal';

export function DemoCTA() {
 const [isDemoOpen, setDemoOpen] = useState(false);

 return (
 <>
 <button
 onClick={() => setDemoOpen(true)}
 className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-surface-2 border border-border-subtle px-8 py-3 text-sm font-medium text-text-primary transition-all hover:bg-surface-raised hover:border-brand-primary/30 hover:shadow-[0_0_20px_rgba(91,140,255,0.2)] active:scale-95 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both"
 >
 <span className="absolute inset-0 bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
 Request a Live Demo
 <svg className="size-4 transition-transform duration-300 group-hover:translate-x-1 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
 </svg>
 </button>
 <DemoRequestModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />
 </>
 );
}
