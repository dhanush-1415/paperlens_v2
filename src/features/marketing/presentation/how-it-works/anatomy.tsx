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
    <section
      aria-labelledby="anatomy-heading"
      className="relative w-full overflow-hidden border-y border-border-strong/30 bg-surface-1/40 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(var(--brand-primary-rgb),0.05),transparent_50%)]" />

      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">
            What you get back
          </span>
          <h2
            id="anatomy-heading"
            className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
          >
            Every finding has the same four parts
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary md:text-base">
            So the fifth one you read takes a second rather than a minute. This is one finding from
            a residential lease, taken apart.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative flex flex-col gap-4 rounded-[2rem] border border-border-strong/50 bg-surface-1/50 p-8 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/10 blur-[80px]" />

            <DocumentExcerpt level="critical" source="Clause 7.2 — Late payment">
              If rent is not received by the fifth (5th) day of each month, Tenant shall pay a late
              charge equal to <mark>five percent (5%) of the monthly rent</mark>.{' '}
              <mark>No grace period shall apply.</mark>
            </DocumentExcerpt>

            <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border-strong/50 bg-canvas p-6 shadow-inner">
              <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-risk-critical/10 blur-2xl" />
              <div className="relative z-10 flex flex-wrap items-center gap-3">
                <RiskBadge level="critical" />
                <span className="text-xs font-medium text-text-tertiary">$160 per occurrence</span>
              </div>
              <p className="relative z-10 mt-1 text-lg font-bold text-text-primary">
                A single late payment costs $160
              </p>
              <p className="relative z-10 text-sm leading-relaxed text-text-secondary">
                Five percent of the monthly rent, charged the moment the 5th passes. The clause
                explicitly removes the grace period most tenants assume they have.
              </p>
            </div>
          </div>

          <dl className="flex flex-col divide-y divide-border-subtle lg:pt-4">
            {PARTS.map((part) => (
              <div key={part.label} className="group flex flex-col gap-2 py-6 first:pt-0 last:pb-0">
                <dt className="flex items-center gap-3 text-base font-bold text-text-primary">
                  <span className="h-2 w-2 rounded-full bg-brand-primary/50 transition-colors group-hover:bg-brand-primary" />
                  {part.label}
                </dt>
                <dd>
                  <p className="pl-5 text-sm leading-relaxed text-text-secondary">{part.body}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
