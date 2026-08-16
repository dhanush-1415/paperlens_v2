import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import { appConfig } from '@/config';
import { serverEnv } from '@/config/env.server';
import { resolveTenant } from '@/config/tenant';
import { cn } from '@/shared/ui';
import { fontVariables } from '@/shared/ui/fonts';
import { TenantTokens, ThemeScript } from '@/shared/ui/theme';

import { Providers } from './providers';

import './globals.css';

/**
 * The root layout — the document itself.
 *
 * Four things happen here and nowhere else in the application:
 *
 * 1. **Fonts are registered.** `next/font` runs at module scope and registers a font with
 * the build. `shared/ui/fonts.ts` has exactly one legal importer, and this is it.
 * 2. **The theme is applied before first paint.** `<ThemeScript>` runs synchronously in
 * `<head>`, before the browser paints anything, so a user with dark mode selected never
 * sees a white flash. See `docs/adr/0011-theme-ownership.md`.
 * 3. **Tenant token overrides are emitted.** White-labelling (requirement 29) is a handful
 * of CSS custom properties on `:root`, injected after the stylesheet so they win.
 * 4. **The client composition root is mounted.** `<Providers>` wraps `{children}` — not the
 * whole document — which is what places `error.tsx` inside it.
 *
 * ### Why this layout stays static
 *
 * It reads no request-scoped API: no `headers()`, no `cookies()`, no `searchParams`. That
 * is deliberate, and it is what lets `cacheComponents` prerender a static shell for every
 * route. The tenant comes from `serverEnv`, which is read once at module load, not per
 * request.
 *
 * The one thing that would break it is a nonce-based CSP: a nonce must be unique per
 * response, so reading it here would opt the entire application out of static rendering.
 * `CSP_STRATEGY` is therefore `'compatible'` (nonce-free) by default, and flipping it to
 * `'strict-nonce'` means accepting dynamic rendering everywhere. That trade-off is recorded
 * in `docs/adr/0009-csp-strategy.md`; it is a real decision, not an oversight.
 *
 * ### Caveats the framework imposes
 *
 * Layouts do not re-render on client navigation — they are cached in the client router — so
 * nothing here may depend on the current URL. Layouts also cannot receive `searchParams`
 * for the same reason. Anything URL-dependent belongs in a page or a Client Component.
 */

const tenant = resolveTenant(serverEnv.TENANT_ID);

/**
 * Metadata is declared, never hand-written into `<head>`.
 *
 * Next deduplicates, orders and streams these tags; a manual `<meta>` in the JSX would
 * bypass that and can end up duplicated by a nested `generateMetadata`. `title.template`
 * means every page below states only its own name.
 */
export const metadata: Metadata = {
 metadataBase: new URL(appConfig.url),
 title: {
 default: `${tenant.productName} — ${tenant.tagline}`,
 template: `%s · ${tenant.productName}`,
 },
 description: appConfig.description,
 applicationName: tenant.productName,
 referrer: 'strict-origin-when-cross-origin',
 formatDetection: { telephone: false, address: false, email: false },
 openGraph: {
 type: 'website',
 siteName: tenant.productName,
 title: `${tenant.productName} — ${tenant.tagline}`,
 description: appConfig.description,
 url: appConfig.url,
 },
 twitter: {
 card: 'summary_large_image',
 title: tenant.productName,
 description: appConfig.description,
 },
 /**
 * Pre-production deployments are excluded from search engines at the source. A staging
 * URL that ranks is a support problem that outlives the deployment.
 */
 robots: appConfig.isPreProduction
 ? { index: false, follow: false }
 : { index: true, follow: true },
};

/**
 * `colorScheme: 'light dark'` tells the browser this document supports both, which is what
 * makes native form controls, scrollbars and the address bar follow the active theme
 * instead of staying light. The two `themeColor` entries do the same for mobile browser
 * chrome, and they are literal hex values from `tokens.css` because a `var()` does not
 * resolve inside a `<meta>` tag.
 */
export const viewport: Viewport = {
 colorScheme: 'light dark',
 themeColor: [
 { media: '(prefers-color-scheme: light)', color: '#ffffff' },
 { media: '(prefers-color-scheme: dark)', color: '#0a1224' },
 ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
 return (
 /**
 * `suppressHydrationWarning` is required here and is not a workaround.
 *
 * `ThemeScript` writes `data-theme` onto this element before React hydrates, so the
 * server-rendered attributes and the client's differ by construction. The attribute
 * suppresses the warning for this element only — it does not extend to children, so a
 * genuine hydration mismatch anywhere else still reports.
 */
 <html
 lang="en"
 dir="ltr"
 data-tenant={tenant.id}
 suppressHydrationWarning
 className={cn(fontVariables, 'h-full')}
 >
 <head>
 {/* First, before anything paints: the theme must be resolved before the browser has
 content to show. */}
 <ThemeScript />
 {/* Plausible analytics – loaded after consent */}
 <Script src="https://plausible.io/js/plausible.js" defer data-domain="paperlens.io" />
 {/* Tenant tokens */}
 <TenantTokens tenant={tenant} />
 </head>
 <body suppressHydrationWarning className="flex min-h-full flex-col antialiased text-text-primary bg-canvas">
 <Providers>{children}</Providers>
 </body>
 </html>
 );
}
