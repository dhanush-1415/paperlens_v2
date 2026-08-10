import type { Metadata } from 'next';
import Link from 'next/link';

import { TRANSLATOR } from '@/core/container';
import {
 HowItWorksAnatomy,
 HowItWorksLimits,
 HowItWorksPipeline,
 LandingClosingCta,
 MarketingPageIntro,
} from '@/features/marketing';
import { getRequestScope } from '@/server/bootstrap';
import { ROUTES } from '@/shared/constants';
import { ArrowRightIcon, Button, Text } from '@/shared/ui';

/**
 * `/how-it-works`.
 *
 * ### Who this page is for
 *
 * Not the visitor who is ready — they clicked the button on the home page and are already in
 * the product. This page is for the one who is nearly ready and has a specific worry: that it
 * will not read a photograph, that it will summarise rather than answer, that "AI" means a
 * confident paragraph with no way to check it. Each section answers one of those, in that order.
 *
 * ### Why the limits section is on this page and not on `/security`
 *
 * They are different questions. `/security` answers *what happens to my file* — handling,
 * retention, who can see it. This answers *what happens to my problem* — how good the analysis
 * is and where it stops being reliable. A reader worried about the second one is not reassured
 * by an encryption paragraph, and putting both on one page means neither gets read.
 *
 * ### Static
 *
 * The only thing this route resolves from the container is the translator, for the two CTA
 * strings that also appear in the header and on the home page. Everything else is prose in
 * Server Components, so the route prerenders and ships no JavaScript.
 */
export const metadata: Metadata = {
 title: 'How it works',
 description:
 'What happens between handing PaperLens a document and getting an answer back: what it reads, what a finding contains, and precisely where it stops being reliable.',
 alternates: { canonical: '/how-it-works' },
};

export default async function HowItWorksPage() {
 const t = getRequestScope().resolve(TRANSLATOR);
 const ctaLabel = t.t('cta.analyze');
 const reassurance = t.t('cta.reassurance');

 return (
 <>
 <MarketingPageIntro
 eyebrow="How it works"
 heading="From an envelope you dreaded opening to a decision you can make."
 lede="You hand it the document. It reads every clause, and hands back the ones that cost money — each with the passage it came from, so you never have to take our word for anything."
 >
 {/* The CTA sits inside the intro rather than in its own band: a reader who is already
 convinced should not have to scroll past the explanation to act on it. */}
 <div className="flex flex-col gap-2">
 <Button asChild size="lg" variant="primary">
 <Link href={ROUTES.scan}>
 {ctaLabel}
 <ArrowRightIcon aria-hidden className="size-4" />
 </Link>
 </Button>
 <Text size="xs" tone="tertiary">
 {reassurance}
 </Text>
 </div>
 </MarketingPageIntro>

 <HowItWorksPipeline />
 <HowItWorksAnatomy />
 <HowItWorksLimits />

 <LandingClosingCta ctaLabel={ctaLabel} reassurance={reassurance} />
 </>
 );
}
