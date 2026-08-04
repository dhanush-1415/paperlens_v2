import { configurationError } from '../errors/app-error';

import type { Token } from './token';

/**
 * Dependency injection (requirement 8).
 *
 * ~150 lines instead of InversifyJS or tsyringe, and the reasons are specific rather than
 * ideological:
 *
 * - Both need `reflect-metadata` and `emitDecoratorMetadata`. SWC/Turbopack support for
 *   legacy decorator metadata is a moving target, and turning it on affects every file.
 * - Decorator-based registration defeats tree-shaking: the container has to import every
 *   implementation to read its metadata, so all of them end up in the graph.
 * - Neither survives the RSC boundary. A container instance is not serializable, so it can
 *   never be handed from a Server Component to a Client Component — a constraint that
 *   makes constructor-injection-everywhere the wrong shape for this runtime anyway.
 *
 * What this gives instead: explicit factories, typed tokens, three lifetimes, and
 * `override()` so a test swaps one service without a module mock.
 *
 * `resolve` is intentionally synchronous. An async resolve would push `await` into every
 * consumer, including Client Components where it is not available. Factories that need
 * async setup return an object whose *methods* are async — the standard shape for a port.
 */

export type Lifetime =
  /** One instance per container. The default for stateless services. */
  | 'singleton'
  /** A new instance per `resolve` call. For anything holding per-call state. */
  | 'transient'
  /** One instance per child scope; falls back to the parent for `singleton` registrations. */
  | 'scoped';

export interface Registration<T> {
  readonly factory: (container: Container) => T;
  readonly lifetime: Lifetime;
}

/** Marker used to distinguish "cached as undefined" from "not cached". */
const UNRESOLVED = Symbol('unresolved');

export class Container {
  readonly #registrations = new Map<symbol, Registration<unknown>>();
  readonly #instances = new Map<symbol, unknown>();
  readonly #resolving = new Set<symbol>();
  readonly #parent: Container | undefined;
  readonly #name: string;

  constructor(name = 'root', parent?: Container) {
    this.#name = name;
    this.#parent = parent;
  }

  get name(): string {
    return this.#name;
  }

  /**
   * Bind a token to a factory.
   *
   * Registering the same token twice throws. Silent last-write-wins is how a container
   * ends up serving a service nobody remembers registering; use `override` when replacing
   * is the intent.
   */
  register<T>(target: Token<T>, factory: (container: Container) => T, lifetime: Lifetime = 'singleton'): this {
    if (this.#registrations.has(target.key)) {
      throw configurationError(
        `Token "${target.description}" is already registered in container "${this.#name}". Use override() to replace it.`,
      );
    }
    this.#registrations.set(target.key, { factory, lifetime } as Registration<unknown>);
    return this;
  }

  /** Bind a token to an already-constructed value. */
  registerValue<T>(target: Token<T>, value: T): this {
    return this.register(target, () => value, 'singleton');
  }

  /**
   * Replace a binding, discarding any instance already built from it.
   *
   * This is the seam the whole architecture leans on: a test overrides `AUTH_PROVIDER`
   * with a fake and every layer above it is exercised unchanged. Returns a disposer so a
   * test can restore the previous binding in `afterEach`.
   */
  override<T>(target: Token<T>, factory: (container: Container) => T, lifetime: Lifetime = 'singleton'): () => void {
    const previous = this.#registrations.get(target.key);
    const previousInstance = this.#instances.has(target.key)
      ? this.#instances.get(target.key)
      : UNRESOLVED;

    this.#registrations.set(target.key, { factory, lifetime } as Registration<unknown>);
    this.#instances.delete(target.key);

    return () => {
      if (previous) this.#registrations.set(target.key, previous);
      else this.#registrations.delete(target.key);

      if (previousInstance !== UNRESOLVED) this.#instances.set(target.key, previousInstance);
      else this.#instances.delete(target.key);
    };
  }

  has(target: Token<unknown>): boolean {
    return this.#registrations.has(target.key) || (this.#parent?.has(target) ?? false);
  }

  /**
   * Resolve a service.
   *
   * Throws `CONFIGURATION_ERROR` for a missing provider or a dependency cycle. Both are
   * programmer errors that must fail loudly at boot rather than produce `undefined` that
   * surfaces as a null-pointer three layers away.
   */
  resolve<T>(target: Token<T>): T {
    const registration = this.#registrations.get(target.key) as Registration<T> | undefined;

    if (!registration) {
      if (this.#parent) return this.#parent.resolve(target);
      throw configurationError(
        `No provider registered for "${target.description}". Register it in the composition root before use.`,
      );
    }

    // Note there is no "delegate singletons upward" branch: `createScope` copies only
    // `scoped` registrations, so a parent singleton is never present on a child and always
    // resolves through the parent above — one instance, shared. A token deliberately
    // re-registered on a child is an override, and the child's binding wins.
    if (registration.lifetime !== 'transient' && this.#instances.has(target.key)) {
      return this.#instances.get(target.key) as T;
    }

    if (this.#resolving.has(target.key)) {
      throw configurationError(
        `Dependency cycle detected while resolving "${target.description}" in container "${this.#name}".`,
      );
    }

    this.#resolving.add(target.key);
    try {
      const instance = registration.factory(this);
      if (registration.lifetime !== 'transient') this.#instances.set(target.key, instance);
      return instance;
    } finally {
      this.#resolving.delete(target.key);
    }
  }

  /** Resolve if bound, otherwise `undefined`. For genuinely optional collaborators. */
  resolveOptional<T>(target: Token<T>): T | undefined {
    return this.has(target) ? this.resolve(target) : undefined;
  }

  /**
   * A child container.
   *
   * `scoped` registrations get a fresh instance per scope; `singleton` ones are shared with
   * the parent. This is what makes a per-request container cheap — the scope holds only the
   * request-lifetime services, not a copy of the world.
   */
  createScope(name: string): Container {
    const scope = new Container(name, this);
    for (const [key, registration] of this.#registrations) {
      if (registration.lifetime === 'scoped') scope.#registrations.set(key, registration);
    }
    return scope;
  }

  /** Every token bound directly on this container. For diagnostics and the boot log. */
  registrations(): string[] {
    return [...this.#registrations.keys()].map((key) => key.description ?? '(anonymous)');
  }

  /** Drop cached instances. Registrations survive. */
  reset(): void {
    this.#instances.clear();
  }
}
