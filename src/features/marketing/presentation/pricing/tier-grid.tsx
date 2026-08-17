import Link from 'next/link';
import type { Route } from 'next';
import { formatUsd, monthsSavedAnnually, type PricingTier, type TierFeature } from '../../domain';
import { ROUTES } from '@/shared/constants/routes';

const TIER_HREF: Record<PricingTier['id'], Route> = {
  free: ROUTES.scan,
  pro: ROUTES.signup,
  business: ROUTES.support,
};

export interface PricingTierGridProps {
  tiers: readonly PricingTier[];
}

function FeatureRow({ label, included, note }: TierFeature) {
  return (
    <li className="flex gap-3">
      {included ? (
        <svg
          className="mt-0.5 size-4 shrink-0 text-brand-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="mt-0.5 size-4 shrink-0 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="sr-only">{included ? 'Included: ' : 'Not included: '}</span>
        <span
          className={`text-sm ${included ? 'text-text-secondary' : 'text-text-tertiary line-through'}`}
        >
          {label}
        </span>
        {note ? <span className="text-2xs text-text-tertiary">{note}</span> : null}
      </span>
    </li>
  );
}

function TierCard({ tier }: { tier: PricingTier }) {
  const monthsSaved = monthsSavedAnnually(tier);
  const headingId = `tier-${tier.id}`;

  const isPro = tier.highlighted;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl p-8 shadow-2xl transition-all duration-300 ${
        isPro
          ? '-translate-y-2 border-2 border-brand-primary/40 bg-surface-2'
          : 'border border-border-strong/50 bg-surface-1/40 backdrop-blur-xl'
      }`}
      aria-labelledby={headingId}
    >
      {isPro && (
        <div className="pointer-events-none absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-brand-primary/20 blur-[80px]" />
      )}

      <div className="relative z-10 flex flex-1 flex-col gap-6">
        <div className="flex w-full items-center justify-between gap-3">
          <h3 id={headingId} className="text-xl font-bold text-text-primary">
            {tier.name}
          </h3>
          {isPro && (
            <span className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold tracking-wide text-brand-primary uppercase shadow-sm">
              Recommended
            </span>
          )}
        </div>

        <p className="h-10 text-sm leading-relaxed text-text-secondary">{tier.tagline}</p>

        <div className="my-4 flex flex-col gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-text-primary md:text-5xl">
              {formatUsd(tier.monthlyCents)}
            </span>
            <span className="text-sm font-medium text-text-tertiary">/ month</span>
          </div>
          <div className="h-4">
            {monthsSaved > 0 && (
              <span className="text-xs font-semibold text-brand-primary">
                {formatUsd(tier.annualMonthlyCents)}/month billed annually — {monthsSaved} months
                free
              </span>
            )}
          </div>
        </div>

        <Link
          href={TIER_HREF[tier.id]}
          className={`w-full rounded-xl py-3.5 text-center text-sm font-bold transition-all ${
            isPro
              ? 'bg-brand-primary text-canvas shadow-[0_0_20px_-5px_rgba(var(--brand-primary-rgb),0.5)] hover:bg-brand-primary-hover'
              : 'bg-surface-3 border border-border-strong text-text-primary hover:bg-surface-raised'
          }`}
        >
          {tier.cta}
        </Link>

        <ul className="mt-6 flex flex-1 flex-col gap-4 border-t border-border-strong/50 pt-6">
          {tier.features.map((feature, i) => (
            <FeatureRow key={i} {...feature} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PricingTierGrid({ tiers }: PricingTierGridProps) {
  return (
    <section className="relative w-full bg-canvas py-12 md:py-20">
      <div className="relative z-10 mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}
