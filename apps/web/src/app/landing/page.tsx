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
import { CompanyJsonLd } from '@/components/landing/JsonLd';

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'CV GASELA GROUP — Konglomerasi Bisnis Cikoneng, Ciamis',
  description:
    'CV GASELA GROUP adalah gabungan bisnis unggulan di Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat, meliputi DN Gasela Motor, DN Gasela Futsal Stadium, DN Gasela Sellular & Plastik, dan Makaroni Spesial Cap Ikan Tawes.',
  keywords: [
    'CV GASELA',
    'Gasela Group',
    'Gasela Motor',
    'Gasela Futsal',
    'Gasela Sellular',
    'Gasela Plastik',
    'Makaroni Ikan Tawes',
    'Cikoneng',
    'Ciamis',
    'Tasikmalaya',
    'Priangan Timur',
    'Jawa Barat',
    'bengkel mobil cikoneng',
    'bengkel mobil ciamis',
    'cuci steam ciamis',
    'futsal ciamis',
    'lapangan futsal cikoneng',
    'makaroni cikoneng',
    'distributor plastik ciamis',
  ],
  authors: [{ name: 'CV GASELA GROUP', url: 'https://gasela.my.id' }],
  alternates: {
    canonical: 'https://gasela.my.id/landing',
  },
  openGraph: {
    title: 'CV GASELA GROUP — Konglomerasi Bisnis Cikoneng, Ciamis',
    description:
      'Konglomerasi bisnis lokal terkemuka meliputi otomotif, ritel, olahraga, dan industri pangan di Cikoneng, Ciamis.',
    url: 'https://gasela.my.id/landing',
    siteName: 'CV GASELA GROUP',
    images: [
      {
        url: '/gasela_hd_hero.png',
        width: 1200,
        height: 630,
        alt: 'CV GASELA GROUP Cikoneng Ciamis',
      },
    ],
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CV GASELA GROUP — Cikoneng, Ciamis',
    description:
      'Pusat Bisnis Otomotif, Olahraga Futsal, Ritel Plastik, dan Kuliner Makaroni di Cikoneng, Ciamis.',
    images: ['/gasela_hd_hero.png'],
  },
};

// ── Page Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* Google Rich Snippets Structured Data */}
      <CompanyJsonLd />

      {/* 1. Full-screen hero section */}
      <HeroSection />

      {/* 2. Company biography, founder profile & journey timeline */}
      <AboutSection />

      {/* 3. Portfolio section */}
      <section id="portfolio" aria-label="Portfolio bisnis Gasela Group">
        <ScrollAnimationSection />
      </section>

      {/* 4. Contact & branch directory */}
      <ContactSection />
    </>
  );
}

