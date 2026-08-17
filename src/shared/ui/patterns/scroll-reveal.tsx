'use client';

import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/shared/ui/cn';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /**
   * The animation style to apply.
   * - `fade-up`: Standard elegant slide up and fade in.
   * - `stagger-children`: Expects children to have a `.reveal-item` class to stagger them.
   */
  variant?: 'fade-up' | 'stagger-children';
  /** Optional delay in seconds */
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  variant = 'fade-up',
  delay = 0,
}: ScrollRevealProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!container.current) return;

      if (variant === 'fade-up') {
        gsap.fromTo(
          container.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container.current,
              start: 'top 105%',
              toggleActions: 'play none none none',
              fastScrollEnd: true,
            },
          },
        );
      } else if (variant === 'stagger-children') {
        gsap.fromTo(
          gsap.utils.toArray('.reveal-item', container.current),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.05,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: container.current,
              start: 'top 105%',
              toggleActions: 'play none none none',
              fastScrollEnd: true,
            },
          },
        );
      }
    },
    { scope: container },
  );

  return (
    <div ref={container} className={cn('will-change-[opacity,transform]', className)}>
      {children}
    </div>
  );
}
