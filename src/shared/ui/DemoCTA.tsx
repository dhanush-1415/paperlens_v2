'use client';

import { useState } from 'react';
import DemoRequestModal from './DemoRequestModal';

export default function DemoCTA() {
  const [isDemoOpen, setDemoOpen] = useState(false);

  return (
    <>
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setDemoOpen(true)}
          className="rounded-lg border border-border-subtle bg-white/10 px-6 py-2 text-text-primary backdrop-blur-md transition hover:bg-white/20"
        >
          Request a Live Demo
        </button>
      </div>
      <DemoRequestModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
