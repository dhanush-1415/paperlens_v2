import type { Metadata } from 'next';

import { serverEnv } from '@/config/env.server';
import { resolveTenant } from '@/config/tenant';
import {
 MarketingPageIntro,
 SecurityCommitments,
 SecurityLifecycle,
 SecurityPosture,
} from '@/features/marketing';

/**
 * `/security`.
 *
 * ### The page this replaces
 *
 * Seventy-eight lines headed “Bank-Grade Security Charter”, opening with “We command trust” and
 * four cards of acronyms — one of which named the database vendor, one of which claimed
 * end-to-end encryption for something that is not end-to-end encrypted. It was the thinnest
 * page on the site against the highest-stakes question a visitor has.
 *
 * The rewrite starts from the question rather than from the vocabulary: *where is my document,
 * who can see it, and what happens to it next*. Everything on the page answers some part of
 * that, in words a person who has never heard of TLS can follow, without becoming vague enough
 * to be meaningless to the person who has.
 *
 * ### Why the tenant is read here
 *
 * The disclosure address is tenant configuration, and configuration is the app layer's to read
 * — `features/**` may not touch `@/config`, which is why `SecurityPosture` takes the address as
 * a prop. Same shape as the layout, which reads the tenant for the product name.
 *
 * ### Static
 *
 * No container resolution, no request APIs, no client components. This route is HTML.
 */
export const metadata: Metadata = {
 title: 'Security and privacy',
 description:
 'Where your document is at every moment, what we promise about it, and what we can and cannot prove yet — including the audits we do not have.',
 alternates: { canonical: '/security' },
};

export default function SecurityPage() {
 const tenant = resolveTenant(serverEnv.TENANT_ID);

 return (
 <>
 <MarketingPageIntro
 eyebrow="Security and privacy"
 heading="Your document is yours. Here is exactly what happens to it."
 lede="No charter, no badges, no sentence about how seriously we take your privacy. Just where the file goes, who can read it, and the things we have not done yet."
 />

 <SecurityLifecycle />
 <SecurityCommitments />
 <SecurityPosture contactEmail={tenant.legal.supportEmail} />
 </>
 );
}
