/**
 * Configuration — public API.
 *
 * `./env.server` is deliberately NOT re-exported. It carries `server-only`, and a barrel
 * that re-exported it would make this whole module unimportable from a Client Component —
 * which would in turn push every consumer back to reading `process.env` directly, defeating
 * the point. Server code imports `@/config/env.server` explicitly; that explicitness is the
 * feature.
 */

export { appConfig, devConfig, type AppConfig, type AppEnvironment } from './app.config';
export { clientEnv, type ClientEnv } from './env.client';
export {
  NODE_ENV,
  isBrowser,
  isDevelopment,
  isEdgeRuntime,
  isProduction,
  isServer,
  isTest,
  runtime,
} from './runtime';
export {
  DEFAULT_TENANT_ID,
  isKnownTenant,
  resolveTenant,
  type TenantConfig,
} from './tenant';
