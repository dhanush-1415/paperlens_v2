import { requireSession } from '@/server/bootstrap';
import { getPlatformConfig, updatePlatformConfig, PlatformConfig } from '@/server/dal/config';
import { ConfigForm } from './config-form';
import { revalidatePath } from 'next/cache';

export const metadata = {
  title: 'Admin - Configuration',
};

export default async function AdminConfigPage() {
  await requireSession();
  
  const config = await getPlatformConfig();

  async function saveAction(newConfig: Partial<PlatformConfig>) {
    'use server';
    await requireSession(); // re-verify permission
    await updatePlatformConfig(newConfig);
    revalidatePath('/admin/config');
  }

  return <ConfigForm initialConfig={config} saveAction={saveAction} />;
}
