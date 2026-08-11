import { requireSession } from '@/server/bootstrap';
import { ProfilePage } from '@/features/settings';

export const metadata = {
  title: 'Profile Settings',
};

export default async function ProfileRoute() {
  await requireSession(); // Ensure user is authenticated
  return <ProfilePage />;
}
