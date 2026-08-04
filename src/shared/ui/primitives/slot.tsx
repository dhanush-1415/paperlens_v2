/**
 * `asChild` — render as someone else's element.
 *
 * The problem it solves: a `<Button>` that navigates must be an `<a>`, not a `<button>`.
 * Wrapping (`<Button><Link/></Button>`) nests an anchor inside a button, which is invalid
 * HTML and gives keyboard users two tab stops for one control. Duplicating (`<ButtonLink>`)
 * means every variant, size and state exists twice and drifts.
 *
 * `Slot` merges the styled component's props into whatever single child it is given, so
 * `<Button asChild><Link href="/pricing">Pricing</Link></Button>` renders one `<a>` carrying
 * the button's classes, the link's `href`, and both of their event handlers.
 *
 * This is Radix's `Slot` pattern, implemented directly rather than pulled in: it is about
 * forty lines, and the alternative is a dependency on a library whose other 99% is unused.
 *
 * React 19 makes it simpler than it used to be — `ref` is an ordinary prop on function
 * components, so there is no `forwardRef` dance and no `composeRefs` helper.
 */

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { cn } from '@/shared/ui/cn';

type AnyProps = Record<string, unknown>;

export interface SlotProps {
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * Merge order is deliberate and asymmetric:
 *
 *   · **Event handlers** — both run, slot first then child. The child's handler is the
 *     specific one and must be able to observe anything the slot's handler did.
 *   · **`className`** — merged through `cn`, so the child can override a Tailwind utility
 *     the slot set rather than having both emitted and losing to source order.
 *   · **`style`** — child wins per-property.
 *   · **Everything else** — child wins outright. The child is the concrete element; if it
 *     says `type="submit"`, it means it.
 */
function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };

  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];

    const isEventHandler = /^on[A-Z]/.test(key);

    if (isEventHandler) {
      if (typeof slotValue === 'function' && typeof childValue === 'function') {
        merged[key] = (...args: unknown[]) => {
          (childValue as (...a: unknown[]) => unknown)(...args);
          (slotValue as (...a: unknown[]) => unknown)(...args);
        };
      } else if (typeof slotValue === 'function') {
        merged[key] = slotValue;
      }
      continue;
    }

    if (key === 'className') {
      merged[key] = cn(slotValue as string, childValue as string);
      continue;
    }

    if (key === 'style') {
      merged[key] = { ...(slotValue as object), ...(childValue as object) };
    }
  }

  return merged;
}

/**
 * Marks which child is the one to render as.
 *
 * Needed because a styled component usually renders more than the caller's children: a
 * `Button` emits a spinner, the label and a trailing icon. Handing all three to `Slot` is
 * ambiguous — the spinner is a valid element too, so there is no way to guess which one is
 * meant to become the `<a>`. `Slottable` removes the guess:
 *
 * ```tsx
 * <Slot className="…">
 *   {startIcon}
 *   <Slottable>{children}</Slottable>   ← this is the element to render as
 *   {endIcon}
 * </Slot>
 * ```
 *
 * The decorations are then rendered *inside* the child, alongside whatever the child already
 * had. So `<Button asChild startIcon={<Icon/>}><Link>Pricing</Link></Button>` produces one
 * `<a>` containing the icon and the word "Pricing" — not an anchor with the icon orphaned
 * outside it.
 *
 * It renders a fragment, so it costs nothing in the tree and disappears entirely when the
 * component is used without `asChild`.
 */
export function Slottable({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function isSlottable(child: ReactNode): child is ReactElement<{ children?: ReactNode }> {
  return isValidElement(child) && child.type === Slottable;
}

export function Slot({ children, ...slotProps }: SlotProps) {
  const childArray = Children.toArray(children);
  const slottable = childArray.find(isSlottable);

  /**
   * The decorated case: one child is marked, the rest are decorations that must move inside
   * it. Their order relative to the marker is preserved, which is what keeps a `startIcon`
   * before the label and an `endIcon` after it.
   */
  if (slottable) {
    const target = Children.only(slottable.props.children) as ReactElement<AnyProps>;

    if (!isValidElement(target)) {
      throw new Error('`asChild` requires a single React element child.');
    }

    const inner = childArray.map((child) =>
      child === slottable ? (target.props as { children?: ReactNode }).children : child,
    );

    return cloneElement(target, mergeProps(slotProps, target.props), ...inner);
  }

  /**
   * The plain case: exactly one child, and it must be an element.
   *
   * `Children.only` throws a clear error for the two mistakes people make — passing a text
   * node, or passing a fragment with two children. Both would otherwise fail later and much
   * further from the cause, as a missing `href` or a button with no styles.
   */
  const child = Children.only(children) as ReactElement<AnyProps>;

  if (!isValidElement(child)) {
    throw new Error('`asChild` requires a single React element child.');
  }

  return cloneElement(child, mergeProps(slotProps, child.props));
}
