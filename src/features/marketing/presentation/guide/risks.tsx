import { AlertTriangleIcon } from '@/shared/ui';

import { GUIDE_SECTION_IDS } from './section-ids';

export interface GuideRisksProps {
  risks: readonly string[];
}

export function GuideRisks({ risks }: GuideRisksProps) {
  if (risks.length === 0) return null;

  return (
    <section
      id={GUIDE_SECTION_IDS.risks}
      aria-labelledby="guide-risks-heading"
      className="relative w-full scroll-mt-24 overflow-hidden border-y border-border-strong/30 bg-surface-1/40 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(var(--risk-caution-rgb),0.05),transparent_50%)]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <div className="sticky top-32 flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-risk-caution/20 bg-risk-caution/5 px-4 py-1.5 text-xs font-bold tracking-widest text-risk-caution uppercase shadow-sm">
              What usually goes wrong
            </span>
            <h2
              id="guide-risks-heading"
              className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
            >
              The parts that cost people money
            </h2>
            <p className="text-sm leading-relaxed font-medium text-text-secondary md:text-base">
              Common to this kind of document, not read from yours. Which of these apply to the copy
              in your hand is exactly what an analysis answers.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {risks.map((risk) => (
              <li
                key={risk}
                className="group flex items-start gap-4 rounded-2xl border border-risk-caution/20 bg-surface-1/50 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-risk-caution/40 hover:shadow-md"
              >
                <span className="mt-[-4px] flex size-10 shrink-0 items-center justify-center rounded-full border border-risk-caution/20 bg-risk-caution/10 text-risk-caution transition-all group-hover:scale-110 group-hover:bg-risk-caution group-hover:text-canvas">
                  <AlertTriangleIcon aria-hidden className="size-5" />
                </span>
                <p className="text-base leading-relaxed text-text-secondary">{risk}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
