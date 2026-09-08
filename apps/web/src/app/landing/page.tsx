/**
 * app/landing/page.tsx
 * ────────────────────
 * The CV GASELA GROUP public landing page.
 *
 * Architecture:
 *  - Server Component composing focused Client Components.
 *  - The route is /landing — separate from the HRIS dashboard redirect at /.
 *  - Shared chrome (nav, footer, force-dark) lives in the landing layout.
 *  - Integrates Schema.org JSON-LD for rich snippet Search results.
 */

import type { Metadata } from 'next';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ScrollAnimationSection } from '@/components/landing/ScrollAnimationSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { CompanyJsonLd, FaqJsonLd, ItemListJsonLd } from '@/components/landing/JsonLd';

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'CV GASELA GROUP — Holding Perusahaan Cikoneng, Ciamis, Jawa Barat',
  description:
    'CV GASELA GROUP adalah holding perusahaan unggulan berdiri 1996 di Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat. Menaungi DN Gasela Motor, DN Gasela Futsal Stadium, DN Gasela Sellular & Plastik, dan Makaroni Spesial Cap Ikan Tawes.',
  keywords: [
    // Brand utama
    'CV GASELA',
    'CV Gasela',
    'cv gasela',
    'CV. GASELA',
    'Gasela Group',
    'Gasela Grup',
    'gasela group',
    'CV Gasela Group',
    'Gasela',
    'gasela',
    'DN Gasela',
    'dn gasela',
    // Unit bisnis
    'Gasela Motor',
    'gasela motor',
    'DN Gasela Motor',
    'Gasela Futsal',
    'gasela futsal',
    'Gasela Futsal Stadium',
    'GOR Gasela Futsal',
    'Gasela Sellular',
    'Gasela Plastik',
    'gasela plastik',
    // Produk ikonik
    'Makaroni Cap Ikan Tawes',
    'makaroni cap ikan tawes',
    'Makaroni Ikan Tawes',
    'Makaroni Spesial Cap Ikan Tawes',
    'Makroni Ikan Tawes',
    'Makroni Cap Ikan Tawes',
    'makaroni goreng ciamis',
    'camilan khas ciamis',
    'oleh oleh ciamis',
    'snack cikoneng',
    // Lokasi
    'Cikoneng',
    'Kabupaten Ciamis',
    'Ciamis',
    'Jawa Barat',
    'Priangan Timur',
    'Kecamatan Cikoneng',
    'Tasikmalaya',
    // Bisnis lokal — motor/otomotif
    'bengkel mobil ciamis',
    'bengkel mobil cikoneng',
    'cuci steam ciamis',
    'cuci steam cikoneng',
    'servis mobil ciamis',
    'tune up ciamis',
    'salon mobil ciamis',
    'spooring ciamis',
    'balancing ciamis',
    'sparepart mobil ciamis',
    'otomotif cikoneng',
    // Bisnis lokal — futsal
    'futsal ciamis',
    'lapangan futsal ciamis',
    'lapangan futsal cikoneng',
    'sewa lapangan futsal ciamis',
    'booking futsal ciamis',
    'GOR futsal ciamis',
    'futsal Priangan Timur',
    // Bisnis lokal — sellular & plastik
    'toko plastik ciamis',
    'distributor plastik ciamis',
    'plastik kemasan ciamis',
    'voucher pulsa cikoneng',
    'cetak foto cikoneng',
    'atk cikoneng',
    // Umum
    'holding company ciamis',
    'konglomerasi bisnis ciamis',
    'perusahaan cikoneng',
    'profil perusahaan gasela',
  ],
  authors: [{ name: 'CV GASELA GROUP', url: 'https://gasela.my.id' }],
  alternates: {
    canonical: 'https://gasela.my.id/landing',
  },
  openGraph: {
    title: 'CV GASELA GROUP — Holding Perusahaan Cikoneng, Ciamis sejak 1996',
    description:
      'Holding perusahaan lokal terkemuka meliputi otomotif (bengkel mobil), olahraga futsal stadium, ritel plastik & sellular, dan industri pangan Makaroni Cap Ikan Tawes di Cikoneng, Ciamis, Jawa Barat.',
    url: 'https://gasela.my.id/landing',
    siteName: 'CV GASELA GROUP',
    images: [
      {
        url: '/gasela_hd_hero.png',
        width: 1200,
        height: 630,
        alt: 'CV GASELA GROUP — Holding Perusahaan Cikoneng Ciamis Jawa Barat',
      },
    ],
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CV GASELA GROUP — Cikoneng, Ciamis',
    description:
      'Pusat Bisnis Otomotif, Futsal Stadium, Ritel Plastik, dan Kuliner Makaroni Cap Ikan Tawes di Cikoneng, Ciamis, Jawa Barat. Berdiri sejak 1996.',
    images: ['/gasela_hd_hero.png'],
  },
};

// ── Page Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* Google Rich Snippets Structured Data */}
      <CompanyJsonLd />
      <FaqJsonLd />
      <ItemListJsonLd />

      {/* 1. Full-screen hero section */}
      <HeroSection />

      {/* 2. Company biography, founder profile & journey timeline */}
      <AboutSection />

      {/* 3. Portfolio section */}
      <section id="portfolio" aria-label="Portfolio bisnis CV GASELA GROUP — Gasela Motor, Futsal, Plastik, Makaroni Ikan Tawes">
        <ScrollAnimationSection />
      </section>

      {/* 4. Contact & branch directory */}
      <ContactSection />
    </>
  );
}

