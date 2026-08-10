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
import { StickyCta } from '@/shared/ui';

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
      <LandingBenefits />
      <LandingSocialProofAndCta />
      <LandingHowItWorks />

      {/* Additional Sections */}
      <LandingAssurances />
      <LandingCoverage groups={groups} />
      <LandingClosingCta ctaLabel={ctaLabel} reassurance="No credit card required. Secure processing." />
      <LandingSpecimen id="sample-analysis" />
      <LandingBentoGrid />

      {/*
      The sticky bar appears only after 60% of the page
      */}
      <StickyCta
        campaignId="home-conversion"
        threshold={0.4}
        message="Unlock hidden risks and deadlines right now. First scan is free."
        ctaLabel="Analyze Your Document"
        ctaHref={ROUTES.scan}
        dismissLabel={t.t('common.close')}
      />
    </>
  );
}
