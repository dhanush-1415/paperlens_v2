/**
 * Security headers and Content Security Policy — the single source of truth.
 *
 * Consumed in exactly two places:
 * - `next.config.ts` `headers()` for the static headers that never vary per request.
 * - `src/proxy.ts` for the CSP, which may carry a per-request nonce.
 *
 * Nothing else in the codebase sets a security header.
 */

/**
 * CSP strategy.
 *
 * `compatible` (default)
 * No nonce. Next.js inlines the RSC flight payload as `<script>self.__next_f.push(...)</script>`,
 * which a nonce-less policy can only permit via `'unsafe-inline'`.
 *
 * `strict-nonce`
 * Per-request nonce + `'strict-dynamic'`. Strictly stronger, but Next can only apply a
 * nonce during server-side rendering, so **every page becomes dynamically rendered** and
 * the static shell / PPR that `cacheComponents` provides is lost.
 * See https://nextjs.org/docs/app/guides/content-security-policy#how-nonces-work-in-nextjs
 *
 * This project runs `compatible` because PPR was an explicit architectural choice.
 * The residual XSS surface is covered by React's automatic escaping and a lint rule
 * banning `dangerouslySetInnerHTML` outside `src/shared/ui/theme/`.
 * Flip this constant to change the policy everywhere. See docs/adr/0009-csp-strategy.md.
 */
export type CspStrategy = 'compatible' | 'strict-nonce';

export const CSP_STRATEGY: CspStrategy = 'compatible';

/** Origins the browser is allowed to talk to. Add third parties here, nowhere else. */
const CSP_ALLOWLIST = {
    connect: ['https://plausible.io'] as string[],
    img: [] as string[],
    font: [] as string[],
    script: ['https://plausible.io'] as string[],
    style: [] as string[],
    frame: [] as string[],
} as const;

interface BuildCspOptions {
    /** Present only when `CSP_STRATEGY === 'strict-nonce'`. */
    nonce?: string;
    isDev: boolean;
}

/**
 * Build the `Content-Security-Policy` header value.
 *
 * In development `'unsafe-eval'` is required: React uses `eval` to reconstruct
 * server-side error stacks in the browser. It is never emitted in production.
 */
export function buildContentSecurityPolicy({ nonce, isDev }: BuildCspOptions): string {
    const scriptSrc = nonce
        ? [`'nonce-${nonce}'`, "'strict-dynamic'"]
        : ["'self'", "'unsafe-inline'"];

    if (isDev) scriptSrc.push("'unsafe-eval'");

    const directives: Record<string, string[]> = {
        'default-src': ["'self'"],
        'script-src': [...scriptSrc, ...CSP_ALLOWLIST.script],
        // Tailwind ships a stylesheet, but Next injects inline <style> for critical CSS
        // and preloading. `'unsafe-inline'` on style-src is a materially smaller risk
        // than on script-src and has no safe alternative here.
        'style-src': ["'self'", "'unsafe-inline'", ...CSP_ALLOWLIST.style],
        'img-src': ["'self'", 'blob:', 'data:', ...CSP_ALLOWLIST.img],
        'font-src': ["'self'", 'data:', ...CSP_ALLOWLIST.font],
        'connect-src': ["'self'", ...CSP_ALLOWLIST.connect, ...(isDev ? ['ws:'] : [])],
        'frame-src': CSP_ALLOWLIST.frame.length > 0 ? CSP_ALLOWLIST.frame : ["'none'"],
        'worker-src': ["'self'", 'blob:'],
        'manifest-src': ["'self'"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
    };

    const serialized = Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');

    // HTTPS upgrade is meaningless on localhost and breaks local dev over http.
    return isDev ? serialized : `${serialized}; upgrade-insecure-requests`;
}

/**
 * Headers applied to every response and identical for all requests.
 *
 * Notably absent: `X-XSS-Protection` (deprecated, actively harmful in some browsers)
 * and `Expect-CT` (obsolete).
 */
export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
    // Force HTTPS for 2 years including subdomains. Only sent over HTTPS by the browser.
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    // Never let the browser sniff a response into a different MIME type.
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Legacy clickjacking defence; `frame-ancestors` in the CSP is the modern one.
    { key: 'X-Frame-Options', value: 'DENY' },
    // Send the origin cross-site, the full URL same-origin. Never leak paths of a
    // user's document to a third party.
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Deny every powerful browser capability this app does not use.
    {
        key: 'Permissions-Policy',
        value: [
            'accelerometer=()',
            'autoplay=()',
            'camera=()',
            'display-capture=()',
            'encrypted-media=()',
            'fullscreen=(self)',
            'geolocation=()',
            'gyroscope=()',
            'magnetometer=()',
            'microphone=()',
            'midi=()',
            'payment=()',
            'usb=()',
            'xr-spatial-tracking=()',
            'interest-cohort=()',
        ].join(', '),
    },
    // Process isolation — mitigates Spectre-class cross-origin leaks.
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    // Do not advertise the framework.
    { key: 'X-Powered-By', value: '' },
];

/** Headers for API routes: everything above, plus a hard no-store. */
export const API_SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
    ...SECURITY_HEADERS,
    { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
];
