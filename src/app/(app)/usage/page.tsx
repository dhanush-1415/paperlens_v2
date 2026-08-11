import { redirect } from 'next/navigation';
import { ROUTES } from '@/shared/constants/routes';

export default function UsageRoute() {
  redirect(ROUTES.billing);
}
