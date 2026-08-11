import Link from 'next/link';

import { ROUTES } from '@/shared/constants/routes';
import { ArrowRightIcon } from '@/shared/ui';

interface Limit {
 readonly title: string;
 readonly body: string;
}

const LIMITS: readonly Limit[] = [
 {
 title: 'It is not legal advice, and it cannot be',
 body: 'It tells you what a document says and what a clause usually means. It does not know your circumstances, your jurisdiction’s most recent case law, or what you should do about any of it. Where the stakes are high, this is a way to reach a lawyer already knowing which three clauses to ask about — which is a cheaper hour than the one that starts with reading.',
 },
 {
 title: 'It can misread a bad scan',
 body: 'A photograph taken at an angle in poor light, a fax of a fax, handwriting in a margin — character recognition on any of those can drop a digit or a “not”. This is why every finding shows the passage it came from: a misread is visible in one glance, rather than hidden inside a confident summary.',
 },
 {
 title: 'It only knows what is in the document',
 body: 'A clause can be unremarkable on the page and ruinous because of a side letter, a prior agreement, or a conversation you had in a car park. Nothing that is not in the file you gave it is part of the analysis, and it does not guess at what might be.',
 },
 {
 title: 'It does not tell you what to sign',
 body: 'It will tell you that a clause renews automatically, that the notice window closes in six weeks, and what that costs if you miss it. Whether the deal is worth it is a judgement about your life, and no software has the standing to make it for you.',
 },
];

export function HowItWorksLimits() {
 return (
 <section aria-labelledby="limits-heading" className="w-full py-24 relative overflow-hidden bg-canvas">
 <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[140px] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="grid gap-12 lg:grid-cols-12">
 
 <div className="lg:col-span-5 flex flex-col gap-6 relative">
 <div className="sticky top-24">
 <span className="inline-flex items-center gap-2 border border-brand-primary/20 bg-brand-primary/5 rounded-full px-4 py-1.5 text-xs font-bold text-brand-primary tracking-widest uppercase shadow-sm">
 Honest limits
 </span>
 <h2 id="limits-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary mt-6">
 What it will not do for you
 </h2>
 <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed">
 Written down here, before you rely on it, rather than in the terms you agree to
 without reading.
 </p>
 <Link
 href={ROUTES.security}
 className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-brand-primary-hover transition-colors"
 >
 How your documents are handled
 <ArrowRightIcon
 aria-hidden
 className="size-4 transition-transform duration-300 group-hover:translate-x-1"
 />
 </Link>
 </div>
 </div>

 <div className="lg:col-span-7">
 <div className="flex flex-col gap-4">
 {LIMITS.map((limit) => (
 <div 
 key={limit.title} 
 className="flex flex-col gap-3 p-8 rounded-3xl bg-surface-1 border border-border-strong shadow-card transition-all duration-500 hover:shadow-2xl hover:border-brand-primary/40 hover:-translate-y-1 relative overflow-hidden group/limit"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[30px] opacity-0 group-hover/limit:opacity-100 transition-opacity duration-700 pointer-events-none" />
 <h3 className="text-xl font-bold text-text-primary z-10">
 {limit.title}
 </h3>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed z-10">
 {limit.body}
 </p>
 </div>
 ))}
 </div>
 </div>
 
 </div>
 </div>
 </section>
 );
}
