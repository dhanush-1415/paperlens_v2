import { requireSession } from '@/server/bootstrap';
import { SettingsPage } from '@/features/settings';

export const metadata = {
  title: 'Workspace Settings',
};

export const instant = false;

export default async function SettingsRoute() {
  await requireSession(); // Ensure user is authenticated
  return <SettingsPage />;
}
