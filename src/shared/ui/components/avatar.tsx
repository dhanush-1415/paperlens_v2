/**
 * Avatar.
 *
 * Initials are the default and the image is the enhancement, not the other way round. A
 * component built image-first has to handle "no image", "image still loading" and "image
 * 404s" as three separate states, and the third one only ever shows up in production. Here
 * the initials are always rendered and the image, when present, covers them — so a broken
 * URL degrades to the fallback with no error handling and no client JavaScript.
 *
 * Uses a plain `<img>` rather than `next/image`. Avatars are small, already-optimised, often
 * cross-origin, and appear in lists of dozens; routing each through the image optimiser costs
 * a server round-trip per face to save a few hundred bytes.
 */

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/ui/cn';
import { initials } from '@/shared/utils/string';

const avatarVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    'border border-border-subtle bg-surface-2',
    'font-medium text-text-secondary select-none',
  ],
  {
    variants: {
      size: {
        sm: 'size-6 text-2xs',
        md: 'size-8 text-2xs',
        lg: 'size-11 text-sm',
        xl: 'size-16 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /**
   * The person's name. Required — it is the source of both the initials and the accessible
   * name, so there is no way to render an avatar that a screen reader cannot identify.
   */
  name: string;
  src?: string;
  className?: string;
}

export function Avatar({ name, src, size, className }: AvatarProps) {
  return (
    <span
      // The whole thing is one labelled image to assistive technology; the initials
      // underneath are presentation and must not be read as loose text.
      role="img"
      aria-label={name}
      className={cn(avatarVariants({ size }), className)}
    >
      {/* `initials` from shared/utils — the same function the rest of the product uses, so an
 avatar and a mention chip for the same person never disagree. */}
      <span aria-hidden>{initials(name) || '?'}</span>
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element -- see the file header: avatars are small, cross-origin and rendered in bulk, so the optimiser costs a round-trip per face to save a few hundred bytes. */
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </span>
  );
}

export { avatarVariants };
