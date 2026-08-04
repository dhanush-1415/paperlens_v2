import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      /**
       * `server-only` and `client-only` enforce their boundary by having no export for the
       * other environment — a resolution failure, by design. Vitest resolves modules for Node
       * without Next's `react-server` condition, so a server module under test would fail to
       * import for a reason that says nothing about the code. The real guard still runs in
       * `next build`; these aliases apply to the test runner alone.
       */
      'server-only': fileURLToPath(new URL('./src/test/stubs/empty-module.ts', import.meta.url)),
      'client-only': fileURLToPath(new URL('./src/test/stubs/empty-module.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Playwright owns e2e/. Vitest must not try to run it.
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/app/**',
        'src/**/index.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        // A ratchet, set just under what the suite currently achieves (75.6 / 71.4 / 72.7 /
        // 75.6). Deliberately not a round 70: a threshold below the real figure lets coverage
        // decay silently until it hits the floor, which is the opposite of what a threshold
        // is for. Raise these when a suite lands; never lower them to make a build pass.
        //
        // The remainder is almost entirely presentational — `cva` variant objects, token
        // tables, and the two components whose behaviour only exists in a real browser
        // (`theme-script`, `tenant-tokens`), which the Playwright suite covers instead.
        statements: 74,
        branches: 71,
        functions: 72,
        lines: 75,
      },
    },
  },
});
