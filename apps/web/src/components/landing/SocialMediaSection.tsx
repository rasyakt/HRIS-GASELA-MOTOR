'use client';

/**
 * SocialMediaSection.tsx
 * ──────────────────────
 * Official Live Instagram Showcase for CV GASELA GROUP.
 * Clean, structured enterprise widget embedding the official @makaroni.ikantawes feed.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, ExternalLink, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const INSTAGRAM_URL = 'https://www.instagram.com/makaroni.ikantawes?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';

export function SocialMediaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.social-head',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.social-head', start: 'top 85%' },
        },
      );

      gsap.fromTo(
        '.social-widget',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.social-widget', start: 'top 85%' },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="social-media"
      className="relative bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-6"
      aria-labelledby="social-heading"
    >
      {/* ── Header ── */}
      <div className="social-head flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Instagram className="w-4 h-4 text-pink-600" />
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Dokumentasi &amp; Media Sosial
            </span>
          </div>
          <h2
            id="social-heading"
            className="font-sans text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight"
          >
            Instagram @makaroni.ikantawes
          </h2>
        </div>

        <div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold tracking-wide transition-all dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 shadow-2xs"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Kunjungi Profil</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ── Live Instagram Feed Widget ── */}
      <div className="social-widget space-y-3">
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 dark:border-zinc-800 bg-white h-125 shadow-2xs">
          <iframe
            src="https://www.instagram.com/makaroni.ikantawes/embed"
            title="Feed Instagram Makaroni Ikan Tawes"
            className="absolute inset-0 w-full h-full border-0 rounded-xl"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1">
          <span>Kanal dokumentasi resmi operasional CV GASELA GROUP</span>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            Buka di Aplikasi Instagram <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}

