import { describe, expect, it } from 'vitest';

import { ROUTES } from './routes';
import { QUERY_PARAMS, SORT_ORDERS, sanitizeRedirectTo } from './query-params';

/**
 * Search parameters, and the open-redirect guard.
 *
 * `sanitizeRedirectTo` is the only piece of security-relevant code in this file, and it is
 * tested the way a guard should be: with the bypasses, not with the happy path. An open
 * redirect is the oldest phishing primitive on the web — the victim signs in on the real
 * domain, sees the real certificate, and is then handed to the attacker's page with the flow
 * looking entirely legitimate.
 *
 * The list below is the set of strings that have historically defeated a `startsWith('/')`
 * check in real applications. Each one is a path in the sense the string comparison means and
 * an absolute URL in the sense the browser means.
 */

describe('the parameter registry', () => {
  it('gives every parameter a distinct key', () => {
    // Two names mapping to one key means writing one silently overwrites the other.
    const keys = Object.values(QUERY_PARAMS);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses keys that survive a URL round trip unencoded', () => {
    for (const key of Object.values(QUERY_PARAMS)) {
      expect(encodeURIComponent(key), key).toBe(key);
    }
  });

  it('offers exactly the two sort directions', () => {
    expect(SORT_ORDERS).toEqual(['asc', 'desc']);
  });
});

describe('sanitizeRedirectTo', () => {
  const FALLBACK = ROUTES.scan;

  it('accepts a same-origin absolute path', () => {
    expect(sanitizeRedirectTo('/vault', FALLBACK)).toBe('/vault');
    expect(sanitizeRedirectTo('/document/doc_1?tab=risks', FALLBACK)).toBe(
      '/document/doc_1?tab=risks',
    );
  });

  it('rejects an absolute URL to another origin', () => {
    expect(sanitizeRedirectTo('https://evil.example/login', FALLBACK)).toBe(FALLBACK);
    expect(sanitizeRedirectTo('http://evil.example', FALLBACK)).toBe(FALLBACK);
  });

  it('rejects a protocol-relative URL, which looks like a path and is not', () => {
    // `//evil.example` inherits the current scheme and navigates off-origin. It passes
    // `startsWith('/')`, which is exactly why this check exists separately.
    expect(sanitizeRedirectTo('//evil.example', FALLBACK)).toBe(FALLBACK);
    expect(sanitizeRedirectTo('//evil.example/vault', FALLBACK)).toBe(FALLBACK);
  });

  it('rejects the backslash variant browsers normalise into a protocol-relative URL', () => {
    expect(sanitizeRedirectTo('/\\evil.example', FALLBACK)).toBe(FALLBACK);
  });

  it('rejects a scheme that executes rather than navigates', () => {
    expect(sanitizeRedirectTo('javascript:alert(1)', FALLBACK)).toBe(FALLBACK);
    expect(sanitizeRedirectTo('data:text/html,<script>alert(1)</script>', FALLBACK)).toBe(FALLBACK);
  });

  it('rejects a bare host, which resolves relative to the current path', () => {
    expect(sanitizeRedirectTo('evil.example', FALLBACK)).toBe(FALLBACK);
  });

  it('falls back for absent or empty input', () => {
    expect(sanitizeRedirectTo(null, FALLBACK)).toBe(FALLBACK);
    expect(sanitizeRedirectTo(undefined, FALLBACK)).toBe(FALLBACK);
    expect(sanitizeRedirectTo('', FALLBACK)).toBe(FALLBACK);
  });

  it('returns the caller-supplied fallback rather than a hardcoded one', () => {
    // The fallback differs by call site: sign-in lands on the app, sign-out on the home page.
    expect(sanitizeRedirectTo(null, ROUTES.home)).toBe(ROUTES.home);
  });
});
