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

    // Initialize Lenis scroll with harmonious multiplier & duration so content never lags behind
    const lenisInstance = new Lenis({
      duration: 1.35,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10.5 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.82, // Harmonized travel distance
      touchMultiplier: 1.3,
    });

    setLenis(lenisInstance);

    // Synchronize Lenis scroll event with GSAP ScrollTrigger updates
    lenisInstance.on('scroll', ScrollTrigger.update);

    // Bind GSAP ticker to Lenis requestAnimationFrame
    const updateTicker = (time: number) => {
      lenisInstance.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);

    // Configure lag smoothing for consistent frame delivery
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenisInstance.destroy();
      gsap.ticker.remove(updateTicker);
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
