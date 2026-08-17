'use client';

/**
 * Theme ownership (requirement 1).
 *
 * One provider owns the theme for the whole application. It does not *decide* the theme on
 * first load — `script.ts` already did that before paint — it **adopts** that decision,
 * keeps it in sync with the OS while the preference is `'system'`, and is the only thing in
 * the codebase permitted to write `data-theme`.
 *
 * ### Why not `next-themes`
 *
 * It is a good library solving exactly this. But theme is a first-class concern of this
 * design system: it has to compose with the tenant token overlay, resolve through the DI
 * container's storage driver so tests can swap it, and share the `pl:` storage namespace and
 * envelope format with everything else the app persists. Wrapping a dependency to get those
 * three things costs more code than owning ~120 lines, and leaves a second owner for the
 * question "what theme is this". See docs/adr/0011-theme-ownership.md.
 *
 * ### Why `useSyncExternalStore` and not `useState` + a mount effect
 *
 * The obvious shape — start at the default, adopt storage in a `useEffect` — has two
 * problems. It renders a value the component already knows is wrong and then corrects it,
 * which React 19's `react-hooks/set-state-in-effect` rule flags as a cascading render. And it
 * describes the situation inaccurately: `localStorage` and `matchMedia` are *external
 * stores*, and React has a hook whose entire purpose is subscribing to one without breaking
 * hydration. `getServerSnapshot` supplies the default for the server and the hydration pass;
 * `getSnapshot` supplies the truth immediately afterwards. No effect, no cascade, and
 * cross-tab changes come along for free.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  createStorageEntry,
  defaultStorageDriver,
  type StorageDriver,
  type StorageEntry,
} from '@/core/storage';
import { COOKIE_NAMES, STORAGE_KEYS } from '@/shared/constants/storage-keys';
import { LIFETIME_SECONDS } from '@/shared/constants/time';

import { SYSTEM_LIGHT_QUERY, THEME_STORAGE_VERSION } from './script';
import {
  DEFAULT_THEME_PREFERENCE,
  isThemePreference,
  type ResolvedTheme,
  type ThemeController,
  type ThemePreference,
} from './types';

const ThemeContext = createContext<ThemeController | null>(null);

/** No-op subscribe, for a store whose value changes exactly once: at hydration. */
const neverChanges = () => () => {};

/* ── The OS preference, as an external store ──────────────────────────────────────────── */

/**
 * One `MediaQueryList` for the process, created on first use.
 *
 * `getSnapshot` runs on every render, so calling `matchMedia()` inside it would allocate a
 * new list object per render and leave the old ones for the GC. Lazily module-scoped rather
 * than created at import time because this module is evaluated during SSR, where `window`
 * does not exist.
 */
let systemQuery: MediaQueryList | null = null;

function getSystemQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  systemQuery ??= window.matchMedia(SYSTEM_LIGHT_QUERY);
  return systemQuery;
}

const systemThemeStore = {
  subscribe(onChange: () => void): () => void {
    const query = getSystemQuery();
    if (!query) return () => {};
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  },
  /**
   * Returns a primitive, so React's `Object.is` check is a value comparison and no caching
   * is required to keep the snapshot stable across renders.
   */
  getSnapshot(): ResolvedTheme {
    return getSystemQuery()?.matches ? 'light' : 'dark';
  },
  /**
   * The server cannot know the OS preference. It returns the base theme, which is the same
   * thing `tokens.css` renders when no `data-theme` is set — so the server's HTML and its
   * stylesheet agree even though neither knows the answer yet.
   */
  getServerSnapshot(): ResolvedTheme {
    return 'dark';
  },
};

/* ── The stored preference, as an external store ──────────────────────────────────────── */

interface PreferenceStore {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => ThemePreference;
  getServerSnapshot: () => ThemePreference;
  set: (next: ThemePreference) => void;
}

/**
 * Wraps a `StorageEntry` in the subscribe/snapshot shape `useSyncExternalStore` wants.
 *
 * The read is memoised because `getSnapshot` runs on every render and `entry.get()` is a
 * synchronous `localStorage` read plus a JSON parse plus validation. The cache is dropped
 * whenever the value could have changed underneath it — which is on our own writes, and on
 * a `storage` event from another tab.
 */
function createPreferenceStore(entry: StorageEntry<ThemePreference>): PreferenceStore {
  const listeners = new Set<() => void>();
  let cached: ThemePreference | null = null;

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    subscribe(onChange) {
      listeners.add(onChange);

      /**
       * Cross-tab sync, for free.
       *
       * The `storage` event fires in every *other* tab of the origin. Without this, changing
       * the theme in one tab leaves the rest on the old one until they reload — a small thing
       * that is very visible to anyone who works with two windows open.
       */
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== STORAGE_KEYS.theme) return;
        cached = null;
        notify();
      };
      window.addEventListener('storage', onStorage);

      return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onStorage);
      };
    },

    getSnapshot() {
      cached ??= entry.get();
      return cached;
    },

    getServerSnapshot() {
      return DEFAULT_THEME_PREFERENCE;
    },

    set(next) {
      cached = next;
      entry.set(next);
      notify();
    },
  };
}

/* ── Cookie mirror ────────────────────────────────────────────────────────────────────── */

/**
 * Mirrors the resolved theme into a cookie.
 *
 * A *hint*, in the same sense as `pl_session`: `localStorage` stays authoritative on the
 * client, and this exists so a server-rendered surface that is already dynamic can read the
 * theme without a flash. It is never trusted for anything but a colour.
 *
 * `SameSite=Lax` so it survives a normal top-level navigation from an external link, which
 * is exactly the visit where a flash would be most visible. Not `Secure`, because a
 * localhost dev server is plain HTTP and a cookie that only sets in production is a
 * behaviour that only breaks in production.
 */
function writeThemeCookie(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAMES.theme}=${resolved}; path=/; max-age=${LIFETIME_SECONDS.themePreference}; samesite=lax`;
}

/* ── Provider ─────────────────────────────────────────────────────────────────────────── */

export interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Where the preference is persisted.
   *
   * Injected rather than imported so a test can pass `createMemoryStorageDriver()` and a
   * server render can pass a no-op. `app/providers.tsx` resolves the real one from the DI
   * container's `LOCAL_STORAGE_DRIVER` token.
   */
  driver?: StorageDriver;
}

export function ThemeProvider({ children, driver }: ThemeProviderProps) {
  const store = useMemo(
    () =>
      createPreferenceStore(
        createStorageEntry<ThemePreference>(
          {
            key: STORAGE_KEYS.theme,
            version: THEME_STORAGE_VERSION,
            fallback: DEFAULT_THEME_PREFERENCE,
            // Storage is user-writable. `'dracula'` in this key must resolve to the fallback,
            // not become a `data-theme` value with no matching CSS.
            validate: isThemePreference,
          },
          { driver: driver ?? defaultStorageDriver() },
        ),
      ),
    [driver],
  );

  const preference = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const systemTheme = useSyncExternalStore(
    systemThemeStore.subscribe,
    systemThemeStore.getSnapshot,
    systemThemeStore.getServerSnapshot,
  );

  /**
   * `false` for the server render and the hydration pass, `true` from the first client-only
   * render onwards — the same mechanism as the two stores above, which is what guarantees
   * all three flip in the same commit rather than one render apart.
   *
   * Consumers use it to hold back anything whose appearance depends on the real theme: see
   * `ThemeToggle`, which stays disabled and iconless until it is true.
   */
  const isHydrated = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );

  const resolved: ResolvedTheme = preference === 'system' ? systemTheme : preference;

  /**
   * Reflect to the DOM.
   *
   * Gated on `isHydrated` so this never fights the bootstrap script during the hydration
   * commit, when `resolved` is still the server's placeholder. Writing `data-theme` on
   * `<html>` — rather than a class, or a context value components read — is what makes the
   * theme reachable from CSS that React does not render: the scrollbar, `::selection`,
   * native form controls, and any portal outside the React tree.
   */
  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.dataset.theme = resolved;
    writeThemeCookie(resolved);
  }, [resolved, isHydrated]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      store.set(next);
    },
    [store],
  );

  const toggle = useCallback(() => {
    setPreference(preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light');
  }, [preference, setPreference]);

  const value = useMemo<ThemeController>(
    () => ({ preference, resolved, isHydrated, setPreference, toggle }),
    [preference, resolved, isHydrated, setPreference, toggle],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/**
 * Reads the theme.
 *
 * Throws when used outside the provider rather than returning a default. A silent fallback
 * would make a missing provider look like a working light theme, and the bug would surface
 * as "the toggle does nothing on this one page" weeks later.
 */
export function useTheme(): ThemeController {
  const controller = useContext(ThemeContext);
  if (controller === null) {
    throw new Error('useTheme must be used within <ThemeProvider>.');
  }
  return controller;
}
