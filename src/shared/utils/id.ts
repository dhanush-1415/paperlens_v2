/**
 * Identifier generation.
 *
 * `Math.random()` is banned by ESLint across `src/**`, and this is the module the ban
 * exists to redirect people to. The reason is not pedantry: `Math.random()` is not
 * cryptographically secure, it is seeded per-process, and IDs generated from it collide in
 * practice at volumes this app will reach. `crypto.getRandomValues` is available in every
 * runtime this code targets — Node, edge, and every browser we support.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** RFC 4122 v4 UUID. The canonical entity identifier. */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * A short, URL-safe, unguessable token.
 *
 * Rejection sampling rather than `% ALPHABET.length`: the modulo introduces a bias toward
 * the first few characters, which quietly reduces the entropy a share link depends on.
 */
export function randomToken(length = 22): string {
  const bytes = new Uint8Array(length * 2);
  crypto.getRandomValues(bytes);

  let output = '';
  const limit = 256 - (256 % ALPHABET.length);

  for (let index = 0; index < bytes.length && output.length < length; index += 1) {
    const byte = bytes[index] as number;
    if (byte < limit) output += ALPHABET[byte % ALPHABET.length];
  }

  // Astronomically unlikely, but a short token is a security bug, not a cosmetic one.
  return output.length === length ? output : output + randomToken(length - output.length);
}

/**
 * A correlation ID.
 *
 * Prefixed so it is recognisable at a glance in a log aggregator, and so an ID minted here
 * is distinguishable from one propagated in from an upstream caller.
 */
export function correlationId(): string {
  return `pl_${uuid()}`;
}

/**
 * A stable ID for a DOM element or a React key.
 *
 * Not random and not unique across renders — for element IDs, prefer React's `useId`, which
 * is hydration-safe. This exists for keys derived from content, where a value is needed and
 * randomness would break reconciliation.
 */
export function slugId(value: string, fallback = 'item'): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || fallback;
}
