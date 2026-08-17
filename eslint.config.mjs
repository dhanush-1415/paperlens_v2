import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Architecture enforcement.
 *
 * The layering described in docs/ARCHITECTURE.md is not a convention here — it is a
 * lint error. Every rule below exists because a specific class of mistake would
 * otherwise be invisible in code review.
 *
 * Dependency direction:
 *   app → features/<name> (index only) → presentation → application → domain
 *                                                            ↑
 *                                        infrastructure (wired via module.ts only)
 *   everything → shared → core → (nothing)
 */

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'public/**',
    'prisma/**',
  ]),

  // ---------------------------------------------------------------------------
  // Global rules — every source file
  // ---------------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Logging has exactly one owner: src/core/logging.
      'no-console': 'warn',

      'no-restricted-syntax': [
        'warn',
        {
          // Configuration has exactly one owner: src/config.
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'process.env is read only in src/config/. Import the parsed, validated config ' +
            'from "@/config/env.server" or "@/config/env.client" instead.',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            'Use @/shared/utils/id (crypto-backed) — Math.random() is not reproducible in ' +
            'tests and is never acceptable for anything security-adjacent.',
        },
      ],

      'no-restricted-globals': [
        'warn',
        {
          name: 'localStorage',
          message:
            'Use the StorageDriver from @/core/storage — it is SSR-safe, namespaced, versioned and validated.',
        },
        {
          name: 'sessionStorage',
          message: 'Use the StorageDriver from @/core/storage.',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      eqeqeq: ['warn', 'smart'],
      'prefer-const': 'warn',
      'no-var': 'warn',
      'object-shorthand': ['warn', 'properties'],
      'no-unused-expressions': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
    },
  },

  // ---------------------------------------------------------------------------
  // core/ — the framework layer. Knows nothing about the product.
  // ---------------------------------------------------------------------------
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**', '@/server/**'],
              message:
                'core/ is the framework layer. It must not know that features, routes or the ' +
                'server composition root exist. Invert the dependency with a port.',
            },
            {
              group: ['@/shared/ui/**'],
              message:
                'core/ must not import UI. If a core concern needs a visual surface, expose a ' +
                'hook or a plain data structure and render it in shared/ui.',
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // shared/ — cross-feature building blocks. Never product-specific.
  // ---------------------------------------------------------------------------
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**', '@/server/**'],
              message:
                'shared/ is imported *by* features. If it needs something from a feature, it ' +
                'belongs in that feature, not in shared.',
            },
          ],
        },
      ],
    },
  },

  // shared/utils must be pure: no framework, no I/O, no side effects.
  {
    files: ['src/shared/utils/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['next', 'next/*', 'react', 'react-dom', '@/core/**', '@/shared/ui/**'],
              message:
                'shared/utils holds pure functions only — no framework, no I/O, no state. ' +
                'Anything needing those belongs in core/ or shared/hooks.',
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // features/ — modular slices. Siblings are invisible to each other.
  // ---------------------------------------------------------------------------
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/**'],
              message:
                'A feature never imports a sibling feature — that is how modular boundaries rot. ' +
                'Use relative paths within your own feature. To share, lift the code into ' +
                'shared/ or core/, or communicate through a port.',
            },
            {
              group: ['@/app/*', '@/app/**'],
              message: 'Features are consumed by routes, never the other way round.',
            },
          ],
        },
      ],
    },
  },

  // domain/ — entities, value objects and ports. The dependency sink.
  {
    files: ['src/features/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              /**
               * The negations are the *shared kernel*: `Result` and `AppError` are pure
               * TypeScript with no framework, no I/O and no product knowledge — they are the
               * language this codebase expresses failure in, the same way `Promise` is the
               * language it expresses asynchrony in. A port that returns
               * `Promise<Result<Analysis, AppError>>` states its failure modes in the type;
               * the alternative is either a domain-local clone of `Result` (two vocabularies
               * for one idea, converted at every layer) or ports that throw (failure modes
               * invisible to the type checker, which is what `Result` exists to fix).
               *
               * Nothing else is negotiable. No `next`, no `react`, no other `@/core` module,
               * no sibling layer — that is what keeps the business rules testable with no
               * framework and no bootstrap.
               */
              group: [
                '@/**',
                // Gitignore semantics: a path cannot be re-included while an ancestor stays
                // excluded, so `@/core` is un-banned first, its children re-banned, and only
                // then are the two kernel modules carved back out. The order is load-bearing.
                '!@/core',
                '@/core/*',
                '!@/core/result',
                '!@/core/result/**',
                '!@/core/errors',
                '!@/core/errors/**',
                'next',
                'next/*',
                'react',
                'react-dom',
                'zustand',
                '../application/*',
                '../infrastructure/*',
                '../presentation/*',
              ],
              message:
                'domain/ is the dependency sink: it imports nothing but its own files, zod, and ' +
                'the pure error kernel (@/core/result, @/core/errors). That is what makes the ' +
                'business rules testable without a framework.',
            },
          ],
        },
      ],
    },
  },

  // application/ — use cases. Depends on domain only.
  {
    files: ['src/features/*/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/infrastructure/**', '**/presentation/**', '@/shared/ui/**'],
              message:
                'Use cases depend on ports declared in domain/, never on a concrete adapter or ' +
                'on UI. The adapter is injected at runtime by module.ts.',
            },
          ],
        },
      ],
    },
  },

  // presentation/ — components, view models, server actions.
  {
    files: ['src/features/*/presentation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                'UI never touches an adapter, a repository implementation or a data source. ' +
                'Call a use case from application/.',
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // server/ — the composition root, and the one place allowed to reach past a
  // feature's public API.
  //
  // The exception is exactly one file per feature: `module.ts`, which exports the
  // registration function. Wiring cannot go through `index.ts`, because that barrel
  // re-exports `presentation/`, and a feature's Server Actions import `@/server/bootstrap`
  // for `action()` — so `bootstrap → index → actions → bootstrap` is a cycle that is
  // *evaluated* (action() runs at module scope), not merely declared.
  //
  // The carve-out is written as a negation so that adding a second permitted path is a
  // deliberate edit to this file, reviewed as the boundary change it is.
  // ---------------------------------------------------------------------------
  {
    files: ['src/server/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/*/*', '@/features/*/**', '!@/features/*/module'],
              message:
                "The composition root imports a feature's wiring — `@/features/<name>/module` " +
                '— and nothing else from inside it. Anything the server needs at runtime it ' +
                'resolves from the container by token.',
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // app/ — routing only.
  // ---------------------------------------------------------------------------
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/*/*', '@/features/*/**'],
              message:
                'Import a feature through its public API only: `@/features/<name>`. Reaching ' +
                "into its internals couples the route to the feature's private structure.",
            },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Product layers — the clock is injected, never read.
  //
  // core/ is exempt: that is where the default `now` providers live, and every one of them
  // is a constructor parameter a test can replace. Product code has no such excuse, and a
  // direct clock read there is what makes a test pass in the morning and fail at midnight.
  // ---------------------------------------------------------------------------
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}', 'src/server/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'process.env is read only in src/config/. Import the parsed, validated config ' +
            'from "@/config/env.server" or "@/config/env.client" instead.',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            'Use @/shared/utils/id (crypto-backed) — Math.random() is not reproducible in ' +
            'tests and is never acceptable for anything security-adjacent.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            'Resolve the CLOCK token instead. A hardcoded Date.now() makes anything ' +
            'time-dependent untestable without freezing the global clock.',
        },
        {
          selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
          message: 'Resolve the CLOCK token instead of calling new Date() with no arguments.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Single-owner exemptions — the one place each concern is allowed to be raw.
  // ---------------------------------------------------------------------------
  {
    files: ['src/core/logging/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['src/config/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/core/storage/**/*.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    // The theme bootstrap must run before first paint, which requires an inline script.
    // This is the only audited use of dangerouslySetInnerHTML in the codebase.
    files: ['src/shared/ui/theme/**/*.tsx'],
    rules: { 'react/no-danger': 'off' },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-globals': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-globals': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      eqeqeq: 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'object-shorthand': 'off',
      'no-unused-expressions': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'no-restricted-imports': 'off',
    },
  },
]);

export default eslintConfig;
