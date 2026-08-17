import Link from 'next/link';
import { ArrowRight, ShieldAlert, AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Order Canceled | PaperLens',
  robots: { index: false, follow: false },
};

export default function OrderFailedPage() {
  return (
    <div className="dark bg-canvas">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6 text-center">
        {/* Ambient backgrounds */}
        <div className="bg-destructive/5 pointer-events-none absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute right-[-15%] bottom-[-10%] h-[50%] w-[45%] rounded-full bg-brand-primary/5 blur-[140px]" />

        <div className="z-10 flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-border-strong bg-surface-2/25 p-8 shadow-2xl backdrop-blur-xl">
          <div className="bg-destructive/10 border-destructive/20 text-destructive flex h-16 w-16 items-center justify-center rounded-2xl border shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <ShieldAlert size={28} />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black tracking-tight text-text-primary">
              Checkout Canceled
            </h1>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-text-secondary">
              Your transaction was not completed, and your card was not charged. If you ran into an
              issue, please try again or contact support.
            </p>
          </div>

          <div className="mt-2 flex w-full flex-col gap-3">
            <Link href={ROUTES.pricing} className="w-full">
              <Button variant="premium" size="lg" fullWidth>
                Return to Pricing
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>

            <Link href={ROUTES.vault} className="w-full">
              <Button variant="secondary" size="lg" fullWidth>
                Go to My Vault
              </Button>
            </Link>
          </div>

          <span className="mt-2 flex items-center gap-1 text-[10px] text-text-tertiary">
            <AlertCircle size={10} /> Secure checkout powered by Razorpay & LemonSqueezy
          </span>
        </div>
      </div>
    </div>
  );
}
