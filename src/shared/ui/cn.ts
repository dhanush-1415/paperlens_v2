/**
 * Class name composition.
 *
 * `clsx` resolves conditionals; `tailwind-merge` resolves Tailwind conflicts by specificity
 * of *intent* rather than source order. Without the second step, `cn('p-2', 'p-4')` emits
 * both and the winner depends on the order Tailwind happened to generate them in — which is
 * why a component's `className` prop appears not to work about a third of the time.
 *
 * Every component in the design system composes classes through this and nothing else.
 *
 * ### Why it lives in `shared/ui` and not `shared/utils`
 *
 * Because it is not general-purpose. It encodes this product's Tailwind theme — see the
 * configuration below — so it belongs with the tokens it depends on. `shared/utils` is
 * lint-restricted to pure functions with no knowledge of the framework or the design system,
 * and moving `cn` there would either break that rule or force the token list to be
 * duplicated. The rule was right; the file was in the wrong folder.
 *
 * ### Why the merger has to be configured
 *
 * `tailwind-merge` does not read the stylesheet. It ships a model of Tailwind's *default*
 * theme and classifies anything outside it as an unknown class, which it then passes through
 * untouched. That is a silent failure, not a loud one:
 *
 * cn('text-text-secondary', 'text-text-primary')
 * // unconfigured → "text-text-secondary text-text-primary" ← both emitted
 *
 * Both classes survive and the winner is decided by CSS source order, so a component's
 * `className` override works or doesn't depending on which utility Tailwind happened to
 * generate first. Since this design system replaces almost the entire default palette with
 * semantic tokens, that would apply to nearly every colour in the product.
 *
 * So the theme scales below are registered. The colours are derived from
 * `shared/ui/tokens/contract.ts` rather than restated — that file is the token name registry
 * and it imports nothing, so reading it here costs no coupling and removes a list that would
 * otherwise have to be kept in step by hand.
 */

import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

import { THEME_TOKENS } from './tokens/contract';

/**
 * The token names that become `--color-*` entries in `globals.css`.
 *
 * `brand-gradient` is excluded: it is an image, not a colour, and is applied through the
 * `.bg-gradient-brand` utility rather than through `bg-*`.
 */
const COLOR_TOKENS: readonly string[] = [
  ...THEME_TOKENS.surface,
  ...THEME_TOKENS.border,
  ...THEME_TOKENS.text,
  ...THEME_TOKENS.brand.filter((token) => token !== 'brand-gradient'),
  ...THEME_TOKENS.risk,
  'focus-ring',
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: COLOR_TOKENS,
      /**
       * The remaining scales live in the static `@theme` block of `globals.css` rather than
       * in `tokens.css`, because Tailwind needs their literal values at build time. They are
       * few enough to restate; `tokens.test.ts` asserts this list against the stylesheet so
       * a new radius cannot be added in one place and forgotten in the other.
       */
      radius: ['selection', 'control', 'card', 'panel', 'modal'],
      text: ['2xs'],
      font: ['display'],
      tracking: ['display'],
      leading: ['display', 'editorial'],
      ease: ['brand'],
      container: ['content', 'shell', 'measure'],
      shadow: ['card'],
      'inset-shadow': ['highlight'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };
