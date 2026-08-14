// --- Expert escalation registry ----------------------------------------------
// Phase-6 monetization, done COMPLIANTLY. PaperLens is not a law firm and gives
// no legal/tax advice. For high-risk documents we offer to connect the user with
// an INDEPENDENT professional (lead-gen) and link to OFFICIAL referral
// directories — we do not split fees or imply an attorney-client relationship.
// Affiliate/partner URLs can be layered on later via the optional `directoryUrl`.

export type DocCategory = 'LEGAL' | 'TAX' | 'FINANCIAL' | 'IMMIGRATION' | 'MEDICAL' | 'GENERAL' | string;
export type Urgency = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SKIPPABLE' | string;

export type ExpertType = 'attorney' | 'tax_pro' | 'immigration' | 'insurance' | 'financial';

export interface ExpertProfile {
  id:           ExpertType;
  label:        string;   // e.g. "Tax professional"
  blurb:        string;   // short value prop shown in the modal
  directoryUrl: string;   // official, non-fee-split directory the user can use directly
}

export const EXPERTS: Record<ExpertType, ExpertProfile> = {
  attorney: {
    id:    'attorney',
    label: 'Attorney',
    blurb: 'A licensed lawyer can advise on deadlines, your rights, and how to respond.',
    // Official state/bar lawyer-referral directory (not a paid referral).
    directoryUrl: 'https://www.americanbar.org/groups/legal_services/flh-home/flh-lawyer-referral-directory/',
  },
  tax_pro: {
    id:    'tax_pro',
    label: 'Tax professional',
    blurb: 'An enrolled agent or CPA can help you respond to tax notices and disputes.',
    // IRS official directory of credentialed preparers.
    directoryUrl: 'https://irs.treasury.gov/rpo/rpo.jsf',
  },
  immigration: {
    id:    'immigration',
    label: 'Immigration consultant',
    blurb: 'An accredited immigration attorney or representative can help with USCIS deadlines.',
    directoryUrl: 'https://www.immigrationlawhelp.org/',
  },
  insurance: {
    id:    'insurance',
    label: 'Insurance advisor',
    blurb: 'A licensed advisor or public adjuster can help with claims and policy disputes.',
    directoryUrl: 'https://content.naic.org/consumer.htm',
  },
  financial: {
    id:    'financial',
    label: 'Financial advisor',
    blurb: 'A fiduciary advisor can help with debts, statements, and financial decisions.',
    directoryUrl: 'https://www.napfa.org/find-an-advisor',
  },
};

/**
 * Recommend professional types for a document, most relevant first.
 * Driven by the specialized pack first (most precise), then the category.
 * Returns at most 2 to keep the UI focused; empty when nothing fits.
 */
export function recommendExperts(opts: {
  category?: DocCategory | null;
  docPack?:  string | null;
  urgency?:  Urgency | null;
}): ExpertType[] {
  const { category, docPack } = opts;
  const out: ExpertType[] = [];
  const add = (t: ExpertType) => { if (!out.includes(t)) out.push(t); };

  // Pack-driven (most precise).
  switch (docPack) {
    case 'irs-cp2000':
    case 'irs-cp504':
    case 'irs-notice':
    case 'uk-hmrc':
    case 'in-incometax':
      add('tax_pro'); break;
    case 'us-uscis':
      add('immigration'); break;
    case 'us-court-summons':
    case 'us-eviction':
    case 'us-wage-garnishment':
    case 'us-debt-collection':
      add('attorney'); break;
  }

  // Category fallback.
  switch (category) {
    case 'Taxes':     add('tax_pro');   break;
    case 'Legal':     add('attorney');  break;
    case 'Insurance': add('insurance'); break;
    case 'Financial': add('financial'); break;
    case 'Government': add('attorney'); break;
    case 'Property':  add('attorney');  break;
  }

  return out.slice(0, 2);
}

/**
 * Whether to surface the escalation CTA at all: only for genuinely high-stakes
 * documents (CRITICAL/HIGH) that have a recommended professional. Avoids nagging
 * on routine mail.
 */
export function shouldOfferEscalation(opts: {
  category?: DocCategory | null;
  docPack?:  string | null;
  urgency?:  Urgency | null;
}): boolean {
  const highStakes = opts.urgency === 'CRITICAL' || opts.urgency === 'HIGH';
  return highStakes && recommendExperts(opts).length > 0;
}
