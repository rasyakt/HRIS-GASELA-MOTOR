'use client';

/**
 * LandingFooter.tsx
 * ─────────────────
 * Corporate footer for CV GASELA GROUP.
 * Clean, structured layout with company profile, directory links,
 * verified contact details, and legal information.
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

  const handleFooterLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#') || (isLandingPage && href.startsWith('/landing#'))) {
      const anchor = href.includes('#') ? href.split('#')[1] : '';
      if (anchor) {
        e.preventDefault();
        if (anchor === 'hero') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.history.pushState(null, '', '/landing');
          return;
        }
        const targetEl = document.getElementById(anchor);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.pushState(null, '', `/landing#${anchor}`);
        }
      }
    }
  };

  return (
    <footer
      className="bg-white dark:bg-zinc-950 border-t border-slate-200/90 dark:border-zinc-800/90 pt-16 pb-10 px-5 sm:px-8 lg:px-12 text-slate-600 dark:text-zinc-400"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
        {/* 1. Brand Profile */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <Image src="/cvgasela.png" alt="CV Gasela Logo" width={30} height={30} className="object-contain" />
            </div>
            <div>
              <span className="text-slate-950 dark:text-white font-extrabold text-sm tracking-tight block">
                {footer.brandName}
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tracking-wide uppercase block">
                {footer.brandTagline}
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed pr-2">
            {footer.description}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <a
              href="https://www.instagram.com/makaroni.ikantawes?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @makaroni.ikantawes"
              className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white hover:border-transparent transition-colors dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-amber-500 dark:hover:text-zinc-950"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@capikantawes?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok @capikantawes"
              className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white hover:border-transparent transition-colors dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-950"
            >
              <SiTiktok className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://facebook.com/search/top?q=Gasela%20Group"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook CV Gasela Group"
              className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white hover:border-transparent transition-colors dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-amber-500 dark:hover:text-zinc-950"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2 & 3. Link Columns */}
        {footer.columns.map((col) => (
          <div key={col.id}>
            <h3 className="text-slate-950 dark:text-white font-extrabold text-xs tracking-wider uppercase mb-4">
              {col.title}
            </h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => {
                const targetHref = getHref(link.href);
                return (
                  <li key={link.id}>
                    <a
                      href={targetHref}
                      onClick={(e) => handleFooterLinkClick(e, targetHref)}
                      className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors flex items-center gap-1.5 group cursor-pointer"
                    >
                      {!link.href.startsWith('#') && (
                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
                      )}
                      <span>{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* 4. Head Office Contact */}
        <div>
          <h3 className="text-slate-950 dark:text-white font-extrabold text-xs tracking-wider uppercase mb-4">
            {footer.contactTitle}
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(footer.contactAddress.replace(/\n/g, ' '))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-800 dark:hover:text-amber-300 transition-colors leading-relaxed"
              >
                {footer.contactAddress.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < footer.contactAddress.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <a
                href={`tel:${footer.contactPhone.replace(/[^0-9+]/g, '')}`}
                className="font-bold text-slate-900 dark:text-zinc-200 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
              >
                {footer.contactPhone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <a
                href={`mailto:${footer.contactEmail}`}
                className="hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
              >
                {footer.contactEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-500">
        <p>© {year} {footer.copyright}</p>
        <div className="flex items-center gap-5">
          <a
            href={getAnchorHref('#about')}
            onClick={(e) => handleFooterLinkClick(e, getAnchorHref('#about'))}
            className="hover:text-slate-900 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            {footer.privacyLabel}
          </a>
          <a
            href={getAnchorHref('#about')}
            onClick={(e) => handleFooterLinkClick(e, getAnchorHref('#about'))}
            className="hover:text-slate-900 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            {footer.termsLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}

