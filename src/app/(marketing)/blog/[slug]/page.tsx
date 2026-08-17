import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { allBlogList, BLOG_REGISTRY } from '@/data/blog';
import { appConfig } from '@/config';

export async function generateStaticParams() {
  return allBlogList.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_REGISTRY[slug];

  if (!post) {
    return {};
  }

  return {
    title: { absolute: `${post.title} - PaperLens Insights` },
    description: post.description,
    alternates: { canonical: `${appConfig.url}/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${appConfig.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const post = BLOG_REGISTRY[slug];

  if (!post) {
    notFound();
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: post.publishedAt,
  };

  return (
    <main className="w-full flex-1 bg-canvas py-24 text-text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="mx-auto max-w-3xl px-6">
        <header className="mb-12">
          <p className="mb-4 text-text-secondary">
            {post.publishedAt} · By {post.author}
          </p>
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-brand-primary md:text-5xl">
            {post.title}
          </h1>
        </header>

        <div
          className="prose prose-lg dark:prose-invert prose-headings:text-text-primary prose-a:text-brand-primary max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <section className="mt-24 border-t border-border-subtle pt-12">
          <h2 className="mb-8 text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {post.faqs.map((faq, idx) => (
              <div key={idx}>
                <h3 className="mb-2 text-lg font-medium">{faq.question}</h3>
                <p className="text-text-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
