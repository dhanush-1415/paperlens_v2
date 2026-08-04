/**
 * Security — public API (requirement 15).
 *
 * The web-platform mapping of the original brief's mobile requirements is recorded here so
 * the gaps are deliberate rather than forgotten:
 *
 * | Mobile requirement | Web equivalent | Where |
 * |---|---|---|
 * | SSL pinning | Egress allowlist + HSTS + `upgrade-insecure-requests` | `headers.ts`, `http/client.ts` |
 * | Secure storage / Keychain | `httpOnly` `Secure` `SameSite` cookies; nothing sensitive in `localStorage` | `auth/session-store.ts` |
 * | Screenshot prevention | **No web equivalent exists.** The OS owns the screen. | documented, not implemented |
 * | Root/jailbreak detection | **No web equivalent.** Treat every client as hostile instead. | by design |
 * | Obfuscation | Minification only. Client code is always readable; no secret ships to it. | build |
 * | Certificate transparency | Browser-enforced | n/a |
 *
 * `./taint` and `./origin` are NOT re-exported: both are `server-only`.
 */

export {
  API_SECURITY_HEADERS,
  CSP_STRATEGY,
  SECURITY_HEADERS,
  buildContentSecurityPolicy,
  type CspStrategy,
} from './headers';

export {
  escapeHtml,
  escapeScriptContent,
  safeCsvCell,
  safeFilename,
  safeHeaderValue,
  safeHref,
  safeLogValue,
} from './sanitize';

export {
  createMemoryRateLimiter,
  createPermissiveRateLimiter,
  rateLimitKey,
  retryAfterSeconds,
  type MemoryRateLimiterOptions,
  type RateLimitDecision,
  type RateLimiter,
} from './rate-limit';
