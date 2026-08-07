/**
 * app/landing/page.tsx
 * ────────────────────
 * The CV GASELA GROUP public landing page.
 *
 * Architecture:
 *  - This is a Server Component (no "use client") that composes client
 *    sub-components.
 *  - The route is /landing — separate from the HRIS dashboard redirect at /.
 *  - Each section is a focused Client Component so GSAP can run in the browser.
 */

import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ScrollAnimationSection } from '@/components/landing/ScrollAnimationSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

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
      {/*
       * Skip-to-content link for keyboard / screen-reader accessibility.
       * Visually hidden until focused.
       */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-999 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-zinc-950 focus:font-bold focus:rounded-lg"
      >
        Langsung ke konten
      </a>

      {/* Sticky navigation */}
      <LandingNav />

      {/* Main page content */}
      <main id="main-content">
        {/* 1. Full-screen hero with entrance animations */}
        <HeroSection />

        {/* 2. Company biography & core values */}
        <AboutSection />

        {/*
         * 3. The signature scroll-driven pinned section.
         *    Wrapped in a labelled landmark for screen readers.
         *    The 500vh height lives inside ScrollAnimationSection.
         */}
        <section id="portfolio" aria-label="Portfolio bisnis Gasela Group">
          <ScrollAnimationSection />
        </section>

        {/* 4. Contact / CTA section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </>
  );
}
