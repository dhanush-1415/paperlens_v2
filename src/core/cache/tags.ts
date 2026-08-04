/**
 * Cache tags (requirement 13).
 *
 * A cache tag is the join key between the code that *reads* data and the code that
 * *invalidates* it. Those two live in different files, usually written months apart, and
 * when they are string literals they drift: the data source tags `"documents"`, the action
 * revalidates `"document"`, and the bug is a stale list that nobody can reproduce.
 *
 * So tags are never literals. They are built here, by functions, from a fixed vocabulary.
 * A rename is a compile error at both ends.
 *
 * ### Shape
 *
 * `entity` or `entity:qualifier:value`, lowercase, colon-separated. The hierarchy is
 * deliberate: invalidating `documents:user:<id>` leaves other users' caches alone, while
 * `documents` clears the collection everywhere. Choosing the narrowest tag that is still
 * correct is the difference between a cheap mutation and a site-wide cache stampede.
 *
 * Next caps tags at 256 characters. `tag()` enforces that here rather than letting it fail
 * at runtime inside a `use cache` scope, where the stack trace points nowhere useful.
 */

const MAX_TAG_LENGTH = 256;

/**
 * Build one tag.
 *
 * Segments are lowercased and stripped of characters that would make a tag ambiguous.
 * The colon is the separator, so a value containing one would silently change the tag's
 * meaning — `user:a:b` reads as a different qualifier entirely.
 */
function tag(...segments: readonly (string | number)[]): string {
  const value = segments
    .map((segment) => String(segment).toLowerCase().replace(/[^a-z0-9._-]+/g, '-'))
    .filter((segment) => segment.length > 0)
    .join(':');

  if (value.length > MAX_TAG_LENGTH) {
    // Truncating would produce two different entities sharing a tag, which is worse than
    // failing: one user's invalidation would clear another's cache.
    throw new Error(
      `Cache tag exceeds ${MAX_TAG_LENGTH} characters: ${value.slice(0, 64)}... ` +
        'Use an opaque id rather than a human-readable value in the tag.',
    );
  }

  return value;
}

/**
 * The tag vocabulary.
 *
 * Entities mirror the product's nouns, taken from the `clearcut-app` reference: documents,
 * the vault that holds them, per-user usage counters, the account itself, and editorial
 * content. Adding an entity here is the deliberate act of declaring something cacheable.
 */
export const CACHE_TAGS = {
  /** Everything for one user. The blunt instrument — sign-out, plan change, account deletion. */
  user: (userId: string) => tag('user', userId),

  documents: {
    /** Every document, every user. Reserve for taxonomy or schema changes. */
    all: () => tag('documents'),
    /** One user's document list. The right tag for create/delete. */
    ofUser: (userId: string) => tag('documents', 'user', userId),
    /** A single document and its analysis. The right tag for an edit or re-analysis. */
    byId: (documentId: string) => tag('document', documentId),
  },

  vault: {
    ofUser: (userId: string) => tag('vault', 'user', userId),
    folder: (folderId: string) => tag('vault', 'folder', folderId),
  },

  usage: {
    /** Quota counters. Invalidated by every scan and every chat message. */
    ofUser: (userId: string) => tag('usage', 'user', userId),
  },

  account: {
    byId: (userId: string) => tag('account', userId),
    /** Entitlements derived from the plan. Invalidated on upgrade, downgrade and expiry. */
    entitlements: (userId: string) => tag('entitlements', userId),
  },

  sharing: {
    byToken: (shareToken: string) => tag('share', shareToken),
    ofDocument: (documentId: string) => tag('shares', 'document', documentId),
  },

  content: {
    /** Marketing and legal pages. Invalidated by a deploy, not by user action. */
    marketing: () => tag('content', 'marketing'),
    blog: () => tag('content', 'blog'),
    blogPost: (slug: string) => tag('content', 'blog', slug),
    /** `/for/[slug]` use-case pages. */
    useCase: (slug: string) => tag('content', 'use-case', slug),
    legal: () => tag('content', 'legal'),
  },

  /** Reference data: plan definitions, document taxonomies, supported jurisdictions. */
  reference: (name: string) => tag('reference', name),

  /** White-label scope. Invalidating this clears every tenant-derived render. */
  tenant: (tenantId: string) => tag('tenant', tenantId),
} as const;

export type CacheTagBuilders = typeof CACHE_TAGS;

/**
 * The tags a single document read should carry.
 *
 * Grouped because a cached function usually needs *several* tags — the entity, its owner's
 * collection, and the owner — so that any of the three invalidation paths reaches it.
 * Getting this list right at the read site is what makes narrow invalidation possible at
 * the write site.
 */
export function documentTags(documentId: string, userId: string): readonly string[] {
  return [
    CACHE_TAGS.documents.byId(documentId),
    CACHE_TAGS.documents.ofUser(userId),
    CACHE_TAGS.user(userId),
  ];
}

export function vaultTags(userId: string): readonly string[] {
  return [CACHE_TAGS.vault.ofUser(userId), CACHE_TAGS.user(userId)];
}

export function usageTags(userId: string): readonly string[] {
  return [CACHE_TAGS.usage.ofUser(userId), CACHE_TAGS.user(userId)];
}
