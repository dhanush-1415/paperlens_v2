/**
 * Injection tokens.
 *
 * A token is a runtime value that carries a compile-time type. `resolve(LOGGER)` returns
 * `Logger` with no cast, no generic argument at the call site, and no string key that a
 * typo can silently turn into a different service.
 *
 * The `__type` field never exists at runtime — it is a phantom type, present only so
 * TypeScript can infer `T` from the token. Marking it optional and never assigning it keeps
 * the object a bare `{ description }` in the emitted JavaScript.
 */
export interface Token<T> {
 readonly key: symbol;
 readonly description: string;
 /** Phantom. Never assigned, never read. Do not access. */
 readonly __type?: T;
}

/**
 * Mint a token.
 *
 * ```ts
 * export const LOGGER = token<Logger>('core.logger');
 * ```
 *
 * The description is the debugging surface: it appears in "no provider registered" errors
 * and in the container's registration dump, so it should read like a path, not a label.
 */
export function token<T>(description: string): Token<T> {
 return { key: Symbol(description), description };
}

/** Extracts the service type a token resolves to. */
export type TokenType<TToken> = TToken extends Token<infer T> ? T : never;
