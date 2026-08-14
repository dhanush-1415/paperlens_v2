'use client';

import { useState, useTransition } from 'react';
import { Button, Heading, Text, Input, Badge, cn } from '@/shared/ui';
import { SettingsIcon, BellIcon, UsersIcon, MailIcon, UserIcon, CreditCardIcon } from '@/shared/ui/icons/dashboard-icons';
import { ShieldIcon, CheckIcon } from '@/shared/ui/icons';
import { saveProfileAction } from '@/app/(app)/profile/actions';

interface SettingsPageProps {
  profile?: any;
  userEmail?: string;
  displayName?: string;
}

export function SettingsPage({ profile, userEmail, displayName }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'api'>('general');
  const [isPending, startTransition] = useTransition();

  const handleSaveProfile = (formData: FormData) => {
    startTransition(() => {
      saveProfileAction(formData);
    });
  };

  const currentFirstName = profile?.firstName || displayName?.split(' ')[0] || '';
  const currentLastName = profile?.lastName || ((displayName?.split(' ') || []).length > 1 ? displayName?.split(' ').slice(1).join(' ') : '');
  const currentFullName = [currentFirstName, currentLastName].filter(Boolean).join(' ') || 'User';

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Settings
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Manage your organization profile, personal settings, and integrations.
          </Text>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button className="font-bold h-10 shadow-md">
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle overflow-x-auto pb-px">
        {[
          { id: 'general', label: 'General' },
          { id: 'account', label: 'Account Settings' },
          { id: 'api', label: 'API Keys & Integrations' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 text-sm font-bold transition-all border-b-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "border-brand-primary text-brand-primary" 
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in slide-in-from-bottom-2">
            
            {/* Left Column - General & Notifications */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm transition-all hover:border-brand-primary/30">
                <div className="flex items-center gap-4 mb-6 border-b border-border-subtle pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/20">
                    <SettingsIcon className="size-6" />
                  </div>
                  <div>
                    <Heading level={2} size="md" className="font-bold text-text-primary">General Configuration</Heading>
                    <Text size="sm" tone="secondary">Primary details for your organization.</Text>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="workspaceName" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Workspace Name</label>
                      <Input id="workspaceName" defaultValue="Acme Corporation" className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
                    </div>
                    <div>
                      <label htmlFor="industry" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Industry</label>
                      <Input id="industry" defaultValue="Financial Services" className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
                    </div>
                    <div>
                      <label htmlFor="size" className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Company Size</label>
                      <Input id="size" defaultValue="500-1000 Employees" className="rounded-xl bg-surface-2 border-transparent focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-inner" />
                    </div>
                  </div>
                </form>
              </div>

              <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm transition-all hover:border-brand-secondary/30">
                <div className="flex items-center gap-4 mb-6 border-b border-border-subtle pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary shadow-sm shadow-brand-secondary/20">
                    <BellIcon className="size-6" />
                  </div>
                  <div>
                    <Heading level={2} size="md" className="font-bold text-text-primary">Alerts & Notifications</Heading>
                    <Text size="sm" tone="secondary">Control what events trigger automated emails.</Text>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-border-subtle bg-surface-2/50 cursor-pointer hover:bg-surface-2 transition-colors">
                    <input type="checkbox" defaultChecked className="mt-1 size-4 text-brand-primary focus:ring-brand-primary rounded border-border-strong" />
                    <div className="flex-1">
                      <Text className="font-bold text-text-primary text-sm">Critical Risk Alerts</Text>
                      <Text size="xs" tone="secondary" className="mt-0.5">Send immediate email when a scanned document flags as high-risk.</Text>
                    </div>
                    <Badge tone="critical">High Priority</Badge>
                  </label>
                  
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-border-subtle bg-surface-2/50 cursor-pointer hover:bg-surface-2 transition-colors">
                    <input type="checkbox" defaultChecked className="mt-1 size-4 text-brand-primary focus:ring-brand-primary rounded border-border-strong" />
                    <div className="flex-1">
                      <Text className="font-bold text-text-primary text-sm">Weekly Executive Summary</Text>
                      <Text size="xs" tone="secondary" className="mt-0.5">A rolled-up PDF report of all organizational scanning activity.</Text>
                    </div>
                    <Badge tone="brand">Standard</Badge>
                  </label>

                  <label className="flex items-start gap-4 p-4 rounded-xl border border-border-subtle bg-surface-2/50 cursor-pointer hover:bg-surface-2 transition-colors">
                    <input type="checkbox" className="mt-1 size-4 text-brand-primary focus:ring-brand-primary rounded border-border-strong" />
                    <div className="flex-1">
                      <Text className="font-bold text-text-primary text-sm">New Feature Announcements</Text>
                      <Text size="xs" tone="secondary" className="mt-0.5">Occasional emails regarding platform updates.</Text>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Team Members */}
            <div className="flex flex-col gap-6 lg:col-span-1 lg:sticky lg:top-24">
              <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-border-subtle pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-text-primary text-surface-1 shadow-sm">
                      <UsersIcon className="size-5" />
                    </div>
                    <div>
                      <Heading level={2} size="sm" className="font-bold text-text-primary">Team</Heading>
                      <Text size="xs" tone="secondary">4 Active Members</Text>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="font-bold">Invite</Button>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { name: 'Sarah Jenkins', role: 'CEO', access: 'Owner', icon: ShieldIcon },
                    { name: 'Marcus Vance', role: 'CTO', access: 'Admin', icon: SettingsIcon },
                    { name: 'Elena Rostova', role: 'Sales Head', access: 'Editor', icon: UsersIcon },
                    { name: 'David Chen', role: 'Marketing Head', access: 'Viewer', icon: MailIcon },
                  ].map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:bg-surface-2/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-primary/10 to-brand-secondary/10 text-brand-primary font-bold text-sm shadow-sm border border-brand-primary/20">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <Text size="sm" className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">{member.name}</Text>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <member.icon className="size-3 text-text-tertiary" />
                            <Text size="xs" tone="secondary" className="font-medium">{member.role}</Text>
                          </div>
                        </div>
                      </div>
                      <Badge tone={member.access === 'Owner' ? 'brand' : member.access === 'Admin' ? 'safe' : 'neutral'} className="text-[10px]">
                        {member.access}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-border-subtle">
                  <Button variant="ghost" className="w-full text-sm font-bold text-brand-primary">Manage Permissions</Button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ACCOUNT SETTINGS TAB */}
        {activeTab === 'account' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in slide-in-from-bottom-2">
            
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

                <form action={handleSaveProfile} className="space-y-5">
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
        )}

        {/* API KEYS & INTEGRATIONS TAB */}
        {activeTab === 'api' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in slide-in-from-bottom-2">
            <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 sm:p-6 shadow-sm lg:col-span-2 max-w-4xl">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
                <div>
                  <Heading level={2} size="md" className="font-bold text-text-primary">API Keys & Integrations</Heading>
                  <Text size="sm" tone="secondary" className="mt-1 max-w-2xl">
                    Manage your developer access tokens and webhooks. These keys allow external applications to interact with your workspace on your behalf.
                  </Text>
                </div>
                <Button variant="secondary" className="h-10 font-bold bg-brand-primary text-white border-none hover:bg-brand-primary-hover shadow-md">
                  Generate New Key
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[1rem] border border-border-subtle bg-surface-2/50 gap-4 transition-all hover:border-brand-primary/30 hover:bg-surface-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Text size="sm" className="font-bold text-text-primary">Production API Key</Text>
                      <Badge tone="safe">Active</Badge>
                    </div>
                    <Text size="xs" tone="secondary" className="font-medium">Created on Oct 12, 2025 • Never used</Text>
                    <div className="mt-3 flex items-center gap-2 bg-surface-1 p-2 px-3 rounded-lg border border-border-strong w-full sm:max-w-xs overflow-hidden">
                      <code className="text-xs font-mono text-text-secondary truncate select-all">pk_prod_*********************</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:self-start">
                    <Button variant="ghost" size="sm" className="text-text-secondary font-bold hover:text-text-primary">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-critical font-bold hover:text-critical hover:bg-critical/10">Revoke</Button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[1rem] border border-border-subtle bg-surface-2/30 gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Text size="sm" className="font-bold text-text-primary">Legacy Zapier Webhook</Text>
                      <Badge tone="neutral">Revoked</Badge>
                    </div>
                    <Text size="xs" tone="secondary" className="font-medium">Created on Jan 05, 2025 • Last used 2 weeks ago</Text>
                  </div>
                  <div className="flex items-center gap-2 sm:self-start">
                    <Button variant="ghost" size="sm" className="text-text-secondary font-bold hover:text-text-primary">Delete</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
