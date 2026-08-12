'use client';

import { Button, Heading, Text, Input, Badge } from '@/shared/ui';
import { SettingsIcon, BellIcon, UsersIcon, MailIcon } from '@/shared/ui/icons/dashboard-icons';
import { ShieldIcon } from '@/shared/ui/icons';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Workspace Settings
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Manage your organization profile, team members, and alert preferences.
          </Text>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button className="font-bold h-10 shadow-md">
            Save All Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-start">
        
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
    </div>
  );
}
