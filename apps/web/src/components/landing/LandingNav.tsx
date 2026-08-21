'use client';

/**
 * LandingNav.tsx
 * ──────────────
 * Executive header for the CV GASELA GROUP public site.
 * Clean, high-contrast, theme-aware navigation with instant access to HRIS portal.
 */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { useLandingContent } from './LandingContentProvider';

export function LandingNav() {
  const { content } = useLandingContent();
  const nav = content.nav;
  const pathname = usePathname();
  const isLandingPage = pathname === '/landing';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = useMemo(
    () => nav.links.map((l) => ({ ...l, href: isLandingPage ? l.anchor : `/landing${l.anchor}` })),
    [nav.links, isLandingPage],
  );
  const brandHref = isLandingPage ? '#hero' : '/landing#hero';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#') || (isLandingPage && href.startsWith('/landing#'))) {
      const anchor = href.includes('#') ? href.split('#')[1] : '';
      if (anchor) {
        e.preventDefault();
        if (anchor === 'hero') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.history.pushState(null, '', '/landing');
          setMobileOpen(false);
          return;
        }
        const targetEl = document.getElementById(anchor);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.pushState(null, '', `/landing#${anchor}`);
          setMobileOpen(false);
        }
      }
    }
  };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLandingPage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/landing');
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 py-3 shadow-xs dark:bg-zinc-950/95 dark:border-zinc-800/90'
          : 'bg-white/80 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none border-b border-slate-200/50 md:border-transparent py-4 dark:bg-zinc-950/80 dark:md:bg-transparent dark:border-zinc-800/40 md:dark:border-transparent'
      }`}
      role="banner"
    >
      <nav
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between"
        aria-label="Navigasi utama"
      >
        {/* Brand Lockup */}
        <a
          href={brandHref}
          onClick={handleBrandClick}
          className="group flex items-center gap-3.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg cursor-pointer"
          aria-label={`${nav.brandName} — Beranda`}
        >
          <div className="relative w-9 h-9 rounded-xl border border-slate-200 bg-white dark:border-zinc-700/80 dark:bg-zinc-900 flex items-center justify-center shadow-xs group-hover:border-amber-500/60 transition-colors">
            <Image
              src={nav.logo}
              alt={`${nav.brandName} Logo`}
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-950 dark:text-white font-extrabold text-sm tracking-tight leading-tight">
              {nav.brandName}
            </span>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
              {nav.brandTagline}
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white transition-colors duration-200 py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-600 dark:after:bg-amber-400 hover:after:w-full after:transition-all after:duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href={nav.ctaHref}
            className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold tracking-wide shadow-xs hover:shadow-sm transition-all duration-200 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
          >
            <span>{nav.ctaLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors flex items-center justify-center shadow-xs"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-t border-slate-200/80 px-6 pt-4 pb-6 shadow-xl dark:bg-zinc-950/98 dark:border-zinc-800/80">
          <ul className="space-y-1 divide-y divide-slate-100 dark:divide-zinc-800/60" role="list">
            {links.map((link) => (
              <li key={link.label} className="pt-2 first:pt-0">
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center justify-between py-2.5 text-sm font-bold text-slate-800 hover:text-slate-950 dark:text-zinc-200 dark:hover:text-white transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                </a>
              </li>
            ))}
          </ul>
          <Link
            href={nav.ctaHref}
            onClick={() => setMobileOpen(false)}
            className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold tracking-wide shadow-xs dark:bg-amber-500 dark:text-zinc-950"
          >
            <span>{nav.ctaLabel}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
}

