import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { ArrowRight, Clock, Tag, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

import { Button } from '@/shared/ui';
import { ROUTES } from '@/shared/constants/routes';



export const metadata: Metadata = {
  title: 'Blog — Documents Decoded. No Jargon.',
  description:
    'Jargon-free guides to IRS letters, lease agreements, insurance policies, and every other document that makes your life harder than it should be.',
};

const CATEGORY_COLORS: Record<string, string> = {
  IRS: 'bg-destructive/10 text-destructive border-destructive/20',
  General: 'bg-surface-2/50 text-text-secondary border-border-strong',
  Technology: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Leases: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Insurance: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Legal: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Healthcare: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  Taxes: 'bg-destructive/10 text-destructive border-destructive/20',
  Finance: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
};

function CategoryPill({ category }: { category: string }) {
  const classes = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.General;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${classes} shadow-sm backdrop-blur-md`}
    >
      <Tag className="h-3 w-3" aria-hidden="true" />
      {category}
    </span>
  );
}

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <div className="z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-16 md:px-8 md:py-24">
      {/* -- Header ------------------------------------------------------- */}
      <header className="mb-16 flex max-w-3xl flex-col items-center text-center">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1.5 text-xs font-bold text-brand-primary shadow-[0_0_10px_rgba(59,130,246,0.1)]">
          <BookOpen className="h-3.5 w-3.5" />
          The PaperLens Blog
        </div>
        <h1 className="mb-4 text-4xl leading-tight font-extrabold tracking-tight text-text-primary md:text-6xl">
          Decoded.
          <br /> No Jargon. Ever.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed font-medium text-text-secondary md:text-lg">
          Every confusing document on your counter — decoded into what it actually means, what you
          owe, and exactly what to do next.
        </p>
      </header>

      {/* -- Post grid ---------------------------------------------------- */}
      {posts.length === 0 ? (
        <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-3xl border border-border-strong/50 bg-surface-2/20 py-20 text-center backdrop-blur-md">
          <BookOpen className="h-10 w-10 text-text-tertiary/50" />
          <p className="font-medium text-text-secondary">No posts yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid w-full gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={(ROUTES as any).blogPost(post.slug)}
              className="group flex h-full flex-col"
            >
              <article
                className={[
                  'flex h-full flex-col overflow-hidden rounded-2xl border border-border-strong/50 bg-surface-2/50 backdrop-blur-md',
                  'transition-all duration-300 ease-in-out',
                  'hover:-translate-y-1 hover:border-border-strong hover:bg-surface-2 hover:shadow-2xl',
                ].join(' ')}
              >
                {/* Thumbnail */}
                {post.coverImage ? (
                  <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-canvas/80 to-transparent" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-brand-primary/20 via-brand-primary/5 to-transparent">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                  </div>
                )}

                {/* Body */}
                <div className="relative z-20 flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <CategoryPill category={post.category} />
                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-text-tertiary uppercase">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {post.readTime}
                    </div>
                  </div>

                  <time
                    dateTime={post.date}
                    className="mb-2 block text-xs font-semibold text-text-secondary"
                  >
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>

                  <h2 className="mb-3 text-xl leading-snug font-extrabold text-text-primary transition-colors group-hover:text-brand-primary">
                    {post.title}
                  </h2>

                  <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed font-medium text-text-secondary/80">
                    {post.excerpt}
                  </p>

                  {/* Read more */}
                  <div className="mt-auto border-t border-border-strong/50 pt-4">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary transition-all duration-300 group-hover:gap-3">
                      Read Article
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {/* -- Scan CTA ----------------------------------------------------- */}
      <div className="relative mt-32 w-full max-w-4xl overflow-hidden rounded-3xl border border-border-strong bg-surface-2/50 p-10 text-center shadow-2xl backdrop-blur-xl md:p-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <h3 className="mb-3 max-w-xl text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Now upload your actual document in seconds.
          </h3>
          <p className="mx-auto mb-8 max-w-md text-base font-medium text-text-secondary">
            Free forever for personal use. No credit card, no signup required. Just drop a file and
            let AI do the rest.
          </p>
          <Link href={ROUTES.scan}>
            <Button variant="premium" size="lg" className="rounded-xl px-8 py-6">
              Start Uploading Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
