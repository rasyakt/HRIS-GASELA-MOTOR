import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://gasela.my.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/landing',
          '/landing/*',
          '/login',
          '/*.png',
          '/*.jpg',
          '/*.jpeg',
          '/*.svg',
          '/*.ico',
        ],
        disallow: [
          '/api/',
          '/api/*',
          '/dashboard',
          '/dashboard/*',
          '/employees',
          '/employees/*',
          '/attendance',
          '/attendance/*',
          '/leaves',
          '/leaves/*',
          '/overtime',
          '/overtime/*',
          '/payroll',
          '/payroll/*',
          '/landing-cms',
          '/landing-cms/*',
          '/settings',
          '/settings/*',
          '/profile',
          '/profile/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
