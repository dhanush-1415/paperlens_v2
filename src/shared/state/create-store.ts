/**
 * Client state (requirement 10).
 *
 * ### What belongs here, and it is less than you think
 *
 * In an App Router codebase most of what a client store traditionally held has a better
 * owner already:
 *
 * · **Server data** belongs to the DAL and `use cache`. Mirroring it into a store creates
 * a second copy that goes stale and a cache-invalidation problem the framework already
 * solved.
 * · **URL state** — filters, tabs, pagination, the open document — belongs in
 * `searchParams`. A store cannot be linked to, bookmarked, or restored by the back button.
 * · **Form state and mutations** belong to Server Actions and `useActionState`.
 * · **Component-local state** belongs to `useState`.
 *
 * What is left is genuinely global client UI state: toasts, the command palette, sidebar
 * collapse, an in-progress multi-step wizard. That residue is small, and every store in this
 * codebase should be justifiable against the list above.
 *
 * ### Why Zustand
 *
 * It needs no provider, which matters more here than anywhere else: a Context provider is a
 * Client Component, and putting one at the root turns the entire tree below it into a client
 * boundary. Zustand's store lives in a module, so a leaf component three levels into an RSC
 * tree can subscribe without any ancestor becoming client. Redux Toolkit and Jotai both
 * require the provider; React Context additionally re-renders every consumer on every change
 * because it has no selector. See docs/adr/0006-state-management.md.
 *
 * ### Why a factory instead of calling `create` directly
 *
 * So that devtools naming, persistence, and the storage driver are decided once. A store
 * created by hand somewhere in `features/` would quietly skip all three, and the first sign
 * would be a production bundle shipping the devtools middleware.
 */

import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, devtools, persist, type StateStorage } from 'zustand/middleware';

import { isDevelopment } from '@/config/runtime';
import { createNoopStorageDriver, type StorageDriver } from '@/core/storage';

export interface PersistConfig<TState> {
 /** Storage key. Must come from `STORAGE_KEYS` — never a literal. */
 key: string;
 /**
 * Bump when the persisted shape changes. Zustand discards mismatched versions rather
 * than rehydrating last release's shape into this release's reducers.
 */
 version: number;
 /**
 * Which slice of the store is persisted.
 *
 * Required, not optional, because the safe default does not exist: persisting everything
 * writes derived values, loading flags and in-flight state to disk, and a user who
 * refreshes mid-request comes back to a store that thinks it is still loading forever.
 */
 partialize: (state: TState) => Partial<TState>;
 /**
 * Where it is persisted. Injected so tests get memory and SSR gets a no-op.
 * `app/providers.tsx` supplies the container's `LOCAL_STORAGE_DRIVER`.
 */
 driver?: StorageDriver;
}

export interface CreateStoreOptions<TState> {
 /** Shown in Redux DevTools and in error messages. `'toast'`, `'command-palette'`. */
 name: string;
 persist?: PersistConfig<TState>;
}

/**
 * Bridges our `StorageDriver` port to the `StateStorage` shape Zustand expects.
 *
 * The point of routing through the port rather than handing Zustand `localStorage` directly
 * is that the driver is already SSR-safe, already degrades to memory when storage throws
 * (Safari private mode), and is already the thing tests swap. Passing the raw global would
 * reintroduce all three problems in exactly one place — which is how they always come back.
 */
function toStateStorage(driver: StorageDriver): StateStorage {
 return {
 getItem: (name) => driver.getItem(name),
 setItem: (name, value) => {
 driver.setItem(name, value);
 },
 removeItem: (name) => {
 driver.removeItem(name);
 },
 };
}

/**
 * Creates a store.
 *
 * ```ts
 * export const useSidebarStore = createStore<SidebarState>(
 * (set) => ({ isCollapsed: false, toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })) }),
 * { name: 'sidebar', persist: { key: STORAGE_KEYS.sidebarCollapsed, version: 1,
 * partialize: (s) => ({ isCollapsed: s.isCollapsed }) } },
 * );
 * ```
 *
 * Always subscribe with a selector — `useSidebarStore((s) => s.isCollapsed)` — never
 * `useSidebarStore()`. The bare call subscribes to the whole store and re-renders the
 * component on every unrelated change, which throws away the main reason to use Zustand.
 */
export function createStore<TState>(
 initializer: StateCreator<TState, [], []>,
 options: CreateStoreOptions<TState>,
): UseBoundStore<StoreApi<TState>> {
 const { name, persist: persistConfig } = options;

 /**
 * `devtools` is applied only in development.
 *
 * It is not merely inert in production — it serializes every action payload to look for
 * the extension. On a store that updates on scroll that is measurable, and it is pure
 * cost for a tool nobody can open.
 */
 const withDevtools = (creator: StateCreator<TState, [], []>): StateCreator<TState, [], []> =>
 isDevelopment
 ? (devtools(creator, { name, enabled: true }) as StateCreator<TState, [], []>)
 : creator;

 if (!persistConfig) {
 return create<TState>()(withDevtools(initializer));
 }

 const { key, version, partialize, driver } = persistConfig;

 return create<TState>()(
 withDevtools(
 persist(initializer, {
 name: key,
 version,
 partialize: partialize as (state: TState) => TState,
 // `createNoopStorageDriver` rather than a browser default: this module is imported
 // during SSR, and a driver that reaches for `localStorage` at module scope would
 // throw before the request is even routed.
 storage: createJSONStorage(() => toStateStorage(driver ?? createNoopStorageDriver())),
 }) as unknown as StateCreator<TState, [], []>,
 ),
 );
}
