'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export function AuthAnimation({ children }: { children: React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Elegant form container entrance
      gsap.fromTo(
        '.auth-box',
        { y: 30, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
      );

      // Left pane text stagger
      gsap.fromTo(
        '.auth-text-stagger',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.2 },
      );
    },
    { scope: container },
  );

  return (
    <div ref={container} className="flex min-h-screen w-full">
      {children}
    </div>
  );
}
