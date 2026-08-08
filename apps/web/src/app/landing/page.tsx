/**
 * app/landing/page.tsx
 * ────────────────────
 * The CV GASELA GROUP public landing page.
 *
 * Architecture:
 *  - Server Component composing focused Client Components.
 *  - The route is /landing — separate from the HRIS dashboard redirect at /.
 *  - Shared chrome (nav, footer, force-dark) lives in the landing layout.
 */

import type { Metadata } from 'next';
import { HeroSection } from '@/components/landing/HeroSection';
import { MarqueeSection } from '@/components/landing/MarqueeSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ScrollAnimationSection } from '@/components/landing/ScrollAnimationSection';
import { ContactSection } from '@/components/landing/ContactSection';

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'CV GASELA GROUP — Konglomerasi Bisnis Cikoneng, Ciamis',
  description:
    'CV GASELA GROUP adalah gabungan bisnis unggulan di Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat, meliputi Gasela Motor, Gasela Futsal, Gasela Sellular & Plastik, dan Makaroni Cap Ikan Tawes.',
  keywords: [
    'CV GASELA',
    'Gasela Group',
    'Gasela Motor',
    'Gasela Futsal',
    'Cikoneng',
    'Ciamis',
    'Jawa Barat',
    'bengkel cikoneng',
    'futsal ciamis',
    'makaroni ikan tawes',
  ],
  authors: [{ name: 'CV GASELA GROUP' }],
  openGraph: {
    title: 'CV GASELA GROUP — Cikoneng, Ciamis',
    description:
      'Konglomerasi bisnis lokal terkemuka meliputi otomotif, ritel, olahraga, dan industri pangan di Cikoneng, Ciamis.',
    type: 'website',
    locale: 'id_ID',
  },
};

// ── Page Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* 1. Full-screen cinematic hero with animated stats */}
      <HeroSection />

      {/* 2. Infinite business-line ticker */}
      <MarqueeSection />

      {/* 3. Company biography, founder & journey timeline */}
      <AboutSection />

      {/*
       * 4. The signature scroll-driven pinned portfolio section.
       *    The 500vh height lives inside ScrollAnimationSection.
       */}
      <section id="portfolio" aria-label="Portfolio bisnis Gasela Group">
        <ScrollAnimationSection />
      </section>

      {/* 5. Contact / CTA section */}
      <ContactSection />
    </>
  );
}
