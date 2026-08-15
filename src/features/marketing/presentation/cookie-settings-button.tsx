'use client';

export function CookieSettingsButton() {
  function open() {
    try { localStorage.removeItem('pl_cookie_consent'); } catch { /* ignore */ }
    window.dispatchEvent(new Event('openCookieSettings'));
  }

  return (
    <button
      onClick={open}
      className="cursor-pointer underline-offset-4 hover:text-text-primary hover:underline transition-colors text-xs text-text-secondary"
    >
      Cookie settings
    </button>
  );
}
