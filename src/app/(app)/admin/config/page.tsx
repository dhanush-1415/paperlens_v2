import { requireSession } from '@/server/bootstrap';
import { Heading, Text, Button, Input } from '@/shared/ui';

export const metadata = {
  title: 'Admin - Configuration',
};

export default async function AdminConfigPage() {
  await requireSession();

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level={1} size="lg" className="tracking-tight text-text-primary">
            Configuration
          </Heading>
          <Text tone="secondary" className="mt-1 text-sm font-medium">
            Platform-wide settings and limits.
          </Text>
        </div>
        <Button className="font-bold shadow-md">Save Configuration</Button>
      </div>

      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <Heading level={2} size="md" className="mb-6 font-bold">
          Feature Flags
        </Heading>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-border-subtle bg-surface-2/50 p-4">
            <input type="checkbox" defaultChecked className="mt-1 size-4 text-brand-primary" />
            <div>
              <Text className="text-sm font-bold">Enable Beta AI Models</Text>
              <Text size="xs" tone="secondary">
                Allow workspace users to select Gemini 1.5 Pro Experimental for scanning.
              </Text>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-border-subtle bg-surface-2/50 p-4">
            <input type="checkbox" className="mt-1 size-4 text-brand-primary" />
            <div>
              <Text className="text-sm font-bold">Strict SSO Enforcement</Text>
              <Text size="xs" tone="secondary">
                Require all new invites to authenticate via SAML provider.
              </Text>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
