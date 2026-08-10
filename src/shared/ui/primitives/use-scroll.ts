'use client';

/**
 * Reading the window's scroll position, as an external store.
 *
 * ### Why `useSyncExternalStore` and not `useState` + `useEffect`
 *
 * Scroll position is state React does not own — it lives in the browser and changes without
 * asking. The obvious implementation (an effect that subscribes and calls `setState`, plus a
 * synchronous `setState` on mount to catch a page restored mid-scroll) has two real problems
 * beyond the lint rule that flags it: the initial value is wrong for one paint, and during
 * hydration React can tear — some components rendering with the pre-effect value and some
 * with the post-effect one, in the same commit.
 *
 * `useSyncExternalStore` is the API built for exactly this. It reads the true value during
 * render on the client, uses the server snapshot during SSR and hydration, and guarantees
 * every consumer in a commit sees the same value.
 *
 * ### Why the subscriber is shared and module-scoped
 *
 * Every consumer would otherwise attach its own `scroll` listener. The header, the sticky CTA
 * and a future reading-progress bar are three listeners firing on every frame of every
 * scroll, doing the same work. One listener fans out to the subscribers instead.
 */

import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function notify(): void {
 for (const listener of listeners) listener();
}

/**
 * `resize` as well as `scroll`.
 *
 * `scrollHeight` changes when the viewport does — rotating a phone, opening the keyboard, or
 * an image finally loading and reflowing the page. Without it, `useScrolledPast` reports a
 * fraction computed against a height that no longer exists, and the sticky CTA either never
 * appears or appears immediately.
 */
function subscribe(listener: () => void): () => void {
 if (listeners.size === 0) {
 window.addEventListener('scroll', notify, { passive: true });
 window.addEventListener('resize', notify, { passive: true });
 }

 listeners.add(listener);

 return () => {
 listeners.delete(listener);
 if (listeners.size === 0) {
 window.removeEventListener('scroll', notify);
 window.removeEventListener('resize', notify);
 }
 };
}

/**
 * True once the page has scrolled more than `offset` pixels from the top.
 *
 * For the header's hairline. `8` rather than `0` so that the elastic overscroll on iOS, and
 * the single-pixel jitter of a trackpad resting on a page, do not flicker the border.
 */
export function useScrolledDown(offset = 8): boolean {
 const getSnapshot = useCallback(() => window.scrollY > offset, [offset]);
 return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * True once the reader has passed `fraction` of the scrollable distance.
 *
 * A page that fits in the viewport has nothing to scroll, so it returns `false` forever
 * rather than `true` immediately — dividing by a zero scrollable height would otherwise make
 * every short page instantly "fully read", which is the opposite of the intent.
 */
export function useScrolledPast(fraction: number): boolean {
 const getSnapshot = useCallback(() => {
 const scrollable = document.documentElement.scrollHeight - window.innerHeight;
 if (scrollable <= 0) return false;
 return window.scrollY / scrollable >= fraction;
 }, [fraction]);

 return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
