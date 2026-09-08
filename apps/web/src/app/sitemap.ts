import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gasela.my.id';
  const currentDate = new Date();

  return [
    // Root redirect → landing (canonical)
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Main landing page — highest priority SEO target
    {
      url: `${baseUrl}/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Unit pages — Gasela Motor
    {
      url: `${baseUrl}/landing/unit/motor`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Unit pages — Gasela Futsal
    {
      url: `${baseUrl}/landing/unit/futsal`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Unit pages — Gasela Sellular & Plastik
    {
      url: `${baseUrl}/landing/unit/sellular`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Unit pages — Makaroni Cap Ikan Tawes (canonical slug)
    {
      url: `${baseUrl}/landing/unit/makaronikantawes`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Alias — makaroni shorthand (for discoverability)
    {
      url: `${baseUrl}/landing/unit/makaroni`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Login page (portal entry point)
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}

