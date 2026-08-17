'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function ScrollReset({ lenis }: { lenis: Lenis | null }) {
  const pathname = usePathname();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, lenis]);

  return null;
}

export default function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis scroll for ultra-smooth performance
    const lenisInstance = new Lenis({
      lerp: 0.1, // Linear interpolation for buttery smooth scroll
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1, 
      touchMultiplier: 2,
    });

    setTimeout(() => setLenis(lenisInstance), 0);

    // Use native requestAnimationFrame for maximum performance
    // We REMOVED the manual ScrollTrigger.update() call. Lenis drives native scroll, 
    // so GSAP will automatically detect it without forcing expensive sync layouts!
    let rafId: number;
    function raf(time: number) {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      lenisInstance.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <ScrollReset lenis={lenis} />
      </Suspense>
      {children}
    </>
  );
}
