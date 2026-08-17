import { clientEnv } from './env.client';
import { isDevelopment, isProduction } from './runtime';

/**
 * Application configuration (requirement 7).
 *
 * The distinction that makes this file worth having: `env.*.ts` is *input* — untyped
 * strings from the deployment platform. This is *derived policy* — the decisions the
 * application makes from that input. Feature code reads this and never reads env directly,
 * so changing where a value comes from (env var → remote config → tenant override) touches
 * one file.
 *
 * Safe on the client: it imports only `env.client` and `runtime`, both of which are.
 */

export type AppEnvironment = (typeof clientEnv)['NEXT_PUBLIC_APP_ENV'];

export interface AppConfig {
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly url: string;
  readonly environment: AppEnvironment;
  readonly commitSha: string;
  /** Non-production banners, verbose errors, devtools. */
  readonly isPreProduction: boolean;

  readonly support: {
    readonly email: string;
    readonly docsUrl: string;
    readonly statusUrl: string;
  };

  readonly observability: {
    readonly analyticsEnabled: boolean;
    readonly errorReportingEnabled: boolean;
    /** Fraction of sessions sampled for performance traces. */
    readonly tracesSampleRate: number;
  };

  readonly ui: {
    readonly defaultTheme: 'light' | 'dark' | 'system';
    readonly defaultLocale: string;
    readonly supportedLocales: readonly string[];
    /** Milliseconds a toast stays on screen before auto-dismissing. */
    readonly toastDurationMs: number;
  };

  readonly limits: {
    /** Bytes. Enforced client-side for feedback and server-side for truth. */
    readonly maxUploadBytes: number;
    /** Characters of pasted document text accepted in one submission. */
    readonly maxDocumentChars: number;
    readonly maxDocumentsPerBatch: number;
  };
}

export const appConfig: AppConfig = {
  name: 'PaperLens',
  shortName: 'PaperLens',
  description: 'Understand any document before you sign it.',
  url: clientEnv.NEXT_PUBLIC_APP_URL,
  environment: clientEnv.NEXT_PUBLIC_APP_ENV,
  commitSha: clientEnv.NEXT_PUBLIC_COMMIT_SHA,
  isPreProduction: clientEnv.NEXT_PUBLIC_APP_ENV !== 'production',

  support: {
    email: 'support@paperlens.app',
    docsUrl: '/docs',
    statusUrl: '/status',
  },

  observability: {
    analyticsEnabled: clientEnv.NEXT_PUBLIC_ANALYTICS_ENABLED,
    errorReportingEnabled: Boolean(clientEnv.NEXT_PUBLIC_ERROR_REPORTING_DSN),
    // Full sampling outside production is affordable and makes local traces useful;
    // 10% in production keeps the bill and the ingest volume sane.
    tracesSampleRate: isProduction ? 0.1 : 1,
  },

  ui: {
    defaultTheme: 'system',
    defaultLocale: 'en',
    supportedLocales: ['en'],
    toastDurationMs: 5_000,
  },

  limits: {
    maxUploadBytes: 20 * 1024 * 1024,
    maxDocumentChars: 200_000,
    maxDocumentsPerBatch: 10,
  },
} as const;

/** Development-only switches. Every one of these is `false` in a production build. */
export const devConfig = {
  /** Log every resolved container token at boot. */
  logContainerRegistrations: isDevelopment,
  /** Surface `AppError.message` (the engineer-facing one) in the UI. */
  showTechnicalErrors: isDevelopment,
} as const;
