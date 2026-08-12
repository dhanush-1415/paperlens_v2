// ⚠️ SERVER-ONLY — never import from a 'use client' component.
// Initializes the Lemon Squeezy SDK and re-exports the functions we use.

import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

export function initLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error('[LemonSqueezy]', error),
  });
}

export { createCheckout, getSubscription, listSubscriptions, cancelSubscription } from '@lemonsqueezy/lemonsqueezy.js';
