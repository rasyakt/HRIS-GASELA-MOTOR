import React from 'react';

/**
 * JSON-LD Schema.org Structured Data Component for CV GASELA GROUP.
 * Implements Organization, WebSite, and LocalBusiness specifications
 * for Google Search rich snippets and Local SEO rankings.
 */
export function CompanyJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://gasela.my.id/#organization',
        name: 'CV GASELA GROUP',
        alternateName: 'CV GASELA',
        url: 'https://gasela.my.id',
        logo: {
          '@type': 'ImageObject',
          url: 'https://gasela.my.id/cvgasela.png',
          caption: 'Logo CV GASELA GROUP',
        },
        image: 'https://gasela.my.id/gasela_hd_hero.png',
        description:
          'Konglomerasi bisnis lokal terkemuka di Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat yang menaungi Gasela Motor, Gasela Futsal, Gasela Sellular & Plastik, dan Makaroni Spesial Cap Ikan Tawes.',
        founder: {
          '@type': 'Person',
          name: 'H. Dedi Heryadi & Hj. Nining',
        },
        foundingDate: '1996',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jl. Raya Cikoneng No. 135',
          addressLocality: 'Cikoneng',
          addressRegion: 'Jawa Barat',
          postalCode: '46261',
          addressCountry: 'ID',
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+62-265-776103',
            contactType: 'customer service',
            areaServed: 'ID',
            availableLanguage: ['Indonesian', 'Sundanese'],
          },
          {
            '@type': 'ContactPoint',
            email: 'gaselagrup@gmail.com',
            contactType: 'general inquiry',
          },
        ],
        sameAs: [
          'https://facebook.com/GaselaGroup',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://gasela.my.id/#website',
        url: 'https://gasela.my.id',
        name: 'CV GASELA GROUP',
        description:
          'Official Website CV GASELA GROUP & Portal HRIS GaselaPulse Cikoneng, Ciamis.',
        publisher: {
          '@id': 'https://gasela.my.id/#organization',
        },
        inLanguage: 'id-ID',
      },
      // Local Business 1: DN Gasela Motor
      {
        '@type': 'AutoRepair',
        '@id': 'https://gasela.my.id/landing/unit/motor#business',
        name: 'DN GASELA Motor',
        parentOrganization: { '@id': 'https://gasela.my.id/#organization' },
        url: 'https://gasela.my.id/landing/unit/motor',
        image: 'https://gasela.my.id/gasela_hd_motor.png',
        telephone: '+62-265-776103',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jl. Raya Cikoneng No. 135',
          addressLocality: 'Cikoneng',
          addressRegion: 'Jawa Barat',
          postalCode: '46261',
          addressCountry: 'ID',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -7.311164,
          longitude: 108.270705,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '08:00',
            closes: '17:00',
          },
        ],
      },
      // Local Business 2: DN Gasela Futsal
      {
        '@type': 'SportsActivityLocation',
        '@id': 'https://gasela.my.id/landing/unit/futsal#business',
        name: 'DN GASELA Futsal Stadium',
        parentOrganization: { '@id': 'https://gasela.my.id/#organization' },
        url: 'https://gasela.my.id/landing/unit/futsal',
        image: 'https://gasela.my.id/gasela_hd_futsal.png',
        telephone: '+62-265-777000',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jl. Raya Cikoneng',
          addressLocality: 'Cikoneng',
          addressRegion: 'Jawa Barat',
          postalCode: '46261',
          addressCountry: 'ID',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -7.309329,
          longitude: 108.261469,
        },
      },
      // Local Business 3: DN Gasela Sellular & Plastik
      {
        '@type': 'WholesaleStore',
        '@id': 'https://gasela.my.id/landing/unit/sellular#business',
        name: 'DN GASELA Sellular & GASELA Plastik',
        parentOrganization: { '@id': 'https://gasela.my.id/#organization' },
        url: 'https://gasela.my.id/landing/unit/sellular',
        image: 'https://gasela.my.id/gasela_hd_sellular.png',
        telephone: '+62-265-2752592',
        priceRange: '$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jalan Raya Cikoneng',
          addressLocality: 'Cikoneng',
          addressRegion: 'Jawa Barat',
          postalCode: '46261',
          addressCountry: 'ID',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -7.311096,
          longitude: 108.272628,
        },
      },
      // Local Business 4: Makaroni Cap Ikan Tawes
      {
        '@type': 'FoodEstablishment',
        '@id': 'https://gasela.my.id/landing/unit/makaronikantawes#business',
        name: 'Makaroni Spesial Cap Ikan Tawes',
        parentOrganization: { '@id': 'https://gasela.my.id/#organization' },
        url: 'https://gasela.my.id/landing/unit/makaronikantawes',
        image: 'https://gasela.my.id/gasela_hd_makaroni.png',
        telephone: '+62-265-2751184',
        priceRange: '$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jl. Tentara Pelajar No. 165, RT.19/RW.006',
          addressLocality: 'Cikoneng',
          addressRegion: 'Jawa Barat',
          postalCode: '46261',
          addressCountry: 'ID',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -7.306484,
          longitude: 108.262652,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function UnitBreadcrumbJsonLd({ name, url }: { name: string; url: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: 'https://gasela.my.id',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Portfolio Bisnis',
        item: 'https://gasela.my.id/landing#portfolio',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: name,
        item: url,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
