/**
 * lib/razorpay.ts — Razorpay server-side helpers.
 *
 * Required env vars:
 *   RAZORPAY_KEY_ID        — rzp_live_xxx or rzp_test_xxx
 *   RAZORPAY_KEY_SECRET    — secret from Razorpay dashboard
 *   RAZORPAY_PLAN_PRO      — plan ID for Pro subscription
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

let _rzp: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_rzp) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
    }
    _rzp = new Razorpay({ key_id, key_secret });
  }
  return _rzp;
}

export function getRazorpayPlanId(): string {
  const id = process.env.RAZORPAY_PLAN_PRO;
  if (!id) throw new Error(`RAZORPAY_PLAN_PRO env var not set`);
  return id;
}

export interface CreateRazorpaySubscriptionOptions {
  planId: string;
  userId: string;
  userEmail: string;
  userName?: string;
}

export async function createRazorpaySubscription(opts: CreateRazorpaySubscriptionOptions) {
  const rzp = getRazorpay();

  // Create or find a Razorpay Customer first so we can pre-fill the checkout
  const customer = await rzp.customers
    .create({
      name: opts.userName ?? opts.userEmail,
      email: opts.userEmail,
      notes: { user_id: opts.userId },
    })
    .catch(() => null);

  const subscription = await rzp.subscriptions.create({
    plan_id: opts.planId,
    total_count: 100, // Razorpay's hard max; effectively "until cancelled"
    quantity: 1,
    customer_notify: 1,
    ...(customer?.id ? { customer_id: customer.id } : {}),
    notes: {
      user_id: opts.userId,
      user_email: opts.userEmail,
    },
  });

  return {
    subscriptionId: subscription.id as string,
    customerId: (customer?.id ?? null) as string | null,
  };
}

export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function getRazorpayInvoices(customerId: string) {
  const rzp = getRazorpay();
  const invoices = await rzp.invoices.all({ customer_id: customerId });
  return invoices.items || [];
}
