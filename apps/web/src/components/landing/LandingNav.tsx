'use client';

/**
 * LandingNav.tsx
 * ──────────────
 * Minimalist, ultra-clean corporate header navigation.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

const NAV_LINKS = [
  { label: 'Beranda', href: '#hero' },
  { label: 'Biografi', href: '#about' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Kontak', href: '#contact' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 py-4 shadow-sm dark:shadow-none'
          : 'bg-transparent py-6'
      }`}
      role="banner"
    >
      <nav
        className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Brand Logo */}
        <a href="#hero" className="flex items-center gap-3 group" aria-label="CV GASELA GROUP home">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src="/cvgasela.png"
              alt="CV Gasela Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-slate-900 dark:text-white font-extrabold text-sm tracking-wider uppercase block leading-none">
              CV. GASELA
            </span>
            <span className="text-slate-500 dark:text-zinc-500 text-[10px] font-semibold tracking-widest uppercase block mt-0.5">
              GROUP
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all shadow-md shadow-blue-500/10 dark:shadow-blue-950/20"
          >
            <span>Portal HRIS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 px-6 py-6 space-y-4">
          <ul className="space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="block text-sm font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-900">
            <Link
              href="/login"
              className="block w-full text-center py-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-500/20 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              Portal HRIS
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
