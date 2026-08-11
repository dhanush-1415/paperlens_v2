'use client';

/**
 * The client composition root (requirement 8).
 *
 * The browser's counterpart to `src/server/bootstrap.ts`, and the only file in the client
 * bundle that names a concrete implementation. Everything below it — components, hooks,
 * view models — resolves tokens and receives whatever this file bound.
 *
 * ### Why the providers nest in this order
 *
 * ```
 * ContainerProvider ← everything below resolves its dependencies from here
 * NetworkProvider ← needs the NETWORK_MONITOR token
 * ThemeProvider ← needs the LOCAL_STORAGE_DRIVER token
 * children
 * Toaster ← last, so its portal renders above the app
 * ```
 *
 * The container is outermost because it is the thing the others read from. Reversing any
 * pair would mean a provider constructing its own dependency, which is a second owner for
 * something that already has one.
 *
 * ### What is deliberately *not* here
 *
 * No state provider. Zustand stores are module-scoped and provider-free (see
 * `docs/adr/0006-state-management.md`), which is a large part of why they were chosen: a
 * store does not need to be threaded through the tree, and a Server Component rendering a
 * client child does not need a wrapper for it to work.
 *
 * No auth provider. Session state is not client state — it lives in an `httpOnly` cookie
 * the browser cannot read, is verified server-side per request by the DAL, and reaches the
 * client as ordinary props. A client-side `AuthContext` holding a user object would be a
 * second, spoofable source of truth for identity.
 */

import { useMemo, type ReactNode } from 'react';

import { appConfig, clientEnv, isDevelopment, isServer } from '@/config';
import {
 createAnalytics,
 createConsentStore,
 createLoggerAnalyticsProvider,
 createNoopAnalyticsProvider,
 type AnalyticsProvider,
} from '@/core/analytics';
import {
 ANALYTICS,
 CLOCK,
 Container,
 ERROR_REPORTER,
 FLAGS_SERVICE,
 HTTP_CLIENT,
 LOCAL_STORAGE_DRIVER,
 LOGGER,
 NETWORK_MONITOR,
 SESSION_STORAGE_DRIVER,
 TRANSLATOR,
} from '@/core/container';
import { ContainerProvider } from '@/core/container/context';
import { createFlags, createOverrideFlagProvider, createStaticFlagProvider } from '@/core/flags';
import { createHttpClient, csrfInterceptor, loggingInterceptor } from '@/core/http';
import { createTranslator, DEFAULT_LOCALE, en } from '@/core/i18n';
import { createConsoleTransport, createLogger } from '@/core/logging';
import { createLoggerErrorReporter } from '@/core/monitoring';
import { createBrowserNetworkMonitor } from '@/core/network';
import { NetworkProvider } from '@/core/network/context';
import { createLocalStorageDriver, createSessionStorageDriver } from '@/core/storage';
import { epochMillis, systemClock } from '@/core/time';
import { COOKIE_NAMES } from '@/shared/constants';
import { ThemeProvider, Toaster } from '@/shared/ui';

import type { FlagName, FlagValue } from '@/core/flags';


/**
 * Read a cookie the browser is allowed to read.
 *
 * Only ever used for the CSRF token, which is deliberately *not* `httpOnly` — the whole
 * point of the double-submit pattern is that this script can read it and echo it in a
 * header, which a cross-site page cannot do. The session cookie is `httpOnly` and this
 * function cannot see it, which is exactly right.
 */
function readCookie(name: string): string | undefined {
 if (isServer) return undefined;

 const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
 return match ? decodeURIComponent(match[1] as string) : undefined;
}

function buildClientContainer(): Container {
 const container = new Container('client');

 container.registerValue(CLOCK, systemClock);

 container.register(LOGGER, (c) =>
 createLogger({
 scope: 'client',
 /**
 * Warnings and errors only in production. Not for noise: every `console.log` in a
 * production bundle is a string that ships, is retained by whatever extension the
 * user has installed, and occasionally contains a document excerpt. The level is the
 * cheapest privacy control there is.
 */
 level: isDevelopment ? 'debug' : 'warn',
 // Colour off: the browser console applies its own styling per level, and ANSI escape
 // codes render as literal garbage there.
 transports: [createConsoleTransport({ colour: false })],
 bindings: { environment: appConfig.environment, commit: appConfig.commitSha },
 now: c.resolve(CLOCK),
 }),
 );

 container.register(ERROR_REPORTER, (c) => createLoggerErrorReporter(c.resolve(LOGGER)));

 container.register(LOCAL_STORAGE_DRIVER, () => createLocalStorageDriver());
 container.register(SESSION_STORAGE_DRIVER, () => createSessionStorageDriver());

 container.register(ANALYTICS, (c) => {
 const logger = c.resolve(LOGGER);
 const now = epochMillis(c.resolve(CLOCK));

 /**
 * No vendor is wired, by design: adding one is an adapter here, not an SDK call in a
 * component. `NEXT_PUBLIC_ANALYTICS_ENABLED` is the master switch, and it is off by
 * default so a fork of this repo does not start emitting events to a stranger's
 * project.
 */
 const providers: AnalyticsProvider[] = clientEnv.NEXT_PUBLIC_ANALYTICS_ENABLED
 ? [createLoggerAnalyticsProvider(logger)]
 : [createNoopAnalyticsProvider()];

 /**
 * Consent is read from storage and defaults to **undecided** (requirements 15, 16).
 *
 * The inverse of the server, and deliberately: server-side events carry no browser
 * identity, client-side ones do. Until the user decides, events are buffered rather
 * than sent — so the analytics call sites are written once, unconditionally, and
 * consent is enforced in one place instead of in every component that tracks.
 *
 * ### Why the stored state is passed through unchanged
 *
 * It reads as though a missing decision should become `denyAll(now())`, and that was the
 * first version. It is wrong twice.
 *
 * Behaviourally, `denied` and `unknown` are not the same state to `createAnalytics`:
 * `denied` *drops* events, `unknown` *buffers* them until the banner is answered. Coercing
 * an undecided visitor to `denied` therefore threw away exactly the events the buffer
 * exists to keep — including the one fired on the page where they then accepted. The
 * storage entry already falls back to `DEFAULT_CONSENT`, which is `unknown`.
 *
 * Mechanically, it also stamped a `decidedAt` for a decision nobody made — and that
 * timestamp was a clock read during render. Under `cacheComponents` a clock read while
 * prerendering is a non-deterministic operation, so every route whose tree resolved this
 * token during SSR (the marketing layout does, through the consent banner) abandoned its
 * prerender and shipped a client-rendered shell instead — no headings, no copy, no
 * structured data in the HTML. An analytics default silently cost the public site its
 * server-rendered content.
 */
 const stored = createConsentStore(c.resolve(LOCAL_STORAGE_DRIVER)).get();

 return createAnalytics({
 providers,
 logger,
 initialConsent: stored,
 superProperties: {
 environment: appConfig.environment,
 release: appConfig.commitSha,
 surface: 'client',
 },
 now,
 });
 });

 container.register(NETWORK_MONITOR, (c) =>
 /**
 * Safe to construct during the SSR pass of this component: the monitor feature-detects
 * at construction and returns `SERVER_NETWORK_STATUS` with no listeners attached when
 * there is no `window`.
 */
 createBrowserNetworkMonitor({ now: epochMillis(c.resolve(CLOCK)) }),
 );

 container.register(HTTP_CLIENT, (c) => {
 const logger = c.resolve(LOGGER).child('http');

 return createHttpClient({
 /**
 * Same-origin only from the browser. A client-side request to a third party would
 * either leak the user's IP and referrer to it or fail CORS; anything that genuinely
 * needs an upstream goes through a Route Handler, where the egress allowlist applies.
 */
 baseUrl: clientEnv.NEXT_PUBLIC_APP_URL,
 interceptors: [
 loggingInterceptor(logger),
 // Double-submit CSRF: the token is echoed from a readable cookie into a header that
 // a cross-site form post cannot set.
 csrfInterceptor(() => readCookie(COOKIE_NAMES.csrf)),
 ],
 logger,
 now: epochMillis(c.resolve(CLOCK)),
 });
 });

 container.register(FLAGS_SERVICE, (c) => {
 const analytics = c.resolve(ANALYTICS);

 return createFlags({
 /**
 * Order is precedence. The override provider — a developer's local toggles, ignored
 * entirely in production builds — is consulted before the static defaults, so a flag
 * can be flipped in devtools without a rebuild.
 */
 providers: [
 createOverrideFlagProvider(c.resolve(LOCAL_STORAGE_DRIVER)),
 createStaticFlagProvider({}),
 ],
 context: { environment: appConfig.environment },
 logger: c.resolve(LOGGER).child('flags'),
 onEvaluate: (name: FlagName, value: FlagValue) => {
 analytics.track('feature_flag.evaluated', { flag: name, value: String(value) });
 },
 });
 });

 container.register(TRANSLATOR, (c) =>
 createTranslator({
 locale: DEFAULT_LOCALE,
 messages: en,
 logger: c.resolve(LOGGER).child('i18n'),
 }),
 );

 return container;
}

/**
 * One container per page load, not one per module.
 *
 * This module is evaluated on the server too — Client Components are server-rendered before
 * they hydrate — and on the server a module-level singleton is shared by every concurrent
 * request. So the browser gets a cached instance (stable across React's development-mode
 * double render, which matters: a second instance would attach a second set of `online`
 * listeners), and the server builds a throwaway per render, which is cheap and cannot leak
 * one user's state into another's response.
 */
let browserContainer: Container | null = null;

function getClientContainer(): Container {
 if (isServer) return buildClientContainer();

 browserContainer ??= buildClientContainer();
 return browserContainer;
}

export interface ProvidersProps {
 children: ReactNode;
}

/**
 * Mounted exactly once, by the root layout, wrapping `{children}`.
 *
 * Wrapping `children` rather than the whole document is what puts `app/error.tsx` *inside*
 * these providers: an error boundary replaces the segment's children, so a page that throws
 * still renders inside a tree that has a container, a theme and a toaster — which is the
 * difference between a recoverable error page and a bare white screen.
 */
export function Providers({ children }: ProvidersProps) {
 const container = useMemo(() => getClientContainer(), []);

 return (
 <ContainerProvider container={container}>
 <NetworkProvider monitor={container.resolve(NETWORK_MONITOR)}>
 {/*
 * The driver is injected rather than imported so the provider stays testable: a
 * test renders it with `createMemoryStorageDriver()` and asserts persistence
 * without touching a real `localStorage` or leaking state between test files.
 */}
 <ThemeProvider driver={container.resolve(LOCAL_STORAGE_DRIVER)}>
 {children}
 {/*
 * One toast viewport for the whole app, mounted last so its fixed-position
 * container paints above everything. `toast()` is called from anywhere; nothing
 * else ever renders a `<Toaster />`.
 */}
 <Toaster />
 </ThemeProvider>
 </NetworkProvider>
 </ContainerProvider>
 );
}
