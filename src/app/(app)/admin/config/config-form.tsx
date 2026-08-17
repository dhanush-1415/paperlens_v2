'use client';

import { useState } from 'react';
import { Heading, Text, Button } from '@/shared/ui';
import { toast } from 'sonner';

export function ConfigForm({
  initialConfig,
  saveAction,
}: {
  initialConfig: any;
  saveAction: (config: any) => Promise<void>;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAction(config);
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

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
        <Button onClick={handleSave} disabled={isSaving} className="font-bold shadow-md">
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <Heading level={2} size="md" className="mb-6 font-bold">
          Feature Flags
        </Heading>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-border-subtle bg-surface-2/50 p-4">
            <input
              type="checkbox"
              checked={config.betaModels}
              onChange={(e) => setConfig({ ...config, betaModels: e.target.checked })}
              className="mt-1 size-4 text-brand-primary"
            />
            <div>
              <Text className="text-sm font-bold">Enable Beta AI Models</Text>
              <Text size="xs" tone="secondary">
                Allow workspace users to select Gemini 1.5 Pro Experimental for scanning.
              </Text>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-border-subtle bg-surface-2/50 p-4">
            <input
              type="checkbox"
              checked={config.ssoEnforcement}
              onChange={(e) => setConfig({ ...config, ssoEnforcement: e.target.checked })}
              className="mt-1 size-4 text-brand-primary"
            />
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
