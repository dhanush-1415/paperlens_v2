/**
 * Toasts.
 *
 * Two things leave this folder: the imperative `toast` API that everything calls, and the
 * `Toaster` viewport that `app/providers.tsx` mounts once. `useToastStore` is exported for
 * tests — a component reaching for it directly is a component that should be calling `toast`.
 */

export { toast, useToastStore } from './store';
export type { Toast, ToastAction, ToastInput } from './store';
export { Toaster, toastViewportVariants } from './toaster';
export type { ToasterProps } from './toaster';
