import { requireSession } from '@/server/bootstrap';
import { BillingPage } from '@/features/billing';
import { getUserPlan } from '@/server/dal/plan';

export const metadata = {
  title: 'Billing & Usage',
};

export const instant = false;

export default async function BillingRoute() {
  await requireSession(); // Ensure user is authenticated
  
  const { plan, subscription } = await getUserPlan();

  const planData = {
    plan: {
      displayName: plan.displayName,
      quotaScansPerMonth: plan.quotaScansPerMonth,
    },
    subscription: {
      scansUsed: subscription.scansUsed,
      usageResetAt: subscription.usageResetAt.toISOString(),
    }
  };

  return <BillingPage planData={planData} />;
}
