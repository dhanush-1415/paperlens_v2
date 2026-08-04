/**
 * Primitives — the parts components are built from, not parts pages use.
 *
 * A primitive has no appearance. `Slot` merges props onto a child, `useNativeDialog` drives a
 * `<dialog>`, `polymorphic` names the element sets a component may render as. Nothing here
 * renders a border or reads a token.
 *
 * They are exported because `features/` will eventually build a component this system does
 * not have, and it must build it the same way `Button` and `Dialog` were built rather than
 * reaching for a second focus-trap implementation. A page importing `Slot` directly, though,
 * is almost always a page that wanted `asChild` on a component that already has it.
 */

export { Slot, Slottable, type SlotProps } from './slot';

export {
  LAYOUT_ELEMENTS,
  TEXT_ELEMENTS,
  type LayoutElement,
  type TextElement,
} from './polymorphic';

export {
  useNativeDialog,
  type NativeDialogHandles,
  type UseNativeDialogOptions,
} from './use-native-dialog';
