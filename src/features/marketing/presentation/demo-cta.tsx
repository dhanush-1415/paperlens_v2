'use client';

import { useState } from 'react';
import DemoRequestModal from '@/shared/ui/DemoRequestModal';
import { Button } from '@/shared/ui';

export function DemoCTA() {
  const [isDemoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <Button
        variant="premium"
        onClick={() => setDemoOpen(true)}
        className="group animate-in fade-in slide-in-from-bottom-8 fill-mode-both delay-500 duration-1000"
      >
        Request a Live Demo
        <svg
          className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </Button>
      <DemoRequestModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
