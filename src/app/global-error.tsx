'use client';

/**
 * The last boundary (requirements 4, 5).
 *
 * This renders only when the **root layout itself** fails — a throw in `layout.tsx`, in
 * `providers.tsx`, or in anything they import at module scope. By the time React gets here
 * it has torn down the root layout and replaced the entire document, which has three
 * consequences that dictate everything about this file:
 *
 * 1. **It must render its own `<html>` and `<body>`.** There is no root layout left to
 * provide them.
 * 2. **`globals.css` is not applied.** The stylesheet is imported by the root layout, which
 * is the thing that just failed. Every Tailwind class here would be inert, so the styles
 * are inlined instead.
 * 3. **There is no theme, no container, no toaster and no design system.** `ThemeScript`
 * never ran, so there is no `data-theme` attribute to read. The only theme signal
 * available is the operating system's, via `prefers-color-scheme`.
 *
 * So this file duplicates a handful of colour values from `tokens.css`. That is a real
 * violation of "one source of truth", accepted deliberately and confined to this file: the
 * alternative is a component that imports the design system and therefore fails for exactly
 * the same reason the layout did. A boundary that can fail is not a boundary. The token
 * drift test in `shared/ui/tokens/tokens.test.ts` asserts these literals still match.
 *
 * ### Why raw `<style>` and not `dangerouslySetInnerHTML`
 *
 * Same rendered output, but `dangerouslySetInnerHTML` is banned outside `shared/ui/theme/`
 * by ESLint, and rightly — the exemption there exists for the one script that must run
 * before hydration. Static CSS as a string child needs no exemption.
 */

const CRITICAL_CSS = `
 :root {
 color-scheme: light dark;
 --ge-canvas: #ffffff;
 --ge-surface: #FFFFFF;
 --ge-border: #E4E7EC;
 --ge-text: #101828;
 --ge-muted: #667085;
 --ge-brand: #5B8CFF;
 --ge-on-brand: #FFFFFF;
 }

 @media (prefers-color-scheme: dark) {
 :root {
 --ge-canvas: #0b0f19;
 --ge-surface: #111827;
 --ge-border: #1f2937;
 --ge-text: #F5F6F8;
 --ge-muted: #98A2B3;
 }
 }

 * { box-sizing: border-box; }

 body {
 margin: 0;
 min-height: 100vh;
 display: grid;
 place-items: center;
 padding: 2rem 1.25rem;
 background-color: var(--ge-canvas);
 color: var(--ge-text);
 font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
 -webkit-font-smoothing: antialiased;
 }

 .ge-card {
 width: 100%;
 max-width: 32rem;
 padding: 3rem 2rem;
 border: 1px solid rgba(255, 255, 255, 0.1);
 border-radius: 1.5rem;
 background-color: rgba(255, 255, 255, 0.03);
 backdrop-filter: blur(20px);
 -webkit-backdrop-filter: blur(20px);
 box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
 text-align: center;
 position: relative;
 overflow: hidden;
 }

 .ge-card::before {
 content: '';
 position: absolute;
 top: 0;
 left: 0;
 right: 0;
 height: 1px;
 background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.5), transparent);
 }

 .ge-title { margin: 0 0 1rem; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; }
 .ge-body { margin: 0 0 2rem; font-size: 1rem; line-height: 1.6; color: var(--ge-muted); }

 .ge-actions { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }

 .ge-button {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 min-height: 3rem;
 padding: 0 1.5rem;
 border: none;
 border-radius: 0.75rem;
 font: inherit;
 font-size: 0.9375rem;
 font-weight: 700;
 cursor: pointer;
 text-decoration: none;
 background-color: var(--ge-brand);
 color: var(--ge-on-brand);
 transition: all 0.2s ease;
 box-shadow: 0 0 20px -5px rgba(91, 140, 255, 0.5);
 }

 .ge-button:hover { transform: scale(1.02); filter: brightness(1.1); }

 .ge-button--secondary {
 background-color: rgba(255, 255, 255, 0.05);
 border: 1px solid rgba(255, 255, 255, 0.1);
 color: var(--ge-text);
 box-shadow: none;
 }

 .ge-button--secondary:hover { background-color: rgba(255, 255, 255, 0.1); }

 .ge-button:focus-visible { outline: 2px solid var(--ge-brand); outline-offset: 2px; }

 .ge-digest {
 margin: 2rem 0 0;
 padding: 0.75rem;
 border-radius: 0.5rem;
 background-color: rgba(255, 255, 255, 0.03);
 border: 1px solid rgba(255, 255, 255, 0.05);
 font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
 font-size: 0.75rem;
 color: var(--ge-muted);
 word-break: break-all;
 }
`;

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    /**
     * `suppressHydrationWarning` is absent here on purpose: no script mutates this document,
     * so a mismatch would be a genuine bug and should be reported rather than silenced.
     */
    <html lang="en">
      <head>
        {/* `metadata` and `generateMetadata` are unsupported in a Client Component, which an
 error boundary always is. React's own <title> element is the supported path. */}
        <title>Something went wrong · PaperLens</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <style>{CRITICAL_CSS}</style>
      </head>
      <body>
        <main className="ge-card">
          <h1 className="ge-title">The application failed to load</h1>
          <p className="ge-body">
            This is on us, not on you — nothing you did caused it and nothing you uploaded was lost.
            Reloading usually clears it.
          </p>

          <div className="ge-actions">
            <button type="button" className="ge-button" onClick={unstable_retry}>
              Try again
            </button>
            {/*
             * A plain anchor, not `next/link`. The router is part of what may have failed,
             * and a full document load is the only navigation guaranteed to work from here.
             * The lint rule that wants `<Link>` is right everywhere else in the app and
             * wrong here for exactly that reason — a client-side transition would be handled
             * by the runtime this boundary exists to survive.
             */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="ge-button ge-button--secondary" href="/">
              Reload the site
            </a>
          </div>

          {/*
           * The digest is React's hash of the server-side error. It is the only identifier
           * available at this boundary — the container that would have supplied a
           * correlation ID is, by definition, unavailable — and it is what support quotes
           * back to find the matching `onRequestError` log line.
           */}
          {error.digest ? <p className="ge-digest">Reference: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
