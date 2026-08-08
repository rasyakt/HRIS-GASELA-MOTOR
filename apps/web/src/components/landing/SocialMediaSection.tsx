'use client';

/**
 * SocialMediaSection.tsx
 * ──────────────────────
 * Clean, stream-lined Live Instagram Showcase for CV GASELA GROUP.
 * Directly embeds official live feed from @makaroni.ikantawes.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, ExternalLink, Sparkles, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const INSTAGRAM_URL = 'https://www.instagram.com/makaroni.ikantawes?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';

export function SocialMediaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.social-head',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.social-head', start: 'top 85%' },
        }
      );

      gsap.fromTo(
        '.social-widget',
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.social-widget', start: 'top 85%' },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="social-media"
      className="relative bg-zinc-50 dark:bg-zinc-950 py-24 px-6 md:px-12 lg:px-24 border-t border-zinc-200/80 dark:border-white/[0.06] overflow-hidden"
      aria-labelledby="social-heading"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 right-1/3 w-140 h-140 bg-amber-400/10 rounded-full blur-[160px] pointer-events-none dark:bg-amber-400/5" />
      <div className="absolute bottom-10 left-1/4 w-120 h-120 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none dark:bg-blue-600/6" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* ── Header ── */}
        <div className="social-head flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200/80 pb-8 dark:border-white/[0.07]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 dark:bg-amber-300" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-300" />
              </span>
              <span className="text-amber-600 dark:text-amber-300 text-xs font-bold tracking-[0.3em] uppercase flex items-center gap-1.5">
                Media Sosial Resmi
              </span>
            </div>
            <h2
              id="social-heading"
              className="font-display text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight"
            >
              Instagram @makaroni.ikantawes
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl">
              Dokumentasi, aktivitas pabrik, dan pembaruan produk riil langsung dari akun Instagram resmi CV GASELA GROUP.
            </p>
          </div>

          <div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-[0.15em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all dark:from-amber-300 dark:to-amber-400 dark:text-zinc-950"
            >
              <Instagram className="w-4 h-4" />
              <span>Buka Instagram Resmi</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ── Streamlined Live Instagram Feed Widget ── */}
        <div className="social-widget rounded-3xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl overflow-hidden shadow-xl shadow-zinc-900/5 dark:bg-zinc-900/70 dark:border-white/10 dark:shadow-2xl p-4 md:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Live Feed Instagram
              </span>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-300">@makaroni.ikantawes</span>
          </div>

          {/* Embedded Live Instagram Profile Iframe Container */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-white p-1 shadow-md h-[560px]">
            <iframe
              src="https://www.instagram.com/makaroni.ikantawes/embed"
              title="Feed Instagram Makaroni Ikan Tawes"
              className="absolute inset-0 w-full h-full border-0 rounded-xl"
            />
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-zinc-500">
            <span>Tersambung langsung dengan server Instagram resmi</span>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-amber-600 dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              Lihat di Aplikasi Instagram <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
