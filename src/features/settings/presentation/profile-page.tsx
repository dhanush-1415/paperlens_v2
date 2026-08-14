'use client';

import { useTransition } from 'react';
import { Button, Heading, Text, Input, Badge } from '@/shared/ui';
import { ShieldIcon, CheckIcon } from '@/shared/ui/icons';
import { UserIcon, CreditCardIcon, MailIcon } from '@/shared/ui/icons/dashboard-icons';
import { saveProfileAction } from '@/app/(app)/profile/actions';

interface ProfilePageProps {
  profile: any;
  userEmail: string;
  displayName: string;
}

export function ProfilePage({ profile, userEmail, displayName }: ProfilePageProps) {
  const [isPending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(() => {
      saveProfileAction(formData);
    });
  };

  const currentFirstName = profile?.firstName || displayName?.split(' ')[0] || '';
  const currentLastName = profile?.lastName || (displayName?.split(' ').length > 1 ? displayName.split(' ').slice(1).join(' ') : '');
  const currentFullName = [currentFirstName, currentLastName].filter(Boolean).join(' ') || 'User';

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Profile Settings
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Manage your personal information, security preferences, and connected accounts.
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-start">
        
        {/* Left Column - Profile Avatar & Quick Info */}
        <div className="flex flex-col gap-6 lg:col-span-1 lg:sticky lg:top-24">
          <div className="relative flex flex-col items-center gap-4 rounded-[1.25rem] border border-border-subtle bg-gradient-to-br from-surface-1 to-brand-primary/[0.02] p-6 shadow-sm overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 via-transparent to-transparent opacity-50" />
            
            <div className="relative mt-2 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-1 shadow-xl shadow-brand-primary/20">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-1 text-brand-primary">
                <UserIcon className="size-10" />
              </div>
            </div>
            
            <div className="relative z-10">
              <Heading level={3} className="text-xl font-extrabold text-text-primary">{currentFullName}</Heading>
              <Text size="sm" tone="secondary" className="font-medium mt-1">{userEmail}</Text>
              
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
                <ShieldIcon className="size-3.5" /> Workspace Member
              </div>
            </div>
          </div>
          
          <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 shadow-sm">
            <Text size="xs" className="font-bold uppercase tracking-wider text-text-tertiary mb-4">Account Status</Text>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <MailIcon className="size-4" /> Email Verified
                </div>
                <CheckIcon className="size-4 text-safe" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <ShieldIcon className="size-4" /> 2FA Enabled
                </div>
                <Badge tone="caution" className="font-bold">Setup Required</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm transition-all hover:border-brand-primary/30">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Heading level={2} size="md" className="font-bold text-text-primary">Personal Information</Heading>
                <Text size="sm" tone="secondary" className="mt-1">Update your name and contact details.</Text>
              </div>
            </div>

            <form action={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">First Name</label>
                  <Input name="firstName" id="firstName" defaultValue={currentFirstName} className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Last Name</label>
                  <Input name="lastName" id="lastName" defaultValue={currentLastName} className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Email Address</label>
                <Input id="email" type="email" disabled defaultValue={userEmail} className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner opacity-70" />
                <Text size="xs" tone="secondary" className="ml-1 mt-1 font-medium">To change your email, please contact support.</Text>
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={isPending} className="font-bold h-10 shadow-md">
                  {isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm transition-all hover:border-risk-caution/30">
            <div className="mb-6">
              <Heading level={2} size="md" className="font-bold text-text-primary">Security & Password</Heading>
              <Text size="sm" tone="secondary" className="mt-1">Manage your password and security settings.</Text>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Current Password</label>
                <Input id="currentPassword" type="password" className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">New Password</label>
                  <Input id="newPassword" type="password" className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Confirm New Password</label>
                  <Input id="confirmPassword" type="password" className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button type="button" variant="secondary" className="w-full sm:w-auto font-bold h-10 border-border-strong/50">Update Password</Button>
                <Button type="button" variant="secondary" className="w-full sm:w-auto font-bold h-10 text-risk-caution border-risk-caution/20 bg-risk-caution/5 hover:bg-risk-caution/10">Enable 2FA</Button>
              </div>
            </form>
          </div>


          
          <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm">
            <div className="mb-6">
              <Heading level={2} size="md" className="font-bold text-text-primary">Recent Login Activity</Heading>
              <Text size="sm" tone="secondary" className="mt-1">Review where your account has been accessed from.</Text>
            </div>
            <div className="flex flex-col divide-y divide-border-subtle">
               {[
                 { os: 'Mac OS X • Chrome', loc: 'San Francisco, USA', time: 'Current session', status: 'Active now' },
                 { os: 'iOS 17 • Safari', loc: 'San Francisco, USA', time: 'Yesterday at 4:32 PM', status: 'Verified' },
                 { os: 'Windows 11 • Edge', loc: 'New York, USA', time: 'Aug 10, 2026', status: 'Verified' },
               ].map((log, i) => (
                 <div key={i} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                   <div>
                     <Text size="sm" className="font-bold text-text-primary">{log.os}</Text>
                     <Text size="xs" tone="secondary">{log.loc}</Text>
                   </div>
                   <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-0 mt-2 sm:mt-0">
                     <Text size="xs" className="font-medium text-text-primary">{log.time}</Text>
                     <Text size="xs" className={log.status === 'Active now' ? 'text-safe font-bold' : 'text-text-tertiary'}>{log.status}</Text>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
