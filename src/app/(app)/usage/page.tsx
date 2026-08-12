import { requireSession } from '@/server/bootstrap';
import { BillingPage } from '@/features/billing/presentation/billing-page';
import { getUserPlan } from '@/server/dal/plan';

export const metadata = {
  title: 'Billing & Usage | PaperLens',
};

export default async function UsageRoute() {
  await requireSession(); // Ensure user is authenticated
  const planData = await getUserPlan();
  
  return <BillingPage planData={planData} />;
}
