import { requireSession } from '@/server/bootstrap';
import { VaultPage } from '@/features/vault';
import { connection } from 'next/server';

export const metadata = {
  title: 'Document Vault',
};

export default async function VaultRoute() {
  await connection();
  await requireSession(); // Ensure user is authenticated

  return <VaultPage />;
}
