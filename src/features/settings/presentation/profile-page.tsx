'use client';

import { Button, Heading, Text, Card, Input } from '@/shared/ui';
import { ShieldIcon } from '@/shared/ui/icons';
import { UserIcon } from '@/shared/ui/icons/dashboard-icons';

export function ProfilePage() {
  return (
    <div className="flex h-full flex-col gap-8 max-w-3xl mx-auto">
      <div>
        <Heading level={1} size="lg">Profile Settings</Heading>
        <Text tone="secondary" className="mt-1">
          Manage your account information and security preferences.
        </Text>
      </div>

      <Card interactive className="p-6 transition-all hover:border-brand-primary/40 hover:shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/20">
            <UserIcon className="size-6" />
          </div>
          <Heading level={2} size="md">Personal Information</Heading>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary mb-1">First Name</label>
              <Input id="firstName" defaultValue="Alex" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary mb-1">Last Name</label>
              <Input id="lastName" defaultValue="Mercer" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
            <Input id="email" type="email" defaultValue="alex@example.com" />
          </div>
          <div className="pt-4">
            <Button type="button">Save Changes</Button>
          </div>
        </form>
      </Card>

      <Card interactive className="p-6 transition-all hover:border-risk-caution/40 hover:shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-risk-caution/10 text-risk-caution shadow-sm shadow-risk-caution/20">
            <ShieldIcon className="size-6" />
          </div>
          <Heading level={2} size="md">Security</Heading>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
            <Input id="currentPassword" type="password" />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
            <Input id="newPassword" type="password" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
            <Input id="confirmPassword" type="password" />
          </div>
          <div className="pt-4 flex items-center gap-4">
            <Button type="button" variant="secondary">Update Password</Button>
            <Button type="button" variant="ghost">Enable 2FA</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
