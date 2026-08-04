import 'server-only';

/**
 * The server composition root (requirement 8).
 *
 * This is the only file in the entire server-side codebase that names a concrete
 * implementation of anything. `createInMemoryAuthProvider`, `createConsoleTransport`,
 * `createCookieSessionStore` appear here and nowhere else; every other module asks the
 * container for a `Token` and receives whatever this file bound to it.
 *
 * That is the whole point of the pattern, and it is worth being precise about what it buys:
 * swapping the fake auth provider for Supabase is an edit to *one function in this file*.
 * No call site changes, no import changes, no test changes — the tests already run against
 * a third implementation. If a swap ever requires touching a caller, the abstraction was
 * wrong and the leak should be fixed here rather than worked around there.
 *
 * ### Why a lazy singleton and not a module-level constant
 *
 * `const container = build()` at module scope would run during the build, when
 * `serverEnv` may be validating variables that only exist at runtime, and would tie the
 * container's lifetime to module evaluation order. Building on first access instead means
 * the container exists exactly once per server process, created the first time a request
 * needs it, and `instrumentation.ts` can force that to happen at boot so misconfiguration
 * fails before the first user rather than during their request.
 *
 * A process-wide singleton is correct here *because everything registered is stateless or
 * process-scoped*. Anything genuinely per-request — the request-scoped logger context, the
 * memoized session — comes from {@link getRequestScope} or `React.cache`, never from a
 * mutable field on a service. That distinction is the difference between a container and a
 * cross-request data leak.
 *
 * ### What is deliberately fake
 *
 * `AUTH_PROVIDER` is bound to `createInMemoryAuthProvider`. It is named `InMemory`, it is
 * documented as a fake, and it holds three demo users. Nothing about it pretends to be
 * production auth. The same is true of `RATE_LIMITER` (per-process, so useless behind more
 * than one instance) and `FLAGS_SERVICE` (static defaults). Each is a *complete*
 * implementation of its port — not a stub that throws — so the app runs end to end today
 * and the real adapter arrives as an addition rather than a rewrite.
 */

import { appConfig, devConfig, isDevelopment, isProduction } from '@/config';
import { serverEnv } from '@/config/env.server';
import { resolveTenant } from '@/config/tenant';
import {
  createAnalytics,
  createLoggerAnalyticsProvider,
  createNoopAnalyticsProvider,
  grantAll,
  type AnalyticsProvider,
} from '@/core/analytics';
import { createInMemoryAuthProvider } from '@/core/auth';
import { createSessionAccessors } from '@/core/auth/dal';
import { createCookieSessionStore } from '@/core/auth/session-store';
import {
  ANALYTICS,
  AUTH_PROVIDER,
  CLOCK,
  Container,
  DICTIONARY_LOADER,
  ERROR_REPORTER,
  FLAGS_SERVICE,
  HTTP_CLIENT,
  LOCAL_STORAGE_DRIVER,
  LOGGER,
  NETWORK_MONITOR,
  RATE_LIMITER,
  SESSION_STORAGE_DRIVER,
  SESSION_STORE,
  TRANSLATOR,
} from '@/core/container';
import { createRequestScopeAccessor } from '@/core/container/request';
import {
  withActionErrors,
  withRouteErrors,
  type ActionResult,
  type BoundaryDeps,
} from '@/core/errors';
import { createFlags, createStaticFlagProvider, FLAGS } from '@/core/flags';
import { createHttpClient, loggingInterceptor, timingInterceptor } from '@/core/http';
import {
  createBundledDictionaryLoader,
  createTranslator,
  DEFAULT_LOCALE,
  en,
  type MessageKey,
} from '@/core/i18n';
import { createConsoleTransport, createJsonTransport, createLogger } from '@/core/logging';
import { requestContextResolver } from '@/core/logging/context';
import { createLoggerErrorReporter } from '@/core/monitoring';
import { createNoopNetworkMonitor } from '@/core/network';
import { createMemoryRateLimiter } from '@/core/security';
import { createMemoryStorageDriver } from '@/core/storage';
import { epochMillis, systemClock } from '@/core/time';
import { registerDocumentAnalysis } from '@/features/document-analysis/module';
import { decodeMessageRef } from '@/shared/utils/string';
import type { FlagName, FlagValue } from '@/core/flags';

/**
 * Build the server container.
 *
 * Ordering matters only where a factory needs another service: the logger is registered
 * first because the reporter, analytics, HTTP client and flags all take it. Everything else
 * is order-independent — `resolve` is lazy, so a factory registered first may still depend
 * on one registered last.
 */
function buildServerContainer(): Container {
  const container = new Container('server');

  /**
   * Time. Bound before anything else because four other services take a clock, and they
   * must all take the *same* one — two clocks in one container can disagree, and a test
   * that freezes one and not the other fails in a way that takes an afternoon to find.
   */
  container.registerValue(CLOCK, systemClock);

  container.register(LOGGER, (c) => {
    const clock = c.resolve(CLOCK);

    return createLogger({
      scope: 'server',
      // `LOG_LEVEL` unset means "use the environment's default": everything in development,
      // info and above in production. An explicit variable always wins.
      level: serverEnv.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
      // Pretty output for a human reading a terminal, one JSON object per line for a log
      // aggregator that has to index it. Defaulting on `isProduction` rather than requiring
      // the variable means a deployment that forgets to set it still ships parseable logs.
      transports: [
        (serverEnv.LOG_FORMAT ?? (isProduction ? 'json' : 'pretty')) === 'json'
          ? createJsonTransport()
          : createConsoleTransport({ colour: true }),
      ],
      bindings: {
        environment: appConfig.environment,
        commit: appConfig.commitSha,
        tenant: serverEnv.TENANT_ID,
      },
      /**
       * The request context is *injected*, not imported by the logger.
       *
       * `AsyncLocalStorage` is a Node-only API. If `core/logging/logger.ts` imported it
       * directly, the logger would be unusable in the browser and in the edge runtime, and
       * every client component that logs would drag `node:async_hooks` into its bundle.
       * Resolving it here keeps the logger portable and puts the Node dependency in the one
       * file that already knows it is running on a server.
       */
      context: requestContextResolver,
      now: clock,
    });
  });

  /**
   * Crash reporting (requirement 17).
   *
   * The logger-backed reporter is not a placeholder for a missing feature — it is the
   * correct default for an app with no vendor configured: every report reaches the same
   * stream as everything else, with the same redaction and the same correlation ID. A
   * Sentry adapter replaces this one line.
   */
  container.register(ERROR_REPORTER, (c) => createLoggerErrorReporter(c.resolve(LOGGER)));

  container.register(ANALYTICS, (c) => {
    const logger = c.resolve(LOGGER);
    const now = epochMillis(c.resolve(CLOCK));

    /**
     * Server-side analytics with no vendor: log the event, drop it otherwise. The noop
     * provider is used rather than an empty array because `createAnalytics` with zero
     * providers would still buffer events waiting for consent, which is a slow leak.
     */
    const providers: AnalyticsProvider[] = appConfig.observability.analyticsEnabled
      ? [createLoggerAnalyticsProvider(logger)]
      : [createNoopAnalyticsProvider()];

    return createAnalytics({
      providers,
      logger,
      /**
       * Server-originated events carry no browser identity and no cross-site tracking, so
       * they are not the kind of processing a consent banner governs. Client-side analytics
       * starts at `denyAll` and waits for the user — see `app/providers.tsx`.
       */
      initialConsent: grantAll(now()),
      superProperties: {
        environment: appConfig.environment,
        release: appConfig.commitSha,
        surface: 'server',
      },
      now,
    });
  });

  container.register(HTTP_CLIENT, (c) => {
    const logger = c.resolve(LOGGER).child('http');

    return createHttpClient({
      timeoutMs: serverEnv.HTTP_TIMEOUT_MS,
      retries: serverEnv.HTTP_MAX_RETRIES,
      /**
       * The egress allowlist (requirement 15).
       *
       * The web has no equivalent of certificate pinning, but it does have this: a request
       * to a host that is not on the list never leaves the process. An SSRF that reaches
       * this client — a user-supplied URL that ends up as a fetch target — fails at the
       * allowlist rather than at the remote server.
       */
      allowedOrigins: serverEnv.HTTP_ALLOWED_ORIGINS,
      interceptors: [
        loggingInterceptor(logger),
        // A request slower than this is not an error, but it is a warning worth having
        // before it becomes one.
        timingInterceptor(logger, 2_000),
      ],
      logger,
      now: epochMillis(c.resolve(CLOCK)),
    });
  });

  /**
   * Network monitoring (requirement 14).
   *
   * The server is never "offline" in the sense the port models — it either served the
   * request or it did not. Binding the noop monitor rather than leaving the token
   * unregistered means shared code that resolves it works on both sides without a
   * `typeof window` check.
   */
  container.registerValue(NETWORK_MONITOR, createNoopNetworkMonitor());

  /**
   * The session cookie (requirement 3, 15).
   *
   * `httpOnly` so no script can read it, `Secure` in production so it never crosses plain
   * HTTP, `SameSite=Lax` so it does not ride along on a cross-site POST. Those three
   * attributes are the entire client-side defence, which is why the store is the only thing
   * permitted to set them.
   */
  container.register(SESSION_STORE, () => createCookieSessionStore());

  container.register(AUTH_PROVIDER, (c) => {
    /**
     * FAKE. Three demo users, in memory, gone on restart. Documented as such in
     * `core/auth/in-memory-provider.ts`, and the only reason the app runs end to end before
     * a real identity provider exists.
     *
     * The replacement is this factory call and nothing else — `SupabaseAuthProvider`,
     * `Auth0AuthProvider`, whatever it turns out to be — because every consumer talks to
     * the `AuthProvider` port and the DAL below is built from the token, not the class.
     *
     * ### Why this warns instead of throwing
     *
     * Refusing to bind in production would be the stronger guarantee, and it is the wrong
     * one *today*: there is no second adapter to fall back to, so the refusal would break
     * `next build` (which runs with NODE_ENV=production) and make the scaffold unshippable
     * to a staging environment. A guard that forces the next person to comment it out
     * teaches them to comment out guards.
     *
     * So it is loud instead. `fatal` is the highest severity the logger has, it is emitted
     * once per process at first resolve, and it is not suppressible by log level — which
     * means it is in the first screen of every production boot log until someone fixes it.
     * When the real adapter lands, this branch becomes the throw it wants to be.
     */
    if (isProduction) {
      c.resolve(LOGGER)
        .child('auth')
        .fatal('In-memory auth provider bound in a production build', undefined, {
          detail:
            'Passwords are compared as plaintext and sessions die with the process. ' +
            'Bind a real AuthProvider in buildServerContainer before serving real users.',
        });
    }

    return createInMemoryAuthProvider({
      store: c.resolve(SESSION_STORE),
      now: c.resolve(CLOCK),
    });
  });

  /**
   * Rate limiting (requirement 15).
   *
   * In memory, therefore per-process, therefore **not a real limit behind more than one
   * instance** — an attacker distributed across N replicas gets N times the quota. It is
   * bound anyway because the call sites, the key derivation and the `Retry-After` handling
   * all need to exist and be tested now; swapping the store for Redis or Upstash later is
   * one line and changes no caller.
   */
  container.register(RATE_LIMITER, (c) =>
    createMemoryRateLimiter({ now: epochMillis(c.resolve(CLOCK)) }),
  );

  container.register(FLAGS_SERVICE, (c) => {
    const analytics = c.resolve(ANALYTICS);

    return createFlags({
      /**
       * Static defaults from the registry, plus whatever the tenant overrides. No remote
       * provider is wired: a flag service that polls an endpoint on the server would make
       * every render dynamic, and `createRemoteFlagProvider` exists for the day that
       * trade-off is worth making deliberately.
       */
      providers: [createStaticFlagProvider(resolveTenant(serverEnv.TENANT_ID).flagOverrides)],
      context: {
        environment: appConfig.environment,
        tenantId: serverEnv.TENANT_ID,
      },
      logger: c.resolve(LOGGER).child('flags'),
      /**
       * Every evaluation is an analytics event, which is what makes an experiment
       * measurable: without exposure logging, a flag is a toggle, not a test.
       */
      onEvaluate: (name: FlagName, value: FlagValue) => {
        analytics.track('feature_flag.evaluated', { flag: name, value: String(value) });
      },
    });
  });

  /**
   * Storage on the server (requirement 12).
   *
   * There is no `localStorage` in Node, and there must not be a shared one: a process-wide
   * key/value store read during SSR would serve one user's draft to the next. Both tokens
   * get a *scoped* memory driver so that shared code which writes a preference during SSR
   * writes into a throwaway rather than throwing — and so that anything genuinely
   * persistent is forced through a cookie or the database, where it belongs.
   */
  container.register(LOCAL_STORAGE_DRIVER, () => createMemoryStorageDriver('server-local'), 'scoped');
  container.register(
    SESSION_STORAGE_DRIVER,
    () => createMemoryStorageDriver('server-session'),
    'scoped',
  );

  container.registerValue(DICTIONARY_LOADER, createBundledDictionaryLoader());

  /**
   * The translator is `scoped`, not `singleton` (requirement 29).
   *
   * Locale is a property of the request, not of the process. A singleton translator would
   * be built with the first request's language and then serve it to everyone — the classic
   * SSR concurrency bug, invisible in development where requests arrive one at a time.
   * Today there is one supported locale and the distinction is theoretical; binding it
   * correctly now means adding a second locale is a dictionary, not a refactor.
   */
  container.register(
    TRANSLATOR,
    (c) =>
      createTranslator({
        locale: DEFAULT_LOCALE,
        messages: en,
        logger: c.resolve(LOGGER).child('i18n'),
      }),
    'scoped',
  );

  /**
   * Feature registrations, last.
   *
   * Every core service above is bound by the time these run, so a feature's factories may
   * depend on any of them. The composition root's job ends here: it does not know what
   * `registerDocumentAnalysis` binds, only that the feature owns its own wiring. Adding a
   * second feature is one import and one line — which is the property that has to hold for
   * this to survive fifty of them.
   *
   * ### Why `/module` and not the feature barrel
   *
   * The barrel re-exports `presentation/`, and `presentation/actions.ts` imports *this file*
   * for `action()` and `checkPermissionResult()`. Importing the barrel here would close the
   * loop `bootstrap → index → actions → bootstrap`, and `action()` runs at module scope — so
   * the cycle would be evaluated during boot, not merely declared, and surface as a
   * `TypeError` on an undefined import from a stack trace that names none of the culprits.
   *
   * `module.ts` imports only `domain/`, `application/` and `infrastructure/`, never
   * `presentation/`. That is what makes this edge safe, and it is why every feature must keep
   * its registration function in a file that does not reach into its own UI.
   */
  registerDocumentAnalysis(container);

  return container;
}

let rootContainer: Container | null = null;

/**
 * The server container, built on first use.
 *
 * Every server-side consumer goes through here. It is safe to call from a Server Component,
 * a Server Action, a Route Handler or `instrumentation.ts` — but **not** from `proxy.ts`,
 * which Next documents as running in a separate context where shared modules and globals
 * must not be relied on.
 */
export function getServerContainer(): Container {
  rootContainer ??= buildServerContainer();
  return rootContainer;
}

/**
 * A container scoped to the current request.
 *
 * `React.cache()` gives per-request memoization for free, so the scope is created once per
 * request and every `scoped` registration resolves to the same instance within it — the
 * translator built for this user's locale, the storage driver holding this render's writes.
 * Singletons still come from the root, so nothing is duplicated.
 */
export const getRequestScope = createRequestScopeAccessor(getServerContainer);

/** The application logger. Prefer `logger().child('scope')` over a second registration. */
export function logger() {
  return getServerContainer().resolve(LOGGER);
}

/** The crash reporter. Never throws — see the `ErrorReporter` contract. */
export function errorReporter() {
  return getServerContainer().resolve(ERROR_REPORTER);
}

/** The dependencies every error boundary needs, resolved once. */
function boundaryDeps(): BoundaryDeps {
  const container = getServerContainer();
  return { logger: container.resolve(LOGGER), reporter: container.resolve(ERROR_REPORTER) };
}

/**
 * Boundary dependencies for a Server Action, which additionally resolves message keys.
 *
 * The translator is per-request, so it comes from the request scope rather than the process
 * container — resolving it here, once, is what lets every action return text a form can render
 * without any action or form knowing that a dictionary exists.
 *
 * The cast is the one place the message-key type is asserted rather than checked, and it is
 * safe in the direction that matters: an unknown key renders as itself and warns, which is a
 * visible bug rather than a crash. Checking it properly would mean threading `MessageKey`
 * through `AppError`, whose whole purpose is to be serializable across the wire.
 */
function actionBoundaryDeps(): BoundaryDeps {
  const t = getRequestScope().resolve(TRANSLATOR);

  return {
    ...boundaryDeps(),
    translate: (ref) => {
      const { key, params } = decodeMessageRef(ref);
      return t.t(key as MessageKey, params);
    },
  };
}

/**
 * Wrap a Server Action so it returns `Result` instead of throwing (requirements 4, 5).
 *
 * ```ts
 * export const analyzeDocument = action('document.analyze', async (input: FormData) => { … });
 * ```
 *
 * Bound here so no call site has to know how to build `BoundaryDeps` — which is what stops
 * one action logging to a different logger than the rest, and what makes "every action is
 * observed" a property of the codebase rather than a code-review habit.
 *
 * The dependencies are built **inside** the returned function, not alongside it. Every call
 * site is `export const x = action(…)` at module scope, which evaluates at import time — long
 * before there is a request, and therefore before there is a request scope to resolve the
 * translator from. Resolving per invocation is also what makes the locale the *caller's*
 * rather than whichever request happened to load the module first.
 */
export function action<TArgs extends unknown[], TResult>(
  operation: string,
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return (...args: TArgs) => withActionErrors(operation, fn, actionBoundaryDeps())(...args);
}

/**
 * Wrap a Route Handler so an uncaught throw becomes a correct HTTP response.
 *
 * ```ts
 * export const GET = route('health.get', async () => Response.json({ ok: true }));
 * ```
 */
export function route<TArgs extends unknown[]>(
  operation: string,
  fn: (...args: TArgs) => Promise<Response>,
): (...args: TArgs) => Promise<Response> {
  return withRouteErrors(operation, fn, boundaryDeps());
}

/**
 * The Data Access Layer's session accessors (requirement 3).
 *
 * Built from the container, so they follow whichever `AuthProvider` is bound. These are the
 * **only** sanctioned way to answer "who is this request": `verifySession` is memoized per
 * request, `requireSession` throws `unauthorized()`, `requirePermission` throws
 * `forbidden()`, and the `Result` variants exist for Server Actions, which must return a
 * value rather than throw.
 *
 * Note this is a lazy getter rather than a destructured constant. Destructuring at module
 * scope would build the container during module evaluation, which is exactly what
 * {@link getServerContainer} is lazy to avoid.
 */
function sessionAccessors() {
  const container = getServerContainer();
  return createSessionAccessors({
    authProvider: container.resolve(AUTH_PROVIDER),
    now: container.resolve(CLOCK),
  });
}

export const verifySession = () => sessionAccessors().verifySession();
export const requireSession = () => sessionAccessors().requireSession();
export const requirePermission: ReturnType<typeof sessionAccessors>['requirePermission'] = (
  ...args
) => sessionAccessors().requirePermission(...args);
export const getSessionResult = () => sessionAccessors().getSessionResult();
export const getPublicSession = () => sessionAccessors().getPublicSession();
export const checkPermissionResult: ReturnType<
  typeof sessionAccessors
>['checkPermissionResult'] = (...args) => sessionAccessors().checkPermissionResult(...args);

let booted = false;

/**
 * Force the container to exist, at process start.
 *
 * Called from `instrumentation.ts`'s `register()`, which Next guarantees runs once per
 * server instance and completes before the first request is handled. Two things happen
 * here that are worth doing eagerly: `serverEnv` validates (so a missing `APP_SECRET` in
 * production kills the boot rather than the first login), and every factory is registered
 * (so a typo in a token binding is a startup error, not a 500 at 3am).
 *
 * Idempotent, because `register()` can run again after a hot reload.
 */
export function bootstrapServer(): void {
  if (booted) return;
  booted = true;

  const container = getServerContainer();
  const log = container.resolve(LOGGER).child('bootstrap');

  log.info('Server bootstrapped', {
    environment: appConfig.environment,
    tenant: serverEnv.TENANT_ID,
    commit: appConfig.commitSha,
    flags: Object.keys(FLAGS).length,
  });

  if (devConfig.logContainerRegistrations) {
    log.debug('Container registrations', { tokens: container.registrations() });
  }
}
