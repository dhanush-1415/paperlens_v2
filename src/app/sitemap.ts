import { MetadataRoute } from 'next';
import { allToolsList } from '@/data/tools';
import { allPersonasList, PERSONAS_REGISTRY } from '@/data/personas';
import { allComparisonsList } from '@/data/comparisons';
import { allBlogList } from '@/data/blog';
import { allUtilitiesList } from '@/data/utilities';
import { allGlossaryTermsList } from '@/data/glossary';
import { DOCUMENT_GUIDES } from '@/features/marketing/infrastructure/guides.data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://paperlens.co';

  const staticRoutes = [
    '',
    '/about',
    '/pricing',
    '/faq',
    '/how-it-works',
    '/use-cases',
    '/supported-formats',
    '/contact',
    '/privacy',
    '/terms',
    '/security',
    '/cookies',
    '/login',
    '/signup',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency:
      route === '' || route === '/pricing' ? ('weekly' as const) : ('monthly' as const),
    priority: route === '' ? 1.0 : route === '/pricing' ? 0.9 : 0.7,
  }));

  const toolRoutes = allToolsList.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const personaRoutes = allPersonasList.map((persona) => ({
    url: `${baseUrl}/personas/${persona.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const comparisonRoutes = allComparisonsList.map((comp) => ({
    url: `${baseUrl}/compare/${comp.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const blogRoutes = allBlogList.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }));

  const utilityRoutes = allUtilitiesList.map((util) => ({
    url: `${baseUrl}/utilities/${util.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  const glossaryRoutes = allGlossaryTermsList.map((term) => ({
    url: `${baseUrl}/glossary/${term.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  const matrixRoutes: MetadataRoute.Sitemap = [];
  for (const guide of DOCUMENT_GUIDES) {
    for (const personaSlug of Object.keys(PERSONAS_REGISTRY)) {
      matrixRoutes.push({
        url: `${baseUrl}/analyze/${guide.slug}/for/${personaSlug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      });
    }
  }

  return [
    ...staticRoutes,
    ...toolRoutes,
    ...personaRoutes,
    ...comparisonRoutes,
    ...blogRoutes,
    ...utilityRoutes,
    ...glossaryRoutes,
    ...matrixRoutes,
  ];
}
