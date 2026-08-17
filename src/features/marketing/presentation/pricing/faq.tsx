import { Accordion, AccordionItem } from '@/shared/ui';

const FAQ_GROUP = 'pricing-faq';

interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

const FAQ: readonly FaqEntry[] = [
  {
    question: 'Do I need to pay to try it?',
    answer:
      'No. The free tier analyses five documents a month with the full report — every clause, every flag, every deadline. It is not a preview with the answers blurred out. What you pay for is volume, saved history and the ability to compare two versions of the same contract.',
  },
  {
    question: 'What happens when I hit the limit?',
    answer:
      'Analysis stops until the next month, or until you upgrade. Nothing is deleted, nothing is charged automatically, and you are told you are near the limit before you reach it rather than after.',
  },
  {
    question: 'Can I cancel?',
    answer:
      'Any time, from your settings, without emailing anyone. The plan runs to the end of the period you already paid for and then stops. There is no cancellation fee, no exit interview and no retention offer designed to make you click twice.',
  },
  {
    question: 'What happens to the documents I upload?',
    answer:
      'They are processed and then deleted. They are never used to train a model, never shown to anyone at PaperLens, and never sold or shared. On paid plans you can choose to keep a document in your history — that is a decision you make per document, and you can delete it again at any point.',
  },
  {
    question: 'Is this legal advice?',
    answer:
      'No, and it cannot be. PaperLens tells you what a document says and what a clause typically means — it does not know your circumstances, your jurisdiction’s latest case law, or what you should do. For anything consequential, it is a way to arrive at a lawyer already knowing which three clauses to ask about.',
  },
  {
    question: 'Is it ever wrong?',
    answer:
      'Yes. It can misread a badly scanned page, and it can miss the significance of a clause that only matters because of something not in the document. That is why every finding is shown next to the exact passage it came from: you are never asked to trust a summary you cannot check against the source in one glance.',
  },
];

export function PricingFaq() {
  return (
    <section aria-labelledby="pricing-faq-heading" className="relative w-full bg-canvas py-24">
      <div className="mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="relative flex flex-col gap-6 lg:col-span-5">
            <div className="sticky top-24">
              <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
                Questions
              </span>
              <h2
                id="pricing-faq-heading"
                className="mt-2 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
              >
                The things worth asking before you pay
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
                If yours is not here, ask us. A real person answers, and the answer is not a link
                back to this page.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Accordion variant="separated" className="flex flex-col gap-3">
              {FAQ.map((entry) => (
                <AccordionItem
                  key={entry.question}
                  variant="separated"
                  group={FAQ_GROUP}
                  title={entry.question}
                >
                  <p className="pb-4 text-sm leading-relaxed text-text-secondary">{entry.answer}</p>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
