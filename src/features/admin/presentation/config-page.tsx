'use client';

import { Button, Heading, Text, Card, Input } from '@/shared/ui';
import { SlidersIcon } from '@/shared/ui/icons/dashboard-icons';

export function AdminConfigPage() {
  return (
    <div className="flex h-full flex-col gap-8 max-w-3xl mx-auto">
      <div>
        <Heading level={1} size="lg">Global Configuration</Heading>
        <Text tone="secondary" className="mt-1">
          System-wide settings and parameters for the tenant.
        </Text>
      </div>

      <Card interactive className="p-6 transition-all hover:border-brand-primary/40 hover:shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/20">
            <SlidersIcon className="size-6" />
          </div>
          <Heading level={2} size="md">Application Variables</Heading>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="maxFileSize" className="block text-sm font-medium text-text-secondary mb-1">Max Upload File Size (MB)</label>
            <Input id="maxFileSize" type="number" defaultValue="10" />
            <Text size="xs" tone="tertiary" className="mt-1">Maximum allowed size for document uploads.</Text>
          </div>

          <div>
            <label htmlFor="sessionTimeout" className="block text-sm font-medium text-text-secondary mb-1">Session Timeout (Minutes)</label>
            <Input id="sessionTimeout" type="number" defaultValue="60" />
            <Text size="xs" tone="tertiary" className="mt-1">Inactivity period before requiring re-authentication.</Text>
          </div>

          <div>
            <label className="flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1 text-brand-primary focus:ring-brand-primary rounded" />
              <div>
                <Text className="font-medium text-text-primary">Maintenance Mode</Text>
                <Text size="sm" tone="secondary">Prevent non-admin users from accessing the system.</Text>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <Button type="button">Save Configuration</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
