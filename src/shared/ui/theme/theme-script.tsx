/**
 * Renders the no-flash bootstrap script.
 *
 * A Server Component with no state and no client bundle cost — the script is a static string
 * emitted into the streamed HTML. Mount it as the first child of `<head>` in the root layout,
 * before the stylesheet link if possible, and nowhere else.
 *
 * The `<html>` element it writes to must carry `suppressHydrationWarning`. Without it React
 * compares the server's `<html>` (no `data-theme`) against the client's (`data-theme` set by
 * this script) and reports a mismatch on every load. The warning is suppressed for exactly
 * one attribute on exactly one element that a script is *designed* to have already changed —
 * this is the intended use of that prop, not a way to silence a real bug.
 */

import { THEME_BOOTSTRAP_SCRIPT } from './script';

export interface ThemeScriptProps {
  /**
   * CSP nonce for the inline script.
   *
   * Required whenever `Content-Security-Policy` uses `script-src 'nonce-…'`. `proxy.ts`
   * generates the nonce per request and the root layout threads it here. Omitted, the
   * script still runs under the `'compatible'` CSP strategy and is blocked under `'strict'`,
   * which fails visibly — a themed flash — rather than silently.
   */
  nonce?: string;
}

export function ThemeScript({ nonce }: ThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      // Not user input: a constant assembled from this codebase's own constants and passed
      // through `escapeScriptContent`. See the rationale in `./script.ts`.
      dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
    />
  );
}
