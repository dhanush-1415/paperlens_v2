'use client';

import { useTransition } from 'react';
import { Button, Heading, Text, Badge, cn } from '@/shared/ui';
import { SettingsIcon, BellIcon, UsersIcon, MailIcon } from '@/shared/ui/icons/dashboard-icons';
import { ShieldIcon } from '@/shared/ui/icons';
import { Trash2 } from 'lucide-react';
import { DeleteAccountButton, CancelDeletionButton } from './delete-account-dialog';
import { InboxAddress } from '@/features/document-analysis/presentation/inbox-address';
import { formatInboxAddress } from '@/shared/utils/inbox';

interface SettingsPageProps {
  profile?: any;
  userEmail?: string;
  displayName?: string;
}

export function SettingsPage({ profile, userEmail, displayName }: SettingsPageProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
        <div className="relative z-10">
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Settings
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Manage your personal alerts, notifications, and integrations.
          </Text>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button className="font-bold h-10 shadow-md">
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="mt-2">
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 max-w-4xl">


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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 border-t border-border-subtle pt-8">
                <div className="md:col-span-1">
                   <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
                     <MailIcon className="size-4 text-text-secondary" />
                     Email-to-Vault
                   </div>
                   <Text size="xs" tone="secondary" className="mt-1.5 leading-relaxed">
                     Forward attachments directly into your PaperLens workspace for background analysis.
                   </Text>
                </div>
                <div className="md:col-span-2">
                   <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 px-6 shadow-sm">
                      <InboxAddress initialAddress={profile?.inboxToken ? formatInboxAddress(profile.inboxToken) : null} />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 border-t border-border-subtle pt-8">
                <div className="md:col-span-1">
                   <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
                     <ShieldIcon className="size-4 text-text-secondary" />
                     Security
                   </div>
                   <Text size="xs" tone="secondary" className="mt-1.5 leading-relaxed">
                     Password and authentication settings managed by your provider.
                   </Text>
                </div>
                <div className="md:col-span-2">
                   <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-4 px-5 flex items-center justify-between shadow-sm">
                      <div>
                        <Text className="font-bold text-text-primary text-sm">Authentication Provider</Text>
                        <Text size="xs" tone="secondary" className="mt-0.5">Email & password</Text>
                      </div>
                      <Badge tone="safe" className="text-[10px] font-bold px-2 py-0.5 shadow-sm">• Active</Badge>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
                <div className="md:col-span-1">
                   <div className="flex items-center gap-2 text-red-500 font-semibold text-sm">
                     <Trash2 className="size-4" />
                     Danger Zone
                   </div>
                   <Text size="xs" tone="secondary" className="mt-1.5 leading-relaxed">
                     Irreversible actions. Please read carefully before proceeding.
                   </Text>
                </div>
                <div className="md:col-span-2">
                   <div className="rounded-[1.25rem] border border-red-500/30 bg-red-50/10 dark:bg-red-950/10 p-5 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                      <div className="flex-1">
                        <Text className="font-bold text-text-primary text-sm">Delete account</Text>
                        <Text size="xs" tone="secondary" className="mt-1 leading-relaxed max-w-lg">
                          {profile?.deletionRequestedAt 
                            ? `Your account is scheduled for deletion on ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(new Date(profile.deletionRequestedAt).getTime() + 48 * 60 * 60 * 1000))}. You can cancel this before then.`
                            : 'Your account will be scheduled for permanent deletion within 48 hours. You can cancel within that window. All documents, vault contents, and chat history will be erased.'
                          }
                        </Text>
                      </div>
                      {profile?.deletionRequestedAt ? (
                        <CancelDeletionButton />
                      ) : (
                        <DeleteAccountButton />
                      )}
                   </div>
                </div>
              </div>

          </div>

      </div>
    </div>
  );
}
