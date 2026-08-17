import type { Metadata } from 'next';
import Link from 'next/link';

import { allBlogList } from '@/data/blog';
import { appConfig } from '@/config';

export const metadata: Metadata = {
  title: 'Insights & Resources',
  description:
    'Expert advice on AI document analysis, legal tech, and academic research methodologies.',
  alternates: { canonical: `${appConfig.url}/blog` },
};

export default function BlogIndexPage() {
  return (
    <main className="w-full flex-1 bg-canvas py-24 text-text-primary">
      <section className="mx-auto mb-16 max-w-5xl px-6 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-brand-primary md:text-6xl">
          PaperLens Insights
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-text-secondary">
          Deep dives, technical tutorials, and strategic advice on scaling your document analysis
          workflows with AI.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {allBlogList.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-surface-elevated flex h-full flex-col rounded-2xl border border-border-subtle p-8 transition-all hover:border-brand-primary/50"
            >
              <div className="mb-4 text-sm text-text-secondary">{post.publishedAt}</div>
              <h2 className="mb-4 text-2xl font-bold text-brand-primary">{post.title}</h2>
              <p className="mb-8 line-clamp-3 text-text-secondary">{post.description}</p>
              <div className="mt-auto flex items-center gap-2 font-medium text-brand-primary">
                Read Article &rarr;
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
