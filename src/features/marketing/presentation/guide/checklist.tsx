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
      className="relative w-full scroll-mt-24 border-b border-border-strong/30 bg-canvas py-24"
    >
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-brand-primary/5 blur-[140px]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <div className="sticky top-32 flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-primary uppercase shadow-sm">
              What to do
            </span>
            <h2
              id="guide-checklist-heading"
              className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
            >
              In this order, starting today
            </h2>
            <p className="text-sm leading-relaxed font-medium text-text-secondary md:text-base">
              The sequence matters. Each step assumes the one before it is done — doing them out of
              order is how people end up agreeing to something they could have disputed.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <ol className="relative flex flex-col before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-gradient-to-b before:from-border-strong before:via-border-subtle before:to-transparent">
              {steps.map((step, index) => (
                <li key={step} className="group relative pb-8 pl-14 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute top-0 left-0 z-10 flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-sm font-bold text-text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-canvas"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="mt-[-6px] flex flex-col rounded-2xl border border-border-strong/50 bg-surface-1/40 p-6 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-brand-primary/30 group-hover:shadow-lg">
                    <p className="text-base leading-relaxed text-text-secondary">{step}</p>
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
