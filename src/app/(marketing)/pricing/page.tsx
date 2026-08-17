import type { Metadata } from 'next';

import { unwrapOrThrow } from '@/core/result/result';
import {
  GET_PRICING,
  MarketingPageIntro,
  PricingFaq,
  PricingTierGrid,
  UsageCalculator,
} from '@/features/marketing';
import { getRequestScope } from '@/server/bootstrap';
import { Container, Section } from '@/shared/ui';

/**
 * `/pricing`.
 *
 * ### Why the prices come through a use case rather than an import
 *
 * Because two systems have to agree on them — this page and whatever eventually charges the
 * card — and a page that imports the array is a page that cannot be handed a different price
 * list per region, per experiment, or from the payments provider itself when that becomes the
 * source of truth. The route resolves `GET_PRICING` and does not know where the numbers came
 * from. See the header of `infrastructure/pricing.data.ts`.
 *
 * ### Why an unwrap here and a graceful degradation on the home page
 *
 * `unwrapOrThrow` rather than the `isOk` fallback the landing page uses for its guide list. The
 * difference is what the page is *for*: a home page missing one link section is still a home
 * page, but a pricing page that renders without prices is worse than an error — it is a page
 * that answers its only question with silence. If the content store cannot be read, the error
 * boundary is the honest outcome.
 *
 * ### Why the calculator is below the tiers and not inside one
 *
 * clearcut-app put a volume slider inside the third card, which made the third card's price
 * change while the reader was comparing it against the other two — the one interaction on a
 * pricing page moved the number the page exists to communicate. Here the three tiers are
 * fixed, and the calculator sits underneath as a separate question: *and if I need more than
 * that?*
 */
export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Five documents a month, free, with the full report. Paid plans add saved history, comparison and volume. No card to start, and nothing renews without an email first.',
  alternates: { canonical: '/pricing' },
};

export default async function PricingPage() {
  const getPricing = getRequestScope().resolve(GET_PRICING);
  const plan = unwrapOrThrow(await getPricing());

  /**
   * The tier the calculator prices from, resolved here rather than in the component.
   *
   * `calculatorBaseTierId` is a foreign key into the tier list, and resolving it is exactly the
   * sort of lookup that has no business happening inside a Client Component — the island
   * receives one tier object and a rate, which is also the smallest payload that can cross the
   * server/client boundary for it.
   */
  const calculatorTier = plan.tiers.find((tier) => tier.id === plan.calculatorBaseTierId);

  return (
    <>
      <MarketingPageIntro
        eyebrow="Pricing"
        heading="Read five documents a month for nothing."
        lede="The free tier is the whole product, not a preview with the answers hidden — every clause, every flag, every deadline. Paid plans exist for people whose paperwork does not arrive one envelope at a time."
      />

      <PricingTierGrid tiers={plan.tiers} />

      {calculatorTier ? (
        <Section spacing="md">
          <Container width="content">
            <UsageCalculator
              tier={calculatorTier}
              overageCentsPerThousand={plan.overageCentsPerThousand}
            />
          </Container>
        </Section>
      ) : null}

      <PricingFaq />
    </>
  );
}
