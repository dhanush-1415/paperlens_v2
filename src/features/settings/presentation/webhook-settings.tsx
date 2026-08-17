'use client';

import { useState } from 'react';
import { Button, Text } from '@/shared/ui';
import { type Webhook } from '@prisma/client';
import { WebhookIcon, TrashIcon } from 'lucide-react';
import { createWebhookAction, deleteWebhookAction } from './actions';
import { toast } from 'sonner';

interface WebhookSettingsProps {
  webhooks: Webhook[];
}

export function WebhookSettings({ webhooks }: WebhookSettingsProps) {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd() {
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      toast.error('Must be a valid URL');
      return;
    }

    const formData = new FormData();
    formData.append('url', url);
    if (secret) formData.append('secret', secret);

    setIsAdding(true);
    try {
      await createWebhookAction(null, formData);
      setUrl('');
      setSecret('');
      toast.success('Webhook created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create webhook');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const formData = new FormData();
    formData.append('id', id);
    try {
      await deleteWebhookAction(null, formData);
      toast.success('Webhook deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete webhook');
    }
  }

  return (
    <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-5 px-6 shadow-sm">
      <div className="flex flex-col gap-4">
        {webhooks.length === 0 ? (
          <Text tone="secondary" size="sm">
            No webhooks configured.
          </Text>
        ) : (
          <div className="flex flex-col gap-2">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <WebhookIcon className="size-4 text-brand-primary" />
                  <div>
                    <Text className="text-sm font-semibold">{wh.url}</Text>
                    <Text size="xs" tone="secondary">
                      Subscribed to: {wh.events.join(', ')}
                    </Text>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(wh.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
          <Text className="text-sm font-semibold">Add Webhook (B2B Integrations)</Text>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              placeholder="https://your-erp.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder="Signing Secret (Optional)"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="flex-1 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
            <Button onClick={handleAdd} isLoading={isAdding} disabled={!url} className="px-6">
              Add Endpoint
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
