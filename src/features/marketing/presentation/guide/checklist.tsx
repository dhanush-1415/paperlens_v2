import { GUIDE_SECTION_IDS } from './section-ids';

export interface GuideChecklistProps {
 steps: readonly string[];
}

export function GuideChecklist({ steps }: GuideChecklistProps) {
 if (steps.length === 0) return null;

 return (
 <section
 id={GUIDE_SECTION_IDS.checklist}
 aria-labelledby="guide-checklist-heading"
 className="w-full py-24 relative bg-canvas scroll-mt-24 border-b border-border-strong/30"
 >
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[140px] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16 items-start">
 <div className="flex flex-col gap-6 sticky top-32">
 <span className="inline-flex items-center gap-2 border border-brand-primary/20 bg-brand-primary/5 rounded-full px-4 py-1.5 text-xs font-bold text-brand-primary tracking-widest uppercase shadow-sm w-fit">
 What to do
 </span>
 <h2 id="guide-checklist-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 In this order, starting today
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
 The sequence matters. Each step assumes the one before it is done — doing them out of
 order is how people end up agreeing to something they could have disputed.
 </p>
 </div>

 <div className="flex flex-col gap-6">
 <ol className="flex flex-col relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-gradient-to-b before:from-border-strong before:via-border-subtle before:to-transparent">
 {steps.map((step, index) => (
 <li
 key={step}
 className="relative pl-14 pb-8 last:pb-0 group"
 >
 <span
 aria-hidden
 className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-sm font-bold text-text-primary shadow-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-canvas group-hover:border-brand-primary transition-all duration-300 z-10"
 >
 {String(index + 1).padStart(2, '0')}
 </span>
 <div className="flex flex-col rounded-2xl bg-surface-1/40 border border-border-strong/50 backdrop-blur-md p-6 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:border-brand-primary/30 group-hover:-translate-y-0.5 mt-[-6px]">
 <p className="text-base text-text-secondary leading-relaxed">
 {step}
 </p>
 </div>
 </li>
 ))}
 </ol>
 </div>
 </div>
 </div>
 </section>
 );
}
