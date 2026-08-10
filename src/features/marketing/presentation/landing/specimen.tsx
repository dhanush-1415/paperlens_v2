'use client';

/**
 * The sample analysis — the section that does the selling.
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { DocumentExcerpt, Heading, RiskBadge, Section, Container, Stack, Text } from '@/shared/ui';

import type { RiskTone } from '@/shared/ui/tone';

export interface LandingSpecimenProps {
 /** Anchor target for the hero's secondary action. */
 id: string;
}

interface Finding {
 readonly level: RiskTone;
 readonly title: string;
 readonly body: string;
 /** The consequence in numbers, when there is one. Rendered with tabular figures. */
 readonly consequence?: string;
}

const FINDINGS: readonly Finding[] = [
 {
 level: 'critical',
 title: 'A single late payment costs $160',
 body: 'Five percent of the monthly rent, charged the moment the 5th passes. The clause explicitly removes the grace period most tenants assume they have.',
 consequence: '$160 per occurrence',
 },
 {
 level: 'caution',
 title: 'The lease renews itself unless you act first',
 body: 'It rolls into another 12-month term automatically. Written notice is required at least 60 days before expiry — which puts the real deadline two months before the date on the front page.',
 consequence: 'Notice due 1 Nov 2026',
 },
 {
 level: 'safe',
 title: 'The deposit terms are ordinary',
 body: 'One month held, returned within 30 days of move-out, itemised deductions. Nothing here differs from what state law already requires.',
 },
];

function FindingRow({ level, title, body, consequence }: Finding) {
 return (
 <li className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0 finding-row">
 <div className="flex flex-wrap items-center gap-3">
 <RiskBadge level={level} />
 {consequence ? (
 <Text as="span" size="xs" tone="tertiary" className="tabular">
 {consequence}
 </Text>
 ) : null}
 </div>
 <Text as="p" size="md" tone="primary" weight="semibold">
 {title}
 </Text>
 <Text as="p" size="sm" tone="secondary" editorial>
 {body}
 </Text>
 </li>
 );
}

export function LandingSpecimen({ id }: LandingSpecimenProps) {
 const sectionRef = useRef<HTMLDivElement>(null);
 const leftColRef = useRef<HTMLDivElement>(null);
 const rightColRef = useRef<HTMLUListElement>(null);

 useEffect(() => {
 gsap.registerPlugin(ScrollTrigger);
 
 const ctx = gsap.context(() => {
 // Animate the left column excerpts
 if (leftColRef.current) {
 gsap.from(leftColRef.current.querySelectorAll('.document-excerpt-wrapper'), {
 scrollTrigger: {
 trigger: leftColRef.current,
 start: 'top 80%',
 },
 y: 40,
 opacity: 0,
 duration: 0.8,
 stagger: 0.3,
 ease: 'power3.out',
 });
 }

 // Animate the right column findings
 if (rightColRef.current) {
 gsap.from(rightColRef.current.querySelectorAll('.finding-row'), {
 scrollTrigger: {
 trigger: rightColRef.current,
 start: 'top 75%',
 },
 x: 40,
 opacity: 0,
 duration: 0.8,
 stagger: 0.3,
 ease: 'power3.out',
 });
 }
 }, sectionRef);

 return () => ctx.revert();
 }, []);

 return (
 <section id={id} className="force-dark w-full py-24 relative overflow-hidden bg-surface-1/20 border-y border-border-strong/30 scroll-mt-20" ref={sectionRef}>
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto px-6 flex flex-col gap-12 relative z-10">
 
 <div className="flex flex-col gap-3 max-w-2xl">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">Sample Analysis</span>
 <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 One clause in. Three things you can act on, out.
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed">
 This is the whole product in one screen: the passage exactly as it appears in the document, and what it means for the person who has to sign it.
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
 
 {/* Left Column: From the Document */}
 <div className="flex flex-col gap-6" ref={leftColRef}>
 <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">From the document</span>
 <div className="flex flex-col gap-6 w-full">
 <div className="document-excerpt-wrapper w-full">
 <DocumentExcerpt level="critical" source="Clause 7.2 — Late payment">
 If rent is not received by the fifth (5th) day of each month, Tenant shall pay a
 late charge equal to <mark>five percent (5%) of the monthly rent</mark>.{' '}
 <mark>No grace period shall apply</mark>, and acceptance of a late payment shall not
 constitute a waiver of this provision.
 </DocumentExcerpt>
 </div>
 <div className="document-excerpt-wrapper w-full">
 <DocumentExcerpt level="caution" source="Clause 11.1 — Term and renewal">
 This Lease shall{' '}
 <mark>automatically renew for successive twelve (12) month terms</mark> unless
 either party provides written notice of non-renewal{' '}
 <mark>not less than sixty (60) days prior</mark> to the expiration of the
 then-current term.
 </DocumentExcerpt>
 </div>
 </div>
 </div>

 {/* Right Column: What PaperLens Returns */}
 <div className="flex flex-col gap-6">
 <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">What PaperLens returns</span>
 <ul className="w-full divide-y divide-border-subtle/50 rounded-2xl border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl" ref={rightColRef}>
 {FINDINGS.map((finding) => (
 <FindingRow key={finding.title} {...finding} />
 ))}
 </ul>
 </div>

 </div>

 <p className="text-[10px] text-text-tertiary max-w-2xl mt-4">
 A specimen lease written for this page, not a customer&rsquo;s document. Your files are deleted after analysis, are never shown to anyone, and are never used to train a model.
 </p>

 </div>
 </section>
 );
}
