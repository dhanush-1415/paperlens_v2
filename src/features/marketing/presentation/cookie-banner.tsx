'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

export const CONSENT_KEY = 'pl_cookie_consent';
export type ConsentValue = 'accepted' | 'rejected';

function dispatchConsentEvent(value: ConsentValue) {
  window.dispatchEvent(new CustomEvent('cookieConsent', { detail: value }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
      } catch { /* localStorage unavailable */ }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    function onOpen() { setVisible(true); }
    window.addEventListener('openCookieSettings', onOpen);
    return () => window.removeEventListener('openCookieSettings', onOpen);
  }, []);

  function save(value: ConsentValue) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch { /* ignore */ }
    dispatchConsentEvent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border-subtle bg-surface-1/98 backdrop-blur-sm shadow-2xl"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Cookie className="h-4 w-4 shrink-0 text-text-tertiary" />

        <p className="flex-1 text-xs text-text-secondary">
          We use essential + analytics cookies.{' '}
          <Link href="/cookies" className="underline underline-offset-2 hover:text-text-primary">
            Learn more
          </Link>
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => save('rejected')}
            className="cursor-pointer rounded-md border border-border-subtle px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
          >
            Reject
          </button>
          <button
            onClick={() => save('accepted')}
            className="cursor-pointer rounded-md bg-brand-primary px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            Accept
          </button>
          <button
            onClick={() => save('rejected')}
            aria-label="Dismiss"
            className="cursor-pointer rounded-md p-1 text-text-tertiary hover:bg-surface-2"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
