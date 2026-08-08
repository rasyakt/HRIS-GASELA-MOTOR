/**
 * Landing page layout — standalone luxury dark experience.
 *  - ForceDark keeps the public site in cinematic dark mode regardless of
 *    the user's HRIS portal theme preference.
 *  - Playfair Display powers the elegant display headings (font-display).
 *  - Shared chrome (nav + footer) is mounted here so the unit detail pages
 *    under /landing also receive the full experience.
 */

import { Playfair_Display } from 'next/font/google';
import { HashScroll } from '@/components/landing/HashScroll';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable}`}>
      <HashScroll />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-300 focus:text-zinc-950 focus:font-bold focus:rounded-lg"
      >
        Langsung ke konten
      </a>

      <LandingNav />

      <main id="main-content">{children}</main>

      <LandingFooter />
    </div>
  );
}
