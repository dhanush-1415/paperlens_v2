import { Accordion, AccordionItem } from '@/shared/ui';

import type { GuideFaq } from '../../domain';
import { GUIDE_SECTION_IDS } from './section-ids';

const FAQ_GROUP = 'guide-faq';

export interface GuideFaqSectionProps {
 faqs: readonly GuideFaq[];
}

export function GuideFaqSection({ faqs }: GuideFaqSectionProps) {
 if (faqs.length === 0) return null;

 return (
 <section
 id={GUIDE_SECTION_IDS.faq}
 aria-labelledby="guide-faq-heading"
 className="w-full py-24 relative overflow-hidden bg-canvas scroll-mt-24 border-b border-border-strong/30"
 >
 <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />

 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16 items-start">
 <div className="flex flex-col gap-6 sticky top-32">
 <span className="inline-flex items-center gap-2 border border-brand-primary/20 bg-brand-primary/5 rounded-full px-4 py-1.5 text-xs font-bold text-brand-primary tracking-widest uppercase shadow-sm w-fit">
 Questions
 </span>
 <h2 id="guide-faq-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
 What people ask about this document
 </h2>
 <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
 General answers about this kind of document. What yours says is a different question,
 and one only your copy can answer.
 </p>
 </div>

 <Accordion variant="separated" className="flex flex-col gap-4">
 {faqs.map((faq) => (
 <div key={faq.question} className="rounded-2xl border border-border-strong bg-surface-1/40 backdrop-blur-md shadow-sm transition-all hover:border-brand-primary/30 hover:shadow-md">
 <AccordionItem
 variant="separated"
 group={FAQ_GROUP}
 title={faq.question}
 >
 <p className="text-sm text-text-secondary leading-relaxed p-6 pt-0">
 {faq.answer}
 </p>
 </AccordionItem>
 </div>
 ))}
 </Accordion>
 </div>
 </div>
 </section>
 );
}
