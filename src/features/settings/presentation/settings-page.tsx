'use client';

import { Button, Heading, Text, Card, Input } from '@/shared/ui';
import { SettingsIcon, BellIcon } from '@/shared/ui/icons/dashboard-icons';

export function SettingsPage() {
  return (
    <div className="flex h-full flex-col gap-8 max-w-3xl mx-auto">
      <div>
        <Heading level={1} size="lg">Workspace Settings</Heading>
        <Text tone="secondary" className="mt-1">
          Configure your workspace preferences and notifications.
        </Text>
      </div>

      <Card interactive className="p-6 transition-all hover:border-brand-primary/40 hover:shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/20">
            <SettingsIcon className="size-6" />
          </div>
          <Heading level={2} size="md">General</Heading>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium text-text-secondary mb-1">Workspace Name</label>
            <Input id="workspaceName" defaultValue="Acme Corp" />
          </div>
          
          <div>
            <Text className="block text-sm font-medium text-text-secondary mb-3">Theme Preference</Text>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input type="radio" name="theme" value="system" defaultChecked className="text-brand-primary focus:ring-brand-primary" />
                System Default
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input type="radio" name="theme" value="light" className="text-brand-primary focus:ring-brand-primary" />
                Light
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input type="radio" name="theme" value="dark" className="text-brand-primary focus:ring-brand-primary" />
                Dark
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <Button type="button">Save Preferences</Button>
          </div>
        </form>
      </Card>

      <Card interactive className="p-6 transition-all hover:border-brand-primary/40 hover:shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/20">
            <BellIcon className="size-6" />
          </div>
          <Heading level={2} size="md">Notifications</Heading>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" defaultChecked className="mt-1 text-brand-primary focus:ring-brand-primary rounded" />
            <div>
              <Text className="font-medium text-text-primary">Email Alerts for Critical Risks</Text>
              <Text size="sm" tone="secondary">Receive an email immediately when a critical risk is found in a scanned document.</Text>
            </div>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" defaultChecked className="mt-1 text-brand-primary focus:ring-brand-primary rounded" />
            <div>
              <Text className="font-medium text-text-primary">Weekly Digest</Text>
              <Text size="sm" tone="secondary">A weekly summary of your document analysis activity.</Text>
            </div>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 text-brand-primary focus:ring-brand-primary rounded" />
            <div>
              <Text className="font-medium text-text-primary">Marketing Updates</Text>
              <Text size="sm" tone="secondary">Receive news about new features and updates from PaperLens.</Text>
            </div>
          </label>

          <div className="pt-4 border-t border-border-subtle mt-6">
            <Button type="button" variant="secondary">Update Notifications</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
