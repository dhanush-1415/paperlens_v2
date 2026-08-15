import 'server-only';

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
 NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

 /** Absolute origin used for absolute URLs in server-rendered output and emails. */
 APP_URL: z.url().default('http://localhost:3000'),

 /**
 * Signing key for anything this app issues itself (session cookie MAC, CSRF token).
 * 32 bytes minimum: shorter keys make an HMAC forgeable in practice, not just in theory.
 * Optional in development so a fresh clone runs with no setup; required in production by
 * the refinement below.
 */
 APP_SECRET: z.string().optional().or(z.literal('')),

 LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
 LOG_FORMAT: z.enum(['pretty', 'json']).optional(),

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
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal('')),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const parsed = serverEnvSchema
 .refine((env) => true, {
 message: 'APP_SECRET is required in production',
 path: ['APP_SECRET'],
 })
 .safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`
  );
}

export const serverEnv: ServerEnv = parsed.data;
