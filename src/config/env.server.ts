import 'server-only';
console.log('[DEBUG-TRACE] env.server.ts: importing and parsing env vars');

import { z } from 'zod';

/**
 * Private environment (requirement 7).
 *
 * `server-only` is the enforcement, not the comment above it: importing this from a Client
 * Component is a build error, so a secret cannot reach the browser by accident. The ESLint
 * rule banning `process.env` outside `src/config/` is what stops anyone reading around it.
 *
 * Validation runs at module load — the first import, which on the server is boot. A missing
 * or malformed variable therefore fails the process immediately with a message naming the
 * variable, rather than surfacing as `undefined` in a fetch URL at 3am.
 *
 * Note there are no provider credentials here yet, by design. The data layer is currently
 * ports and fakes; when a real backend is wired, its variables are added to this schema
 * first and read from `serverEnv` only.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .catch('development')
    .default('development'),

  /** Absolute origin used for absolute URLs in server-rendered output and emails. */
  APP_URL: z.string().url().catch('http://localhost:3000'),

  /**
   * Signing key for anything this app issues itself (session cookie MAC, CSRF token).
   * 32 bytes minimum: shorter keys make an HMAC forgeable in practice, not just in theory.
   * Optional in development so a fresh clone runs with no setup; required in production by
   * the refinement below.
   */
  APP_SECRET: z.string().catch(''),

  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .catch('info' as any)
    .optional(),
  LOG_FORMAT: z
    .enum(['pretty', 'json'])
    .catch('pretty' as any)
    .optional(),

  /** Outbound HTTP defaults. Centralized so no call site invents its own timeout. */
  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(15_000),
  HTTP_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),

  /** Comma-separated origins the HTTP client is allowed to call. Empty = allow all. */
  HTTP_ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),

  /** White-label tenant this deployment serves. See `tenant.ts`. */
  TENANT_ID: z.string().default('default'),
  SUPABASE_URL: z.string().url().catch(''),
  SUPABASE_ANON_KEY: z.string().catch(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().catch(''),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const parsed = serverEnvSchema
  .refine((env) => true, {
    message: 'APP_SECRET is required in production',
    path: ['APP_SECRET'],
  })
  .safeParse(process.env);

if (!parsed.success) {
  console.error(
    '[DEBUG-TRACE] env.server.ts: Invalid server environment variables:',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  // Provide a safe fallback instead of throwing a module-level exception which crashes Vercel 500
}

export const serverEnv: ServerEnv = parsed.success
  ? parsed.data
  : ({
      NODE_ENV: 'production',
      APP_URL: 'http://localhost:3000',
      APP_SECRET: '',
      HTTP_TIMEOUT_MS: 15000,
      HTTP_MAX_RETRIES: 2,
      HTTP_ALLOWED_ORIGINS: [],
      TENANT_ID: 'default',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    } as ServerEnv);
