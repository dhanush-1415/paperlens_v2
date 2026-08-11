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
 <svg className="size-4 shrink-0 text-brand-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
 </svg>
 ) : (
 <svg className="size-4 shrink-0 text-text-tertiary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 )}
 <span className="min-w-0 flex flex-col gap-0.5">
 <span className="sr-only">{included ? 'Included: ' : 'Not included: '}</span>
 <span className={`text-sm ${included ? 'text-text-secondary' : 'text-text-tertiary line-through'}`}>
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
 className={`relative flex flex-col rounded-3xl p-8 shadow-2xl overflow-hidden transition-all duration-300 ${
 isPro 
 ? 'bg-surface-2 border-2 border-brand-primary/40 -translate-y-2' 
 : 'bg-surface-1/40 border border-border-strong/50 backdrop-blur-xl'
 }`}
 aria-labelledby={headingId}
 >
 {isPro && (
 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-[80px] pointer-events-none -z-10" />
 )}

 <div className="flex flex-col gap-6 relative z-10 flex-1">
 <div className="flex w-full items-center justify-between gap-3">
 <h3 id={headingId} className="text-xl font-bold text-text-primary">
 {tier.name}
 </h3>
 {isPro && (
 <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wide uppercase border border-brand-primary/20 shadow-sm">
 Recommended
 </span>
 )}
 </div>
 
 <p className="text-sm text-text-secondary leading-relaxed h-10">
 {tier.tagline}
 </p>

 <div className="flex flex-col gap-1 my-4">
 <div className="flex items-baseline gap-1.5">
 <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary">
 {formatUsd(tier.monthlyCents)}
 </span>
 <span className="text-sm text-text-tertiary font-medium">/ month</span>
 </div>
 <div className="h-4">
 {monthsSaved > 0 && (
 <span className="text-xs font-semibold text-brand-primary">
 {formatUsd(tier.annualMonthlyCents)}/month billed annually — {monthsSaved} months free
 </span>
 )}
 </div>
 </div>

 <Link
 href={TIER_HREF[tier.id]}
 className={`w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all ${
 isPro 
 ? 'bg-brand-primary text-canvas shadow-[0_0_20px_-5px_rgba(var(--brand-primary-rgb),0.5)] hover:bg-brand-primary-hover' 
 : 'bg-surface-3 text-text-primary border border-border-strong hover:bg-surface-raised'
 }`}
 >
 {tier.cta}
 </Link>

 <ul className="flex flex-col gap-4 mt-6 pt-6 border-t border-border-strong/50 flex-1">
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
 <section className="w-full py-12 md:py-20 relative bg-canvas">
 <div className="w-[95%] md:w-[90%] lg:w-[80%] mx-auto relative z-10">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
 {tiers.map((tier) => (
 <TierCard key={tier.id} tier={tier} />
 ))}
 </div>
 </div>
 </section>
 );
}
