/**
 * The four block kinds, rendered.
 *
 * Separated from `LegalDocumentView` because this is the part that grows: a fifth block kind
 * lands here and nowhere else, and the page-level layout stays a page-level layout.
 *
 * The `switch` is exhaustive over the union with no `default`. That is deliberate —
 * `noFallthroughCasesInSwitch` plus a union return type means adding a kind to `LegalBlock`
 * without handling it here is a compile error, which is a much better reviewer than a
 * `default` branch rendering nothing.
 */

import type { LegalBlock } from '../domain/legal';
import { Text } from '@/shared/ui';

import { RichText } from './rich-text';

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <Text as="p" size="sm" tone="secondary" editorial>
          <RichText text={block.text} />
        </Text>
      );

    case 'list':
      return (
        <ul className="flex flex-col gap-2">
          {block.items.map((item) => (
            <li key={item.text} className="flex gap-3">
              {/*
 A bullet drawn as an element rather than a `list-disc` marker, so its colour
 and optical alignment are ours. A default marker inherits the text colour and
 sits a shade too heavy next to `text-text-secondary` body copy.
 */}
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-border-strong" />
              <Text as="span" size="sm" tone="secondary" editorial>
                {item.term ? (
                  <>
                    <strong className="font-semibold text-text-primary">{item.term}</strong>{' '}
                  </>
                ) : null}
                <RichText text={item.text} />
              </Text>
            </li>
          ))}
        </ul>
      );

    case 'callout':
      return (
        /**
         * `<aside>` with a visible left rule.
         *
         * Not an `Alert`: `Alert` carries a tone and an icon and announces itself, which is
         * correct for something that just happened to the user and wrong for a clause that has
         * always been there. This is emphasis in a document, not a notification.
         */
        <aside className="rounded-r-panel border-l-2 border-brand-primary bg-surface-1 py-4 pr-5 pl-5">
          <Text as="p" size="sm" tone="primary" editorial>
            <RichText text={block.text} />
          </Text>
        </aside>
      );
  }
}

export interface LegalBlocksProps {
  blocks: readonly LegalBlock[];
}

export function LegalBlocks({ blocks }: LegalBlocksProps) {
  if (blocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}
