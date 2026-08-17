/**
 * Runtime facts.
 *
 * The only questions about *where the code is executing* that the rest of the codebase is
 * allowed to ask. Everything else — "is this staging?", "is analytics on?" — is a config
 * value, not a runtime check, and lives in `app.config.ts`.
 *
 * Safe on both sides of the RSC boundary: `NODE_ENV` is statically replaced by the bundler
 * in the client build, so these collapse to constants and the dead branches are dropped.
 */

export const NODE_ENV = (process.env.NODE_ENV ?? 'development') as
  'development' | 'production' | 'test';

export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';

/**
 * True in Server Components, Server Actions, route handlers, proxy and instrumentation.
 *
 * Checked via `window` rather than `typeof process`, because `process` is shimmed in the
 * browser bundle and would answer wrongly.
 */
export const isServer = typeof window === 'undefined';
export const isBrowser = !isServer;

/**
 * Which server runtime this module was loaded into.
 *
 * Next sets `NEXT_RUNTIME` to `nodejs` or `edge`. In v16 `proxy.ts` runs on Node, so the
 * edge branch only matters for route handlers that opt in explicitly. Anything reaching for
 * `node:` built-ins should assert on this rather than assume.
 */
export const runtime: 'nodejs' | 'edge' | 'browser' = isServer
  ? ((process.env.NEXT_RUNTIME as 'nodejs' | 'edge' | undefined) ?? 'nodejs')
  : 'browser';

export const isEdgeRuntime = runtime === 'edge';
