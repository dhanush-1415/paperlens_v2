'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollProvider({ children }: { children: React.ReactNode }) {
 useEffect(() => {
 // Register GSAP plugins
 gsap.registerPlugin(ScrollTrigger);

 // Initialize Lenis scroll with harmonious multiplier & duration so content never lags behind
 const lenis = new Lenis({
 duration: 1.35,
 easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10.5 * t)),
 orientation: 'vertical',
 gestureOrientation: 'vertical',
 smoothWheel: true,
 wheelMultiplier: 0.82, // Harmonized travel distance
 touchMultiplier: 1.3,
 });

 // Synchronize Lenis scroll event with GSAP ScrollTrigger updates
 lenis.on('scroll', ScrollTrigger.update);

 // Bind GSAP ticker to Lenis requestAnimationFrame
 const updateTicker = (time: number) => {
 lenis.raf(time * 1000);
 };
 gsap.ticker.add(updateTicker);

 // Configure lag smoothing for consistent frame delivery
 gsap.ticker.lagSmoothing(0);

 return () => {
 lenis.destroy();
 gsap.ticker.remove(updateTicker);
 };
 }, []);

 return <>{children}</>;
}
