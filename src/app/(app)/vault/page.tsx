import { requireSession } from '@/server/bootstrap';
import { VaultPage } from '@/features/vault';

export const metadata = {
  title: 'Document Vault',
};

export default async function VaultRoute() {
  await requireSession(); // Ensure user is authenticated

  return <VaultPage />;
}
