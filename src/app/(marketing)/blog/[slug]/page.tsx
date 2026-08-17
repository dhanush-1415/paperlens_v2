import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Clock, Calendar, User, Tag, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

import { getAllSlugs, getPostBySlug } from '@/lib/blog';
import { Button } from '@/shared/ui';
import { ROUTES } from '@/shared/constants/routes';



export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://www.paperlens.co/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630 }]
        : [{ url: '/opengraph-image' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : ['/opengraph-image'],
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  IRS: 'bg-destructive/10 text-destructive border-destructive/20',
  Legal: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Insurance: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Healthcare: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  Taxes: 'bg-destructive/10 text-destructive border-destructive/20',
  Finance: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  General: 'bg-surface-2/50 text-text-secondary border-border-strong/50',
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const categoryClasses = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.General;

  return (
    <div className="z-10 mx-auto flex w-full max-w-4xl flex-col px-4 py-16 md:px-8 md:py-24">
      {/* -- Back link ---------------------------------------------------- */}
      <Link
        href={(ROUTES as any).blog}
        className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-bold text-text-tertiary transition-all duration-300 hover:-translate-x-1 hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Articles
      </Link>

      {/* -- Hero image --------------------------------------------------- */}
      {post.coverImage && (
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-border-strong/50 shadow-2xl">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-canvas/40 to-transparent" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="relative z-0 h-64 w-full object-cover transition-transform duration-700 hover:scale-105 sm:h-80 lg:h-[28rem]"
            loading="eager"
          />
        </div>
      )}

      {/* -- Post header -------------------------------------------------- */}
      <header className="mb-12 border-b border-border-strong/50 pb-10">
        <span
          className={`mb-6 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase ${categoryClasses} shadow-sm backdrop-blur-md`}
        >
          <Tag className="h-3 w-3" aria-hidden="true" />
          {post.category}
        </span>

        <h1 className="mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-text-primary md:text-5xl lg:text-6xl">
          {post.title}
        </h1>

        <p className="mb-8 max-w-3xl text-lg leading-relaxed font-medium text-text-secondary">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-text-tertiary">
          <span className="flex items-center gap-2 text-text-primary/80">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            {post.author}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
            {post.readTime}
          </span>
        </div>
      </header>

      {/* -- Post body ---------------------------------------------------- */}
      <article className="prose prose-slate dark:prose-invert prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-text-primary prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-base prose-p:leading-relaxed prose-p:text-text-secondary/90 prose-p:mb-6 prose-a:text-brand-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-brand-primary/80 prose-a:transition-colors prose-blockquote:border-l-4 prose-blockquote:border-brand-primary prose-blockquote:bg-surface-2/50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-text-secondary prose-code:rounded-md prose-code:bg-surface-2/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:border-border-strong prose-code:font-mono prose-code:text-sm prose-code:text-text-primary/80 prose-code:before:content-none prose-code:after:content-none prose-strong:font-bold prose-strong:text-text-primary prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6 prose-li:my-2 prose-li:text-text-secondary/90 prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6 prose-hr:border-border-strong/50 prose-hr:my-12 prose-img:rounded-2xl prose-img:border prose-img:border-border-strong/50 prose-img:shadow-lg prose-img:my-10 max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>

      {/* -- Footer CTA --------------------------------------------------- */}
      <div className="relative mt-20 w-full overflow-hidden rounded-3xl border border-border-strong bg-surface-2/50 p-10 text-center shadow-2xl backdrop-blur-xl md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <h3 className="mb-3 max-w-xl text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Ready to decode your own documents?
          </h3>
          <p className="mx-auto mb-8 max-w-md text-base font-medium text-text-secondary">
            Upload any letter, bill, or notice and PaperLens explains it in plain English —
            instantly. No signup required.
          </p>
          <Link href={ROUTES.scan}>
            <Button variant="premium" size="lg" className="rounded-xl px-8 py-6">
              Upload a Document Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
