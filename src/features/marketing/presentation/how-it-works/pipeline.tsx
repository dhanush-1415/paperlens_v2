import { CheckIcon } from '@/shared/ui';

interface Stage {
  readonly title: string;
  readonly body: string;
  readonly details: readonly string[];
}

const STAGES: readonly Stage[] = [
  {
    title: 'Give it the document',
    body: 'However it reached you. A PDF from an email, a photograph of a letter taken on a kitchen table at an angle, a page pasted out of a portal that would not let you download anything.',
    details: [
      'PDF, Word, images, or text pasted straight in',
      'Phone photos, including the badly lit ones',
      'Scans and faxes, where the text is an image of text',
      'No account, and nothing to install',
    ],
  },
  {
    title: 'It reads the whole thing',
    body: 'Not the first page, and not a summary of a summary. Every clause is read in the context of every other clause, which is what makes it possible to notice that the notice period on page nine contradicts the term on page one.',
    details: [
      'Optical character recognition on scans and photographs',
      'Cross-references resolved — a clause that points at a schedule is read with it',
      'Dates, amounts and durations extracted as values, not as words',
    ],
  },
  {
    title: 'You get it back in order of what it costs you',
    body: 'The report is not the document rearranged. It leads with the clause that has the largest consequence, and each finding carries the exact passage it came from so you can check the work in one glance.',
    details: [
      'Every finding paired with its source passage',
      'Risk level on each: critical, caution, or ordinary',
      'Deadlines as real dates, with the notice period worked backwards',
      'What to do next, in one sentence per finding',
    ],
  },
  {
    title: 'Ask it the question you actually have',
    body: '“Can they raise the rent mid-term?” is not a search query, and it is the question people actually have. Follow-ups are answered in plain English and cite the clause the answer rests on.',
    details: [
      'Answers quote the document rather than paraphrasing it',
      'It says so when the document does not answer the question',
      'The conversation stays with the document it is about',
    ],
  },
  {
    title: 'Keep it, or let it go',
    body: 'Documents are deleted after analysis unless you say otherwise. Saving one is a decision you make per document, and un-saving it deletes it — there is no archive of things you thought you had removed.',
    details: [
      'Deleted after analysis by default',
      'Never used to train a model, in any tier',
      'Saved history on paid plans, searchable and deletable',
    ],
  },
];

export function HowItWorksPipeline() {
  return (
    <section aria-labelledby="pipeline-heading" className="relative w-full bg-canvas py-24">
      <div className="mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="mb-16 flex max-w-2xl flex-col gap-4">
          <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
            The sequence
          </span>
          <h2
            id="pipeline-heading"
            className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
          >
            Five stages, and you are present for one of them
          </h2>
        </div>

        <ol className="relative flex flex-col before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-gradient-to-b before:from-brand-primary/40 before:via-brand-primary/20 before:to-transparent">
          {STAGES.map((stage, index) => (
            <li key={stage.title} className="group relative pb-16 pl-12 last:pb-0">
              <span
                aria-hidden
                className="absolute top-0 left-0 z-10 flex size-8 items-center justify-center rounded-full border-2 border-surface-1 bg-brand-primary/10 text-xs font-bold text-brand-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-text-on-brand group-hover:shadow-brand-primary/40"
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="group/card relative flex max-w-4xl flex-col gap-4 overflow-hidden rounded-3xl border border-border-strong bg-surface-1 p-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-2xl hover:shadow-brand-primary/10">
                <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-brand-primary/10 opacity-0 blur-[60px] transition-opacity duration-700 group-hover/card:opacity-100" />

                <h3 className="z-10 text-xl font-bold text-text-primary">{stage.title}</h3>
                <p className="z-10 text-sm leading-relaxed text-text-secondary md:text-base">
                  {stage.body}
                </p>

                <ul className="z-10 mt-4 flex flex-col gap-3 border-t border-border-subtle pt-6">
                  {stage.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3">
                      <CheckIcon
                        aria-hidden
                        className="mt-0.5 size-5 shrink-0 text-brand-primary"
                      />
                      <span className="text-sm font-medium text-text-secondary">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
