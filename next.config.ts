import type { NextConfig } from 'next';

import { CACHE_PROFILES } from './src/core/cache/profiles';
import { API_SECURITY_HEADERS, SECURITY_HEADERS } from './src/core/security/headers';

/**
 * Framework configuration.
 *
 * This file declares *capabilities*. It never declares values — cache lifetimes come
 * from `src/core/cache/profiles.ts` and headers from `src/core/security/headers.ts`,
 * so both stay reachable from application code and tests.
 */
const nextConfig: NextConfig = {
  /**
   * Cache Components. Inverts the rendering default: everything is dynamic unless
   * explicitly wrapped in `use cache`. Enables `use cache`, `use cache: private`,
   * `use cache: remote`, `cacheLife`, `cacheTag`, and Partial Prerendering.
   *
   * Replaces the removed `experimental.dynamicIO`, `experimental.useCache`,
   * and per-route `experimental_ppr`.
   */
  cacheComponents: true,

  /** Named cache lifetimes, usable as `cacheLife('marketing')`. */
  cacheLife: CACHE_PROFILES,

  /**
   * Compile-time-checked `href` on `<Link>` and `router.push`. Stable in 16 —
   * this is no longer `experimental.typedRoutes`.
   */
  typedRoutes: true,

  reactStrictMode: true,

  poweredByHeader: false,

  experimental: {
    /** Enables `unauthorized()` / `forbidden()` and their file conventions. */
    authInterrupts: true,

    /**
     * Enables React's `experimental_taintObjectReference` / `experimental_taintUniqueValue`,
     * used in `src/core/security/taint.ts` to make it a runtime error to pass a raw
     * data-layer record into a Client Component.
     */
    taint: true,

    /** Barrel-file tree shaking. Add any package whose index re-exports a large surface. */
    optimizePackageImports: ['zod', 'zustand', 'class-variance-authority'],

    /**
     * Client router cache. Static segments stay warm for 5 minutes so back/forward
     * navigation is instant; dynamic segments are re-fetched after 30s.
     */
    staleTimes: {
      static: 300,
      dynamic: 30,
    },
  },

  // @ts-expect-error - Next 15+ has serverActions at the root, but the typings might not reflect it
  serverActions: {
    bodySizeLimit: '10mb',
  },

  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],

  /**
   * React Compiler is stable in Next 16 but off here deliberately: it is a performance
   * optimization that should be measured against a real bundle, not assumed, and it
   * adds a Babel pass to every build. See docs/adr/0010-react-compiler.md.
   * To enable: `npm i -D babel-plugin-react-compiler` and set `reactCompiler: true`.
   */
  // reactCompiler: true,

  images: {
    // `images.domains` is deprecated in 16 — `remotePatterns` is the supported form.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [...API_SECURITY_HEADERS],
      },
      {
        source: '/:path*',
        headers: [...SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
