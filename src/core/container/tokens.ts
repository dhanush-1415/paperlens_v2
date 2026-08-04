import type { Analytics } from '../analytics/types';
import type { AuthProvider, SessionStore } from '../auth/types';
import type { Flags } from '../flags/types';
import type { HttpClient } from '../http/types';
import type { DictionaryLoader, Translator } from '../i18n/types';
import type { Logger } from '../logging/types';
import type { ErrorReporter } from '../monitoring/types';
import type { NetworkMonitor } from '../network/types';
import type { RateLimiter } from '../security/rate-limit';
import type { StorageDriver } from '../storage/types';

import { token } from './token';

/**
 * The service registry.
 *
 * Every injectable in the application is declared here and nowhere else. One file to read
 * to know what the system is made of, one place a name collision can happen, and one import
 * path for consumers — `import { LOGGER } from '@/core/container'`.
 *
 * Tokens are declared here; *bindings* are not. The composition roots
 * (`src/server/bootstrap.ts` for the server, `src/app/providers.tsx` for the client) decide
 * which implementation each token gets, which is what lets the same token resolve to a real
 * adapter in production and a fake in a test without a single call site changing.
 *
 * This file imports types only. It must never import an implementation — doing so would
 * pull every adapter in the system into every bundle that resolves anything.
 *
 * The string passed to `token()` is a description, not a key: identity comes from the
 * `Symbol` it creates, so two tokens with the same description are still distinct and a
 * duplicate declaration cannot silently shadow an existing binding.
 */

// --- Observability -----------------------------------------------------------------------
export const LOGGER = token<Logger>('core.logging.logger');
export const ERROR_REPORTER = token<ErrorReporter>('core.monitoring.errorReporter');
export const ANALYTICS = token<Analytics>('core.analytics.analytics');

// --- Transport ---------------------------------------------------------------------------
export const HTTP_CLIENT = token<HttpClient>('core.http.client');
export const NETWORK_MONITOR = token<NetworkMonitor>('core.network.monitor');

// --- Identity ----------------------------------------------------------------------------
export const AUTH_PROVIDER = token<AuthProvider>('core.auth.provider');
export const SESSION_STORE = token<SessionStore>('core.auth.sessionStore');

// --- Platform ----------------------------------------------------------------------------
export const RATE_LIMITER = token<RateLimiter>('core.security.rateLimiter');
export const FLAGS_SERVICE = token<Flags>('core.flags.service');

/**
 * Storage drivers, one token per backing store.
 *
 * Separate tokens rather than one `StorageDriver`, because the choice between them is a
 * lifetime decision — a preference belongs in `local`, a per-tab draft in `session` — and a
 * single token would force every consumer to pick, which is how a draft ends up outliving
 * the tab that created it.
 */
export const LOCAL_STORAGE_DRIVER = token<StorageDriver>('core.storage.local');
export const SESSION_STORAGE_DRIVER = token<StorageDriver>('core.storage.session');

// --- Localization ------------------------------------------------------------------------
export const TRANSLATOR = token<Translator>('core.i18n.translator');
export const DICTIONARY_LOADER = token<DictionaryLoader>('core.i18n.dictionaryLoader');

/**
 * The clock.
 *
 * Injected rather than called directly so that anything time-dependent — session expiry,
 * TTLs, rate-limit windows, relative dates — is testable without freezing the global clock
 * and without `vi.useFakeTimers()` leaking between suites.
 *
 * ESLint enforces this in `features/`, `app/` and `server/`: `Date.now()` and argument-less
 * `new Date()` are errors there. `core/` is exempt because that is where the injectable
 * defaults live (`now = () => Date.now()` as a constructor parameter), and a default a test
 * can replace is the opposite of the problem this rule exists to prevent.
 */
export const CLOCK = token<() => Date>('core.time.clock');
