'use client';

/**
 * The container, reachable from a Client Component (requirement 8).
 *
 * Server code resolves services from the container it holds a reference to — `src/server/
 * bootstrap.ts` exports one and every Server Component, Server Action and Route Handler
 * imports it. Client code cannot do that: a module-level singleton in the browser bundle
 * would be shared by every tab-scoped concern but *also* evaluated during SSR, where a
 * single module instance is shared by every concurrent request. One user's analytics
 * identity would follow another user's render.
 *
 * So on the client the container travels through React context, which is per-tree and
 * therefore per-request during SSR. `app/providers.tsx` builds it and mounts the provider;
 * everything below reads it.
 *
 * ### Why this file is separate from `./container`
 *
 * `'use client'` is a property of the module that declares it. Putting the provider in
 * `container.ts` would make the container class itself a client module, and every Server
 * Component that resolves a service would pull a React context into its graph. The split
 * keeps `Container` runtime-agnostic — it works in Node, in the browser, and in a test with
 * no DOM.
 *
 * This module is deliberately **not** re-exported from `./index` for the same reason.
 */

import { createContext, useContext, type ReactNode } from 'react';

import { configurationError } from '../errors';

import type { Container } from './container';
import type { Token } from './token';

const ContainerContext = createContext<Container | null>(null);

export interface ContainerProviderProps {
 /**
 * The browser composition root's container. Built once per page load in
 * `app/providers.tsx`, never constructed inline here — a provider that built its own
 * container would be a second composition root, and the two would drift.
 */
 container: Container;
 children: ReactNode;
}

/**
 * Publishes a container to the tree below it.
 *
 * Mounted once, as the outermost provider in `app/providers.tsx`, because every other
 * client provider (network, theme, toast) resolves its dependencies from it.
 */
export function ContainerProvider({ container, children }: ContainerProviderProps) {
 return <ContainerContext value={container}>{children}</ContainerContext>;
}

/**
 * The container for this tree.
 *
 * Throws outside a provider rather than returning `null`. A missing container means the
 * composition root was not mounted, which is a wiring bug that should fail loudly in
 * development rather than degrade into a component that silently does not log, does not
 * track, and does not honour feature flags.
 */
export function useContainer(): Container {
 const container = useContext(ContainerContext);

 if (!container) {
 throw configurationError(
 'useContainer: no <ContainerProvider> in the tree. Mount <Providers> in the root layout.',
 );
 }

 return container;
}

/**
 * The container, or `null` if there isn't one.
 *
 * Exists for exactly one class of caller: error boundaries. `app/error.tsx` renders *inside*
 * the root layout and therefore inside the provider — but if the thing that failed was the
 * composition root itself, the throwing variant would fault the boundary that was supposed
 * to contain the fault, and the user would get `global-error.tsx` instead of a recoverable
 * page. Anywhere else, use {@link useContainer}.
 */
export function useOptionalContainer(): Container | null {
 return useContext(ContainerContext);
}

/**
 * Resolve a service by token.
 *
 * ```ts
 * const logger = useService(LOGGER);
 * ```
 *
 * Resolution is a map lookup for singletons, so calling this on every render is free and
 * needs no `useMemo`. Transient registrations are the exception — a component that resolves
 * a transient per render gets a new instance per render, which is the documented behaviour
 * of that lifetime, not a bug in this hook.
 */
export function useService<T>(token: Token<T>): T {
 return useContainer().resolve(token);
}

/**
 * Resolve a service, or `null` when it isn't registered in this environment.
 *
 * The browser container binds a deliberate subset of the tokens: there is no `SESSION_STORE`
 * on the client because sessions live in `httpOnly` cookies the browser cannot read, and no
 * `RATE_LIMITER` because a limit a client can skip is decoration. A shared component that
 * runs on both sides uses this to degrade instead of throwing.
 */
export function useOptionalService<T>(token: Token<T>): T | null {
 return useContainer().resolveOptional(token) ?? null;
}
