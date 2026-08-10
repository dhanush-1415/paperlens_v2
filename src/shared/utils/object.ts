/**
 * Object helpers.
 *
 * `pick` and `omit` earn their place because they are the mechanism DTO mappers use to
 * *prove* a field never leaves the server: `pick(user, ['id', 'displayName'])` is auditable
 * in a way that spreading and hoping is not.
 */

export function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
 const output = {} as Pick<T, K>;
 for (const key of keys) {
 if (key in source) output[key] = source[key];
 }
 return output;
}

export function omit<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Omit<T, K> {
 const output = { ...source };
 for (const key of keys) delete output[key];
 return output;
}

/** Strip `undefined` values. For building request bodies without null-vs-absent ambiguity. */
export function compactObject<T extends object>(source: T): Partial<T> {
 const output: Partial<T> = {};
 for (const [key, value] of Object.entries(source)) {
 if (value !== undefined) output[key as keyof T] = value as T[keyof T];
 }
 return output;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
 if (typeof value !== 'object' || value === null) return false;
 const prototype = Object.getPrototypeOf(value) as unknown;
 return prototype === Object.prototype || prototype === null;
}

export function isEmpty(value: object): boolean {
 return Object.keys(value).length === 0;
}

/**
 * Structural equality, one level deep.
 *
 * Deliberately shallow. A deep comparison in a React dependency array or a Zustand selector
 * is a per-render tree walk, and reaching for one almost always means the state shape is
 * wrong — normalize it instead.
 */
export function shallowEqual(left: unknown, right: unknown): boolean {
 if (Object.is(left, right)) return true;
 if (!isPlainObject(left) || !isPlainObject(right)) return false;

 const leftKeys = Object.keys(left);
 if (leftKeys.length !== Object.keys(right).length) return false;

 return leftKeys.every((key) => Object.is(left[key], right[key]));
}

/**
 * Recursive merge, where a source value of `undefined` does not overwrite.
 *
 * Used for layering configuration: defaults, then tenant overrides, then runtime overrides.
 * Arrays are replaced wholesale rather than concatenated — merging an array of overrides
 * into an array of defaults produces a list nobody wrote.
 */
export function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
 const output: Record<string, unknown> = { ...base };

 for (const [key, value] of Object.entries(override)) {
 if (value === undefined) continue;
 const existing = output[key];
 output[key] =
 isPlainObject(existing) && isPlainObject(value)
 ? deepMerge(existing, value)
 : value;
 }

 return output as T;
}

/** `Object.entries` that keeps the key type instead of widening it to `string`. */
export function entriesOf<T extends object>(source: T): Array<[keyof T, T[keyof T]]> {
 return Object.entries(source) as Array<[keyof T, T[keyof T]]>;
}

export function keysOf<T extends object>(source: T): Array<keyof T> {
 return Object.keys(source) as Array<keyof T>;
}
