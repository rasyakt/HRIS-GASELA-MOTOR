'use client';

/**
 * LandingFooter.tsx
 * ─────────────────
 * Luxury footer with oversized watermark for CV GASELA GROUP.
 * Fully theme-aware (light & dark) with 100% functional navigation links across all pages.
 */

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, Instagram, Facebook, ArrowRight } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';
import { useLandingContent } from './LandingContentProvider';

export function LandingFooter() {
  const { content } = useLandingContent();
  const footer = content.footer;
  const pathname = usePathname();
  const isLandingPage = pathname === '/landing';
  const year = new Date().getFullYear();

  const getAnchorHref = (anchor: string) => (isLandingPage ? anchor : `/landing${anchor}`);
  const getHref = (href: string) => (href.startsWith('#') ? getAnchorHref(href) : href);

  return (
    <footer
      className="relative bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-white/[0.06] pt-20 pb-8 px-6 md:px-12 lg:px-24 overflow-hidden"
      role="contentinfo"
    >
        {/* Giant watermark */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 font-display font-black leading-none text-zinc-900/[0.035] text-[24vw] tracking-[0.05em] whitespace-nowrap select-none dark:text-white/[0.02]"
        aria-hidden
      >
        {footer.brandName.replace(/[^A-Z]/g, '')}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16 relative z-10">
        {/* 1. Brand */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden ring-1 ring-zinc-200 bg-white flex items-center justify-center shadow-lg shadow-zinc-900/10 dark:ring-white/15 dark:bg-zinc-900 dark:shadow-black/40">
              <Image src="/cvgasela.png" alt="CV Gasela Logo" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <span className="text-zinc-900 dark:text-white font-black text-sm tracking-[0.25em] uppercase leading-none block">
                {footer.brandName}
              </span>
            </div>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed pr-4">{footer.description}</p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/makaroni.ikantawes?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @makaroni.ikantawes"
              className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-pink-600 hover:text-white hover:border-transparent transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-pink-600"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@capikantawes?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok @capikantawes"
              className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-950 hover:text-white hover:border-transparent transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-950"
            >
              <SiTiktok className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://facebook.com/search/top?q=Gasela%20Group"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook CV Gasela Group"
              className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-blue-600"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2+3. Link Columns */}
        {footer.columns.map((col) => (
          <div key={col.id}>
            <h3 className="text-zinc-900 dark:text-white font-bold text-sm tracking-[0.2em] uppercase mb-6">
              {col.title}
            </h3>
            <ul className="space-y-4">
              {col.links.map((link) => (
                <li key={link.id}>
                  <Link
                    href={getHref(link.href)}
                    className={`text-sm font-medium text-zinc-500 transition-colors flex items-center gap-2 group ${link.href.startsWith('#') ? 'hover:text-zinc-900 dark:hover:text-white' : 'hover:text-amber-600 dark:hover:text-amber-200'}`}
                  >
                    {!link.href.startsWith('#') && (
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600/70 dark:text-amber-300/60 transition-transform group-hover:translate-x-1" />
                    )}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* 4. Hubungi Kami */}
        <div>
          <h3 className="text-zinc-900 dark:text-white font-bold text-sm tracking-[0.2em] uppercase mb-6">
            {footer.contactTitle}
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-600/70 dark:text-amber-300/70 shrink-0 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(footer.contactAddress.replace(/\n/g, ' '))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-zinc-500 hover:text-amber-600 dark:hover:text-amber-300 transition-colors leading-relaxed"
              >
                {footer.contactAddress.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < footer.contactAddress.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-amber-600/70 dark:text-amber-300/70 shrink-0" />
              <a
                href={`tel:${footer.contactPhone.replace(/[^0-9+]/g, '')}`}
                className="text-sm font-medium text-zinc-500 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
              >
                {footer.contactPhone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-amber-600/70 dark:text-amber-300/70 shrink-0" />
              <a
                href={`mailto:${footer.contactEmail}`}
                className="text-sm font-medium text-zinc-500 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
              >
                {footer.contactEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-200/80 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 dark:border-white/[0.07]">
        <p className="text-xs text-zinc-400 dark:text-zinc-600 font-medium">
          © {year} {footer.copyright}
        </p>
        <div className="flex items-center gap-6 text-xs font-medium text-zinc-400 dark:text-zinc-600">
          <Link href={getAnchorHref('#about')} className="hover:text-amber-600 dark:hover:text-amber-200 transition-colors">
            {footer.privacyLabel}
          </Link>
          <Link href={getAnchorHref('#about')} className="hover:text-amber-600 dark:hover:text-amber-200 transition-colors">
            {footer.termsLabel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
