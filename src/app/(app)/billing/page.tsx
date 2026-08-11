import { requireSession } from '@/server/bootstrap';
import { BillingPage } from '@/features/billing';

export const metadata = {
  title: 'Billing & Usage',
};

export default async function BillingRoute() {
  await requireSession(); // Ensure user is authenticated
  return <BillingPage />;
}
