import React from 'react';

/**
 * JSON-LD Schema.org Structured Data Component for CV GASELA GROUP.
 * Implements Organization, WebSite, LocalBusiness, FAQPage, and ItemList
 * specifications for Google Search rich snippets and Local SEO rankings.
 */
export function CompanyJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://gasela.my.id/#organization',
        name: 'CV GASELA GROUP',
        alternateName: [
          'CV Gasela Group',
          'CV Gasela',
          'CV. GASELA',
          'Gasela Group',
          'Gasela Grup',
          'DN Gasela',
          'GASELA',
        ],
        url: 'https://gasela.my.id',
        logo: {
          '@type': 'ImageObject',
          url: 'https://gasela.my.id/cvgasela.png',
          caption: 'Logo CV GASELA GROUP',
          width: 200,
          height: 200,
        },
        image: 'https://gasela.my.id/gasela_hd_hero.png',
        description:
          'CV GASELA GROUP adalah holding perusahaan lokal terkemuka berdiri sejak 1996 di Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat. Menaungi DN Gasela Motor (bengkel & otomotif), DN Gasela Futsal Stadium, DN Gasela Sellular & Plastik, dan Makaroni Spesial Cap Ikan Tawes.',
        founder: {
          '@type': 'Person',
          name: 'H. Dedi Heryadi & Hj. Nining',
        },
        foundingDate: '1996',
        foundingLocation: {
          '@type': 'Place',
          name: 'Cikoneng, Kabupaten Ciamis, Jawa Barat',
        },
        numberOfEmployees: {
          '@type': 'QuantitativeValue',
          minValue: 50,
          maxValue: 150,
        },
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Kabupaten Ciamis' },
          { '@type': 'AdministrativeArea', name: 'Priangan Timur' },
          { '@type': 'AdministrativeArea', name: 'Jawa Barat' },
        ],
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
        sameAs: ['https://facebook.com/GaselaGroup'],
        hasMap: 'https://maps.google.com/?q=Gasela+Motor+Cikoneng+Ciamis',
        subOrganization: [
          { '@id': 'https://gasela.my.id/landing/unit/motor#business' },
          { '@id': 'https://gasela.my.id/landing/unit/futsal#business' },
          { '@id': 'https://gasela.my.id/landing/unit/sellular#business' },
          { '@id': 'https://gasela.my.id/landing/unit/makaronikantawes#business' },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://gasela.my.id/#website',
        url: 'https://gasela.my.id',
        name: 'CV GASELA GROUP',
        description:
          'Official Website CV GASELA GROUP & Portal HRIS GaselaPulse Cikoneng, Ciamis.',
        publisher: { '@id': 'https://gasela.my.id/#organization' },
        inLanguage: 'id-ID',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://gasela.my.id/landing?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      // Local Business 1: DN Gasela Motor
      {
        '@type': ['LocalBusiness', 'AutoRepair'],
        '@id': 'https://gasela.my.id/landing/unit/motor#business',
        name: 'DN GASELA Motor',
        alternateName: ['Gasela Motor', 'Bengkel Gasela Ciamis', 'Bengkel Mobil Gasela'],
        parentOrganization: { '@id': 'https://gasela.my.id/#organization' },
        url: 'https://gasela.my.id/landing/unit/motor',
        image: 'https://gasela.my.id/gasela_hd_motor.png',
        telephone: '+62-265-776103',
        priceRange: '$$',
        description: 'Pusat pelayanan otomotif terbesar dan terlengkap di Kabupaten Ciamis: servis, cuci steam, spooring, balancing, salon mobil, dan suku cadang resmi sejak 2008.',
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
        hasMap: 'https://maps.google.com/maps?q=DN.+Gasela+Motor+Cikoneng',
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
        name: 'CV GASELA GROUP — Portfolio Bisnis',
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

/**
 * FAQPage JSON-LD — Menghasilkan FAQ Rich Snippet di Google SERP.
 */
export function FaqJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Apa itu CV GASELA GROUP?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CV GASELA GROUP adalah holding perusahaan lokal terkemuka yang berdiri sejak tahun 1996 di Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat. Menaungi empat unit bisnis: DN Gasela Motor (bengkel & otomotif), DN Gasela Futsal Stadium, DN Gasela Sellular & Plastik, dan Makaroni Spesial Cap Ikan Tawes.',
        },
      },
      {
        '@type': 'Question',
        name: 'Di mana lokasi Gasela Motor Cikoneng?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'DN Gasela Motor berlokasi di Jl. Raya Cikoneng No.135, Cikoneng, Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat 46261. Telepon: (0265) 776103.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apa saja layanan bengkel Gasela Motor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'DN Gasela Motor menyediakan layanan lengkap: cuci steam mobil & motor, servis berkala & tune-up, car saloon & detailing, spooring, balancing roda, dan suku cadang mobil resmi terlengkap di Ciamis.',
        },
      },
      {
        '@type': 'Question',
        name: 'Bagaimana cara booking lapangan futsal Gasela Ciamis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Booking lapangan futsal DN Gasela Futsal Stadium melalui telepon (0265) 777000 atau email gaselafutsal@gmail.com. Lokasi: Jl. Raya Cikoneng, Cikoneng, Kabupaten Ciamis 46261.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apa itu Makaroni Cap Ikan Tawes dan di mana membelinya?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Makaroni Spesial Cap Ikan Tawes adalah camilan makaroni goreng khas Cikoneng, Ciamis yang diproduksi CV GASELA sejak 1996. Tersedia 6 varian rasa: Original, Keju, Jagung Bakar, Jagung Manis, Balado Pedas, Extra Pedas. Peraih KUKM Berprestasi Jawa Barat 2008. Lokasi: Jl. Tentara Pelajar No. 165, Cikoneng, Ciamis. Telepon: (0265) 2751184.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah Gasela Plastik melayani pembelian grosir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ya, DN Gasela Plastik melayani pembelian grosir dan eceran berbagai ukuran plastik kemasan, bahan kerupuk babanggi, dan bumbu industri pangan. Melayani pelanggan dalam dan luar kota Ciamis. Telepon: (0265) 2752592.',
        },
      },
      {
        '@type': 'Question',
        name: 'Kapan CV GASELA GROUP berdiri?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CV GASELA GROUP dirintis sejak 1996 melalui industri Makaroni Cap Ikan Tawes di Cikoneng, Ciamis oleh H. Dedi Heryadi dan Hj. Nining. Ekspansi ke Gasela Motor & Sellular (2008) dan Gasela Futsal Stadium (2012).',
        },
      },
      {
        '@type': 'Question',
        name: 'Apa itu GaselaPulse HRIS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'GaselaPulse adalah sistem manajemen sumber daya manusia (HRIS) yang dikembangkan khusus untuk CV GASELA GROUP, mencakup manajemen kehadiran, penggajian, cuti, lembur, dan profil karyawan untuk semua unit bisnis.',
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

/**
 * ItemList JSON-LD — Unit bisnis sebagai list untuk Google featured snippet.
 */
export function ItemListJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Unit Bisnis CV GASELA GROUP — Cikoneng, Ciamis',
    description: 'Daftar unit bisnis yang tergabung dalam CV GASELA GROUP di Cikoneng, Kabupaten Ciamis, Jawa Barat.',
    numberOfItems: 4,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'DN Gasela Motor — Bengkel & Otomotif Terlengkap Ciamis',
        description: 'Pusat pelayanan otomotif terbesar di Kabupaten Ciamis: servis, steam, spooring, balancing, salon mobil.',
        url: 'https://gasela.my.id/landing/unit/motor',
        image: 'https://gasela.my.id/gasela_hd_motor.png',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'DN Gasela Futsal Stadium — Lapangan Futsal Termegah Priangan Timur',
        description: 'Lapangan futsal premium rumput sintetis Supergrass USA 20x32m di Cikoneng, Ciamis.',
        url: 'https://gasela.my.id/landing/unit/futsal',
        image: 'https://gasela.my.id/gasela_hd_futsal.png',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'DN Gasela Sellular & Gasela Plastik — Distributor Plastik & ATK Cikoneng',
        description: 'Distributor plastik kemasan, voucher seluler, ATK, cetak foto, dan fotocopy di Cikoneng.',
        url: 'https://gasela.my.id/landing/unit/sellular',
        image: 'https://gasela.my.id/gasela_hd_sellular.png',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Makaroni Spesial Cap Ikan Tawes — Camilan Khas Cikoneng Ciamis sejak 1996',
        description: 'Makaroni goreng khas Cikoneng, Ciamis dalam 6 varian rasa. Peraih KUKM Berprestasi Jawa Barat 2008.',
        url: 'https://gasela.my.id/landing/unit/makaronikantawes',
        image: 'https://gasela.my.id/gasela_hd_makaroni.png',
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
