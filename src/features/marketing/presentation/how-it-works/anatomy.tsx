import { DocumentExcerpt, RiskBadge } from '@/shared/ui';

interface Part {
 readonly label: string;
 readonly body: string;
}

const PARTS: readonly Part[] = [
 {
 label: 'The passage',
 body: 'The clause, exactly as written, with the operative words marked. Nothing is paraphrased at this step — if the wording is ambiguous, you see the ambiguity rather than our resolution of it.',
 },
 {
 label: 'The risk level',
 body: 'Critical, caution, or ordinary. Assigned by consequence, not by how alarming the language sounds: a clause written in frightening legalese that does nothing is ordinary, and a mild-sounding sentence that waives your right to a jury is not.',
 },
 {
 label: 'What it means',
 body: 'One or two sentences in the language you would use to explain it to a friend. No “pursuant to”, no “the aforementioned”, and no restating the clause with the same words in a different order.',
 },
 {
 label: 'The number or the date',
 body: 'The consequence, quantified, whenever the document makes that possible. “$160 per occurrence” and “notice due 1 November” are things you can act on. “Potentially significant penalties” is not.',
 },
];

export function HowItWorksAnatomy() {
 return (
 <section aria-labelledby="anatomy-heading" className="w-full py-24 relative overflow-hidden bg-surface-1/40 border-y border-border-strong/30">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(var(--brand-primary-rgb),0.05),transparent_50%)] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="flex flex-col gap-4 max-w-2xl">
 <span className="text-xs uppercase font-bold tracking-widest text-brand-primary">What you get back</span>
 <h2 id="anatomy-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 Every finding has the same four parts
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed">
 So the fifth one you read takes a second rather than a minute. This is one finding from
 a residential lease, taken apart.
 </p>
 </div>

 <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
 <div className="flex flex-col gap-4 rounded-[2rem] p-8 bg-surface-1/50 border border-border-strong/50 backdrop-blur-xl shadow-2xl relative">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -z-10" />
 
 <DocumentExcerpt level="critical" source="Clause 7.2 — Late payment">
 If rent is not received by the fifth (5th) day of each month, Tenant shall pay a late
 charge equal to <mark>five percent (5%) of the monthly rent</mark>.{' '}
 <mark>No grace period shall apply.</mark>
 </DocumentExcerpt>

 <div className="flex flex-col gap-3 rounded-2xl border border-border-strong/50 bg-canvas p-6 shadow-inner relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-risk-critical/10 rounded-full blur-2xl pointer-events-none" />
 <div className="flex flex-wrap items-center gap-3 relative z-10">
 <RiskBadge level="critical" />
 <span className="text-xs text-text-tertiary font-medium">
 $160 per occurrence
 </span>
 </div>
 <p className="text-lg font-bold text-text-primary relative z-10 mt-1">
 A single late payment costs $160
 </p>
 <p className="text-sm text-text-secondary leading-relaxed relative z-10">
 Five percent of the monthly rent, charged the moment the 5th passes. The clause
 explicitly removes the grace period most tenants assume they have.
 </p>
 </div>
 </div>

 <dl className="flex flex-col divide-y divide-border-subtle lg:pt-4">
 {PARTS.map((part) => (
 <div key={part.label} className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0 group">
 <dt className="text-base font-bold text-text-primary flex items-center gap-3">
 <span className="w-2 h-2 rounded-full bg-brand-primary/50 group-hover:bg-brand-primary transition-colors" />
 {part.label}
 </dt>
 <dd>
 <p className="text-sm text-text-secondary leading-relaxed pl-5">
 {part.body}
 </p>
 </dd>
 </div>
 ))}
 </dl>
 </div>
 </div>
 </section>
 );
}
