'use client';

import { Button, Heading, Text, Card, Input } from '@/shared/ui';
import { SlidersIcon } from '@/shared/ui/icons/dashboard-icons';

export function AdminConfigPage() {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-8">
      <div>
        <Heading level={1} size="lg">
          Global Configuration
        </Heading>
        <Text tone="secondary" className="mt-1">
          System-wide settings and parameters for the tenant.
        </Text>
      </div>

      <Card
        interactive
        className="p-6 transition-all hover:border-brand-primary/40 hover:shadow-card"
      >
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/20">
            <SlidersIcon className="size-6" />
          </div>
          <Heading level={2} size="md">
            Application Variables
          </Heading>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label
              htmlFor="maxFileSize"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Max Upload File Size (MB)
            </label>
            <Input id="maxFileSize" type="number" defaultValue="10" />
            <Text size="xs" tone="tertiary" className="mt-1">
              Maximum allowed size for document uploads.
            </Text>
          </div>

          <div>
            <label
              htmlFor="sessionTimeout"
              className="mb-1 block text-sm font-medium text-text-secondary"
            >
              Session Timeout (Minutes)
            </label>
            <Input id="sessionTimeout" type="number" defaultValue="60" />
            <Text size="xs" tone="tertiary" className="mt-1">
              Inactivity period before requiring re-authentication.
            </Text>
          </div>

          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 rounded text-brand-primary focus:ring-brand-primary"
              />
              <div>
                <Text className="font-medium text-text-primary">Maintenance Mode</Text>
                <Text size="sm" tone="secondary">
                  Prevent non-admin users from accessing the system.
                </Text>
              </div>
            </label>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <Button type="button">Save Configuration</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
