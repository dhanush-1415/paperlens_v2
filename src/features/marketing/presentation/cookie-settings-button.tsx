'use client';

export function CookieSettingsButton() {
  function open() {
    try {
      localStorage.removeItem('pl_cookie_consent');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('openCookieSettings'));
  }

  return (
    <button
      onClick={open}
      className="cursor-pointer text-xs text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
    >
      Cookie settings
    </button>
  );
}
