/**
 * URL construction.
 *
 * Everything goes through `URL`/`URLSearchParams` rather than string concatenation. Manual
 * `?a=${a}&b=${b}` is how an unencoded `&` in a search query silently splits into two
 * parameters, and how a user-supplied value becomes a parameter injection.
 */

/** Build a query string, skipping empty values so the URL stays clean and cacheable. */
export function buildQueryString(
 params: Record<string, string | number | boolean | null | undefined>,
): string {
 const search = new URLSearchParams();

 for (const [key, value] of Object.entries(params)) {
 if (value === null || value === undefined || value === '') continue;
 search.set(key, String(value));
 }

 const query = search.toString();
 return query ? `?${query}` : '';
}

/** Append params to a path or absolute URL, preserving any already present. */
export function withQuery(
 url: string,
 params: Record<string, string | number | boolean | null | undefined>,
): string {
 const [path, existing = ''] = url.split('?');
 const search = new URLSearchParams(existing);

 for (const [key, value] of Object.entries(params)) {
 if (value === null || value === undefined || value === '') search.delete(key);
 else search.set(key, String(value));
 }

 const query = search.toString();
 return query ? `${path}?${query}` : (path ?? url);
}

/** Join path segments without producing `//` or losing a leading slash. */
export function joinPath(...segments: string[]): string {
 const joined = segments
 .filter(Boolean)
 .map((segment, index) =>
 index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
 )
 .filter(Boolean)
 .join('/');

 return joined.startsWith('/') || /^[a-z]+:\/\//i.test(joined) ? joined : `/${joined}`;
}

/** Absolute URL from a path and an origin. For emails, OG tags and canonical links. */
export function absoluteUrl(path: string, origin: string): string {
 return new URL(path, origin).toString();
}

/**
 * Is this URL safe to navigate to or render as a link?
 *
 * Only `http` and `https`. `javascript:` is the classic XSS vector in an `href`, and
 * `data:` in a link is a phishing primitive — both parse fine as URLs, which is exactly why
 * a bare `new URL()` check is not enough.
 */
export function isSafeUrl(value: string): boolean {
 try {
 const protocol = new URL(value).protocol;
 return protocol === 'http:' || protocol === 'https:';
 } catch {
 return false;
 }
}

export function isSameOrigin(value: string, origin: string): boolean {
 try {
 return new URL(value, origin).origin === new URL(origin).origin;
 } catch {
 return false;
 }
}

/** `https://www.example.com/a/b` → `example.com`. For displaying a link's destination. */
export function displayHost(value: string): string {
 try {
 return new URL(value).hostname.replace(/^www\./, '');
 } catch {
 return value;
 }
}
