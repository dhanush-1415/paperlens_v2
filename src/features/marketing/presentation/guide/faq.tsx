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
      className="relative w-full scroll-mt-24 overflow-hidden border-b border-border-strong/30 bg-canvas py-24"
    >
      <div className="pointer-events-none absolute top-0 left-0 h-[400px] w-[400px] rounded-full bg-brand-primary/5 blur-[120px]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <div className="sticky top-32 flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-primary uppercase shadow-sm">
              Questions
            </span>
            <h2
              id="guide-faq-heading"
              className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
            >
              What people ask about this document
            </h2>
            <p className="text-sm leading-relaxed font-medium text-text-secondary md:text-base">
              General answers about this kind of document. What yours says is a different question,
              and one only your copy can answer.
            </p>
          </div>

          <Accordion variant="separated" className="flex flex-col gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-border-strong bg-surface-1/40 shadow-sm backdrop-blur-md transition-all hover:border-brand-primary/30 hover:shadow-md"
              >
                <AccordionItem variant="separated" group={FAQ_GROUP} title={faq.question}>
                  <p className="p-6 pt-0 text-sm leading-relaxed text-text-secondary">
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
