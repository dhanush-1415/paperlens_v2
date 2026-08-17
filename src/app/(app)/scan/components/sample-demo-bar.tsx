'use client';

import { Sparkles, FileText, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';
import { cn } from '@/shared/ui/cn';

export interface SampleDoc {
  id: string;
  title: string;
  badge: string;
  category: string;
  icon: React.ElementType;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'irs-cp2000',
    title: 'IRS CP2000 Proposed Tax Adjustment',
    badge: 'IRS Tax Notice',
    category: 'High Urgency',
    icon: AlertTriangle,
    text: `Department of the Treasury — Internal Revenue Service\nNotice: CP2000\nTax Year: 2024\nNotice Date: May 20, 2026\nTaxpayer ID: XXX-XX-4412\n\nWe are proposing changes to your 2024 tax return. The income reported to us by third parties (employers, banks) does not match the income on your return.\n\nProposed amount you owe: $1,250.00\nRespond by: June 19, 2026\n\nYou can agree or disagree with these changes. If you disagree, send a signed statement and supporting documents explaining why. Respond by the date above to avoid additional interest and penalties.`,
  },
  {
    id: 'medical-bill',
    title: 'Out-Of-Network Emergency Room Bill',
    badge: 'Medical Bill',
    category: 'Financial Audit',
    icon: FileText,
    text: `METROPOLITAN HEALTH SYSTEM — STATEMENT OF ACCOUNT\nPatient: Alex Rivera\nAccount Number: MHS-9938102\nService Date: April 14, 2026\nStatement Date: May 02, 2026\n\nTotal Billed Amount: $4,850.00\nInsurance Paid (Out-of-Network): $1,200.00\nPatient Responsibility Due: $3,650.00\nPayment Due Date: June 05, 2026\n\nNotice: Under the No Surprises Act, emergency medical care provided by out-of-network providers may be protected against balance billing. If this was an emergency admission, you may request an independent dispute resolution review before submitting payment.`,
  },
  {
    id: 'lease-renewal',
    title: 'Apartment Lease Renewal & Rent Notice',
    badge: 'Real Estate Lease',
    category: 'Legal Review',
    icon: Scale,
    text: `OAKWOOD PROPERTY MANAGEMENT\nLease Renewal Offer\nTenant: Unit 207\nDate: June 2, 2026\n\nYour current lease expires on August 31, 2026. We would like to offer you a renewal for a new 12-month term.\n\nNew monthly rent: $1,480 (a $60 increase from your current rent)\nPlease sign and return the enclosed renewal agreement by July 15, 2026 to secure this rate. If we do not hear from you by July 15, your unit will be listed for new prospective tenants.`,
  },
  {
    id: 'gift-card-scam',
    title: 'IRS Arrest Warrant Gift Card Scam',
    badge: 'Scam Detection',
    category: 'Fraud Signal',
    icon: ShieldCheck,
    text: `URGENT — FINAL WARNING FROM IRS TAX DEPARTMENT\n\nThis is an automated legal notice. A warrant for your ARREST has been issued due to unpaid federal taxes. To cancel the arrest warrant you MUST pay immediately.\n\nPAY NOW using Apple Gift Cards or Google Play cards totaling $899.\nCall this number within 2 HOURS or police will be sent to your home.\nReply to this email with the gift card codes once purchased.\n\nDo not ignore this message. Failure to comply will result in immediate arrest and seizure of your bank accounts.`,
  },
];

interface SampleDemoBarProps {
  onSelectSample: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SampleDemoBar({ onSelectSample, disabled, className }: SampleDemoBarProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-brand-primary/20 bg-brand-primary/[0.02] p-4 sm:p-5',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <p className="text-xs font-bold tracking-wider text-text-primary uppercase">
            No document ready? Try a 1-Click Interactive Demo
          </p>
        </div>
        <span className="hidden rounded-full border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-primary sm:inline-block">
          Instant Pre-loaded Samples
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {SAMPLE_DOCUMENTS.map((doc) => {
          const Icon = doc.icon;
          return (
            <button
              key={doc.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSample(doc.text)}
              className={cn(
                'group flex min-w-[260px] flex-shrink-0 flex-col justify-between gap-2.5 rounded-xl border border-border-strong/50 bg-surface-1 p-3 text-left sm:min-w-0 sm:flex-shrink',
                'transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-primary/40 hover:bg-surface-2 hover:shadow-md',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-text-secondary transition-colors group-hover:text-brand-primary">
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {doc.badge}
                </span>
                <span className="text-[9px] font-bold tracking-wider text-text-tertiary uppercase">
                  {doc.category}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-snug font-semibold text-text-primary">
                {doc.title}
              </p>
              <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-brand-primary group-hover:underline">
                Decode this demo →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
