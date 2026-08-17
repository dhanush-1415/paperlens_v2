import 'server-only';
import { prisma } from '@/server/db/prisma';
import crypto from 'crypto';

export interface WebhookEventPayload {
  event: string;
  data: any;
  timestamp: string;
}

export async function dispatchWebhookEvent(userId: string, eventName: string, data: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: {
          has: eventName,
        },
      },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookEventPayload = {
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);

    // Fire webhooks concurrently
    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'PaperLens-Webhook-Dispatcher/1.0',
          };

          if (webhook.secret) {
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(payloadString)
              .digest('hex');
            headers['X-PaperLens-Signature'] = signature;
          }

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: payloadString,
            // timeout handling could be added here
          });

          if (!response.ok) {
            console.error(`Webhook to ${webhook.url} failed with status ${response.status}`);
            // In a production system, we would log this failure to a webhook_deliveries table
            // and schedule a retry.
          } else {
            console.log(`Successfully dispatched ${eventName} webhook to ${webhook.url}`);
          }
        } catch (err) {
          console.error(`Error dispatching webhook to ${webhook.url}:`, err);
        }
      }),
    );
  } catch (err) {
    console.error('Failed to dispatch webhooks:', err);
  }
}
