'use client';

/**
 * Sidebar store — persistent collapse state.
 *
 * Follows the `createStore` pattern established by the design system. The collapsed state
 * is persisted to `localStorage` via `STORAGE_KEYS.sidebarCollapsed` so the sidebar
 * remembers its position across sessions and page reloads.
 *
 * ### Why this is client state
 *
 * Sidebar collapse is purely a UI preference: it does not affect what data is fetched, what
 * is authorized, or what renders on the server. It belongs to `localStorage`, not to a
 * cookie or the URL. See `shared/state/create-store.ts` for the full justification.
 */

import { createStore } from '@/shared/state/create-store';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

export interface SidebarState {
  /** Whether the sidebar is currently collapsed (icon-only) mode. */
  isCollapsed: boolean;
  /** The user's explicit preference for collapse state, preserved across route overrides. */
  userCollapsedPreference: boolean;
  /** Whether the mobile drawer is open. */
  isMobileOpen: boolean;
  /** Toggle between expanded and collapsed sidebar. Updates user preference. */
  toggle: () => void;
  /** Explicitly set the collapsed state. Set isRouteOverride=true if this is an automatic route change. */
  setCollapsed: (collapsed: boolean, isRouteOverride?: boolean) => void;
  /** Open the mobile navigation drawer. */
  openMobile: () => void;
  /** Close the mobile navigation drawer. */
  closeMobile: () => void;
}

export const useSidebarStore = createStore<SidebarState>(
  (set) => ({
    isCollapsed: false,
    userCollapsedPreference: false,
    isMobileOpen: false,
    toggle: () =>
      set((s) => {
        const newState = !s.isCollapsed;
        return { isCollapsed: newState, userCollapsedPreference: newState };
      }),
    setCollapsed: (collapsed, isRouteOverride = false) =>
      set((s) => ({
        isCollapsed: collapsed,
        userCollapsedPreference: isRouteOverride ? s.userCollapsedPreference : collapsed,
      })),
    openMobile: () => set({ isMobileOpen: true }),
    closeMobile: () => set({ isMobileOpen: false }),
  }),
  {
    name: 'sidebar',
    persist: {
      key: STORAGE_KEYS.sidebarCollapsed,
      version: 2,
      partialize: (s) => ({
        userCollapsedPreference: s.userCollapsedPreference,
        // We still save isCollapsed to prevent hydration mismatch before effect runs
        isCollapsed: s.userCollapsedPreference,
      }),
    },
  },
);
