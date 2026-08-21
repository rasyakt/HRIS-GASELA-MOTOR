/**
 * Landing page layout — standalone luxury dark experience.
 *  - ForceDark keeps the public site in cinematic dark mode regardless of
 *    the user's HRIS portal theme preference.
 *  - Playfair Display powers the elegant display headings (font-display).
 *  - Shared chrome (nav + footer) is mounted here so the unit detail pages
 *    under /landing also receive the full experience.
 */

import { HashScroll } from '@/components/landing/HashScroll';
import { LandingContentProvider } from '@/components/landing/LandingContentProvider';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      <HashScroll />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-amber-600 focus:text-white focus:font-semibold focus:rounded-lg focus:shadow-lg"
      >
        Langsung ke konten
      </a>

      <LandingContentProvider>
        <LandingNav />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <LandingFooter />
      </LandingContentProvider>
    </div>
  );
}

