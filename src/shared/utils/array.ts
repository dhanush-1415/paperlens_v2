/**
 * Array helpers.
 *
 * Everything here is non-mutating and returns a new array. Mutating a prop or a store slice
 * in place is how a React list stops re-rendering: the reference is unchanged, so nothing
 * downstream knows anything happened.
 *
 * Note `noUncheckedIndexedAccess` is on, so `array[i]` is `T | undefined` throughout the
 * codebase. That is intentional and these helpers are written to respect it rather than
 * assert past it.
 */

export function unique<T>(items: readonly T[]): T[] {
 return [...new Set(items)];
}

export function uniqueBy<T, K>(items: readonly T[], key: (item: T) => K): T[] {
 const seen = new Set<K>();
 const output: T[] = [];
 for (const item of items) {
 const id = key(item);
 if (seen.has(id)) continue;
 seen.add(id);
 output.push(item);
 }
 return output;
}

export function groupBy<T, K extends PropertyKey>(
 items: readonly T[],
 key: (item: T) => K,
): Record<K, T[]> {
 const output = {} as Record<K, T[]>;
 for (const item of items) {
 (output[key(item)] ??= []).push(item);
 }
 return output;
}

/** Index by a key. Later entries win, matching `Object.fromEntries` semantics. */
export function indexBy<T, K extends PropertyKey>(
 items: readonly T[],
 key: (item: T) => K,
): Record<K, T> {
 const output = {} as Record<K, T>;
 for (const item of items) output[key(item)] = item;
 return output;
}

export function partition<T>(
 items: readonly T[],
 predicate: (item: T) => boolean,
): [matching: T[], rest: T[]] {
 const matching: T[] = [];
 const rest: T[] = [];
 for (const item of items) (predicate(item) ? matching : rest).push(item);
 return [matching, rest];
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
 if (size <= 0) throw new Error('chunk size must be positive');
 const output: T[][] = [];
 for (let index = 0; index < items.length; index += size) {
 output.push(items.slice(index, index + size));
 }
 return output;
}

/**
 * Sort by a derived value, non-mutating and stable.
 *
 * `Array.prototype.sort` mutates, which is the single most common source of "why did this
 * list reorder itself" — the caller passed a prop straight in.
 */
export function sortBy<T>(
 items: readonly T[],
 selector: (item: T) => number | string,
 order: 'asc' | 'desc' = 'asc',
): T[] {
 const direction = order === 'asc' ? 1 : -1;
 return [...items].sort((left, right) => {
 const a = selector(left);
 const b = selector(right);
 if (a === b) return 0;
 return (a < b ? -1 : 1) * direction;
 });
}

/** Drop `null` and `undefined`, and tell the type system you did. */
export function compact<T>(items: readonly (T | null | undefined)[]): T[] {
 return items.filter((item): item is T => item !== null && item !== undefined);
}

export function first<T>(items: readonly T[]): T | undefined {
 return items[0];
}

export function last<T>(items: readonly T[]): T | undefined {
 return items[items.length - 1];
}

/** Non-mutating toggle. The standard operation on a set of selected IDs. */
export function toggle<T>(items: readonly T[], item: T): T[] {
 return items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item];
}

export function range(length: number, start = 0): number[] {
 return Array.from({ length }, (_, index) => start + index);
}

export function sum(items: readonly number[]): number {
 return items.reduce((total, value) => total + value, 0);
}
