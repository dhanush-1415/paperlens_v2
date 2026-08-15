import type { Metadata } from 'next';

import { appConfig } from '@/config';
import { TRANSLATOR } from '@/core/container';
import { unwrapOrThrow } from '@/core/result/result';
import {
  LandingHero,
  LandingBenefits,
  LandingHowItWorks,
  LandingSocialProofAndCta,
  LandingAssurances,
  LandingClosingCta,
  LandingCoverage,
  LandingSpecimen,
  LandingBentoGrid,
  LIST_GUIDES_BY_CATEGORY,
} from '@/features/marketing';
import { getRequestScope } from '@/server/bootstrap';
import { ROUTES } from '@/shared/constants';

/**
 * The home page.
 */
export const metadata: Metadata = {
  title: 'PaperLens – Understand any document',
  description: appConfig.description,
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const scope = getRequestScope();
  const t = scope.resolve(TRANSLATOR);
  const listGuidesByCategory = scope.resolve(LIST_GUIDES_BY_CATEGORY);
  const groups = unwrapOrThrow(await listGuidesByCategory());

  const ctaLabel = t.t('cta.analyze');

  return (
    <>
      <LandingHero ctaLabel={ctaLabel} reassurance="" specimenId="sample-analysis" />
      <LandingSocialProofAndCta />
      <LandingBenefits />
      <LandingBentoGrid />
      <LandingHowItWorks />
      
      {/* Additional Sections */}
      <LandingCoverage groups={groups} />
      <LandingAssurances />
      <LandingClosingCta ctaLabel={ctaLabel} reassurance="No credit card required. Secure processing." />
      <LandingSpecimen id="sample-analysis" />
    </>
  );
}
