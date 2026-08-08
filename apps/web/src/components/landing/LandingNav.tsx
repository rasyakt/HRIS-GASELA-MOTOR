'use client';

/**
 * LandingNav.tsx
 * ──────────────
 * Luxury glassmorphism header for the CV GASELA GROUP public site.
 */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Beranda', anchor: '#hero' },
  { label: 'Biografi', anchor: '#about' },
  { label: 'Portofolio', anchor: '#portfolio' },
  { label: 'Kontak', anchor: '#contact' },
];

export function LandingNav() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/landing';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = useMemo(
    () => NAV_LINKS.map((l) => ({ ...l, href: isLandingPage ? l.anchor : `/landing${l.anchor}` })),
    [isLandingPage],
  );
  const brandHref = isLandingPage ? '#hero' : '/landing#hero';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-zinc-950/85 backdrop-blur-xl border-b border-white/[0.06] py-3.5 shadow-lg shadow-black/40'
          : 'bg-transparent border-b border-transparent py-6'
      }`}
      role="banner"
    >
      <nav
        className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex items-center justify-between"
        aria-label="Navigasi utama"
      >
        {/* Brand */}
        <a href={brandHref} className="group flex items-center gap-3" aria-label="CV GASELA GROUP — Beranda">
          <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/15 group-hover:ring-amber-300/70 transition-all duration-300 bg-zinc-900 flex items-center justify-center shadow-lg shadow-black/40">
            <Image src="/cvgasela.png" alt="CV Gasela Logo" width={36} height={36} className="object-contain" />
          </div>
          <div className="leading-none">
            <span className="block text-white font-black text-sm tracking-[0.25em] uppercase">CV. GASELA</span>
            <span className="block mt-1.5 bg-linear-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent text-[10px] font-extrabold tracking-[0.45em] uppercase">
              Group
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-9" role="list">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="group relative text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400 hover:text-white transition-colors duration-300 pb-1.5"
              >
                {link.label}
                <span className="absolute left-0 -bottom-px h-px w-0 bg-linear-to-r from-amber-300 to-amber-500 transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-linear-to-r from-amber-300 via-amber-400 to-amber-300 text-zinc-950 text-xs font-black uppercase tracking-[0.18em] shadow-[0_8px_30px_-8px_rgba(251,191,36,0.55)] hover:shadow-[0_8px_44px_-6px_rgba(251,191,36,0.75)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <span>Portal HRIS</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-2xl border-t border-white/[0.06] px-6 pt-4 pb-8 shadow-2xl shadow-black/50">
          <ul className="space-y-1" role="list">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-3.5 px-2 text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 hover:text-white border-b border-white/[0.04] transition-colors"
                >
                  {link.label}
                  <ArrowUpRight className="w-4 h-4 text-amber-300/70" />
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="mt-6 flex items-center justify-center gap-2 w-full py-4 rounded-full bg-linear-to-r from-amber-300 to-amber-400 text-zinc-950 text-xs font-black uppercase tracking-[0.2em]"
          >
            Portal HRIS Karyawan
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
