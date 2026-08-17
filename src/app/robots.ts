import type { MetadataRoute } from 'next';
import { serverEnv } from '@/config/env.server';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/login', '/signup', '/dashboard/', '/onboarding/'],
    },
    sitemap: `${serverEnv.APP_URL}/sitemap.xml`,
  };
}
