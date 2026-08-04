import { describe, expect, it } from 'vitest';

import { CACHE_TAGS, documentTags, usageTags, vaultTags } from './tags';

/**
 * Cache tags.
 *
 * A tag is the join key between the code that reads data and the code that invalidates it —
 * two files, usually written months apart. When they are string literals they drift: the data
 * source tags `"documents"`, the action revalidates `"document"`, and the bug is a stale list
 * nobody can reproduce. These tests assert the properties that make the drift impossible:
 * one builder per tag, a stable shape, and a hierarchy where the narrow tag never collides
 * with the broad one.
 */

/** Every leaf builder in the registry, flattened, with a sample argument. */
function everyTag(): Array<{ path: string; value: string }> {
  const out: Array<{ path: string; value: string }> = [];

  const walk = (node: unknown, path: string): void => {
    if (typeof node === 'function') {
      out.push({ path, value: (node as (...args: string[]) => string)('sample-id') });
      return;
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      walk(child, path ? `${path}.${key}` : key);
    }
  };

  walk(CACHE_TAGS, '');
  return out;
}

describe('tag shape', () => {
  it('produces a lowercase, colon-separated tag for every builder', () => {
    for (const { path, value } of everyTag()) {
      expect(value, path).toMatch(/^[a-z0-9._:-]+$/);
    }
  });

  it('gives every builder a distinct tag', () => {
    // Two builders returning the same string means invalidating one silently clears the
    // other — the failure that is hardest to see, because everything still "works".
    const values = everyTag().map((entry) => entry.value);

    expect(new Set(values).size).toBe(values.length);
  });

  it('stays under the 256-character cap Next enforces', () => {
    for (const { path, value } of everyTag()) {
      expect(value.length, path).toBeLessThanOrEqual(256);
    }
  });

  it('throws rather than truncating an oversized tag', () => {
    // Truncating would produce two entities sharing a tag: one user's invalidation clearing
    // another's cache. Failing loudly at the call site is the lesser harm.
    expect(() => CACHE_TAGS.documents.byId('x'.repeat(300))).toThrow(/exceeds 256/);
  });
});

describe('normalisation', () => {
  it('collapses a colon in a value, which would otherwise redefine the qualifier', () => {
    // `user:a:b` reads as a different qualifier entirely.
    expect(CACHE_TAGS.user('a:b')).toBe('user:a-b');
  });

  it('lowercases, so two spellings of one id are one tag', () => {
    expect(CACHE_TAGS.user('User-ABC')).toBe(CACHE_TAGS.user('user-abc'));
  });

  it('replaces whitespace and punctuation with a single dash', () => {
    expect(CACHE_TAGS.content.blogPost('Ten Ways To Read  A Lease!')).toBe(
      'content:blog:ten-ways-to-read-a-lease-',
    );
  });

  it('drops an empty segment rather than leaving a dangling separator', () => {
    expect(CACHE_TAGS.user('')).toBe('user');
  });
});

describe('the hierarchy', () => {
  it('scopes a collection to one user so the others are untouched', () => {
    // The whole point of the qualifier: `documents:user:<id>` invalidates one person's list,
    // `documents` invalidates every list on the site. Choosing the narrow one is the
    // difference between a cheap mutation and a cache stampede.
    expect(CACHE_TAGS.documents.ofUser('u1')).not.toBe(CACHE_TAGS.documents.ofUser('u2'));
    expect(CACHE_TAGS.documents.ofUser('u1')).not.toBe(CACHE_TAGS.documents.all());
  });

  it('does not let a document tag collide with the collection tag', () => {
    expect(CACHE_TAGS.documents.byId('u1')).not.toBe(CACHE_TAGS.documents.ofUser('u1'));
  });

  it('is stable across calls', () => {
    expect(CACHE_TAGS.documents.byId('doc_1')).toBe(CACHE_TAGS.documents.byId('doc_1'));
  });
});

describe('read-site tag groups', () => {
  it('tags a document read with all three invalidation paths', () => {
    // A cached read must carry every tag that could invalidate it: the entity itself, the
    // owner's collection, and the owner. Missing one means a mutation on that path leaves
    // this read stale.
    const tags = documentTags('doc_1', 'u1');

    expect(tags).toContain(CACHE_TAGS.documents.byId('doc_1'));
    expect(tags).toContain(CACHE_TAGS.documents.ofUser('u1'));
    expect(tags).toContain(CACHE_TAGS.user('u1'));
  });

  it('includes the blunt user tag in every user-scoped group', () => {
    // Sign-out, plan change and account deletion all invalidate `user:<id>`. Any read that
    // depends on who the user is must be reachable from it.
    for (const tags of [documentTags('d', 'u1'), vaultTags('u1'), usageTags('u1')]) {
      expect(tags).toContain(CACHE_TAGS.user('u1'));
    }
  });

  it('has no duplicates within a group', () => {
    for (const tags of [documentTags('d', 'u1'), vaultTags('u1'), usageTags('u1')]) {
      expect(new Set(tags).size).toBe(tags.length);
    }
  });
});
