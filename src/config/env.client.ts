import { z } from 'zod';

/**
 * Public environment (requirement 7).
 *
 * Everything here is compiled into the JavaScript that ships to the browser. Treat every
 * value as published — a "secret" with a `NEXT_PUBLIC_` prefix is a secret in a text file
 * on a CDN.
 *
 * Each variable must be written as a full literal `process.env.NEXT_PUBLIC_X`. Next inlines
 * these by static string replacement, so `process.env[name]` or a destructured `env.X`
 * resolves to `undefined` in the browser — silently, and only in a production build. The
 * explicit mapping below exists for exactly that reason and must not be "cleaned up" into a
 * loop.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'development', 'preview', 'staging', 'production']).default('local'),
  NEXT_PUBLIC_COMMIT_SHA: z.string().default('unknown'),
  /** Master switch. Individual providers still gate on consent. */
  NEXT_PUBLIC_ANALYTICS_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_ERROR_REPORTING_DSN: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA,
  NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  NEXT_PUBLIC_ERROR_REPORTING_DSN: process.env.NEXT_PUBLIC_ERROR_REPORTING_DSN,
});

if (!parsed.success) {
  // Thrown at module load, which in practice means at build time — a misconfigured public
  // variable should never reach a user's browser.
  throw new Error(
    `Invalid public environment variables:\n${JSON.stringify(z.treeifyError(parsed.error), null, 2)}`,
  );
}

export const clientEnv: ClientEnv = parsed.data;
