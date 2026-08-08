'use client';

/**
 * HeroSection.tsx
 * ───────────────
 * Cinematic full-screen hero for CV GASELA GROUP.
 * Fully theme-aware (light & dark): champagne-gold accents, Ken Burns
 * backdrop, animated stat counters and glassmorphism metric cards.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Building2, CalendarDays, Users2, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

const STATS = [
  {
    value: 4,
    suffix: '',
    label: 'Unit Bisnis',
    desc: 'Otomotif · Ritel · Futsal · Pangan',
    icon: Building2,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 30,
    suffix: '+',
    label: 'Tahun Berdiri',
    desc: 'Kiprah teruji sejak 1996',
    icon: CalendarDays,
    color: 'text-amber-500 dark:text-amber-300',
  },
  {
    value: 100,
    suffix: '+',
    label: 'Tenaga Kerja',
    desc: 'Roda ekonomi lokal berputar',
    icon: Users2,
    color: 'text-red-600 dark:text-red-400',
  },
  {
    value: 1,
    suffix: '',
    label: 'Ekosistem Terpadu',
    desc: 'Tata kelola HRIS modern',
    icon: LayoutGrid,
    color: 'text-blue-600 dark:text-blue-400',
  },
];

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.1 });

      tl
        // Slow Ken Burns background zoom
        .fromTo('.hero-bg', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.5, ease: 'power3.out' }, 0)
        // Headline stagger
        .fromTo(
          '.hero-word',
          { opacity: 0, y: 44 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out', stagger: 0.12 },
          0.35,
        )
        // Subtitle
        .fromTo('.hero-sub', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.85)
        // CTA buttons
        .fromTo(
          '.hero-cta',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08 },
          1.0,
        )
        // Glass stat cards
        .fromTo(
          '.hero-stat-card',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 },
          1.2,
        );

      // Animated counters
      STATS.forEach((stat, i) => {
        const el = counterRefs.current[i];
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 2.2,
          ease: 'power2.out',
          delay: 1.7,
          scrollTrigger: {
            trigger: el,
            start: 'top 95%',
            once: true,
          },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.val));
          },
        });
      });
    },
    { scope: heroRef },
  );

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 pt-36 md:pt-40 pb-28"
      aria-label="CV GASELA GROUP — Perkenalan perusahaan"
    >
      {/* ── Ultra-HD Background ── */}
      <div
        className="hero-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/gasela_hd_hero.png')" }}
        role="img"
        aria-label="Fasad korporat Gasela Group"
      />

      {/* ── Cinematic Overlays ── */}
      <div className="absolute inset-0 bg-linear-to-b from-zinc-50/95 via-zinc-50/80 to-zinc-50 dark:from-zinc-950/95 dark:via-zinc-950/70 dark:to-zinc-950" />
      <div className="absolute inset-0 bg-linear-to-r from-zinc-50/95 via-zinc-50/60 to-zinc-50/20 dark:from-zinc-950/95 dark:via-zinc-950/45 dark:to-zinc-950/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,119,6,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.09),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.12),transparent_55%)]" />

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-24 right-1/4 w-100 h-100 rounded-full bg-amber-400/15 dark:bg-amber-400/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-100 h-100 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[130px]" />

      {/* Micro-grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[64px_64px]" />

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-zinc-50 to-transparent dark:from-zinc-950 dark:to-transparent" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 w-full">
        {/* Headline */}
        <h1 className="mb-6 md:mb-8">
          <span className="hero-word block font-display text-6xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black leading-[0.95] tracking-[-0.02em] text-zinc-900 dark:text-white drop-shadow-sm dark:drop-shadow-2xl">
            CV GASELA
          </span>
          <span className="hero-word block font-display text-6xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black leading-[0.95] tracking-[-0.02em] text-transparent bg-clip-text bg-linear-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-200 dark:via-amber-300 dark:to-amber-500 drop-shadow-sm dark:drop-shadow-2xl">
            GROUP.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-sub max-w-2xl text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-10 md:mb-12">
          Empat lini bisnis unggulan — otomotif, ritel &amp; percetakan, arena olahraga, hingga industri pangan —
          dalam satu ekosistem terpadu dengan standar profesionalisme tinggi di Jawa Barat.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-14 md:mb-20">
          <a
            href="#portfolio"
            className="hero-cta group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-linear-to-r from-amber-500 to-amber-600 text-white font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 w-full sm:w-auto dark:from-amber-300 dark:via-amber-400 dark:to-amber-300 dark:text-zinc-950 dark:shadow-[0_10px_40px_-10px_rgba(251,191,36,0.6)] dark:hover:shadow-[0_12px_55px_-8px_rgba(251,191,36,0.8)]"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>Jelajahi Lini Bisnis</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <Link
            href="/login"
            className="hero-cta inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full border border-zinc-300 bg-white/90 text-zinc-700 font-bold text-sm uppercase tracking-[0.15em] backdrop-blur-md hover:border-zinc-400 hover:bg-white hover:text-zinc-900 transition-all duration-300 w-full sm:w-auto dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-200 dark:hover:border-white/30 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            Portal HRIS Karyawan
          </Link>
        </div>

        {/* ── Glass Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="hero-stat-card group relative p-6 rounded-2xl bg-white/75 border border-zinc-200/80 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-amber-500/40 hover:bg-white hover:-translate-y-1 shadow-lg shadow-zinc-900/5 dark:bg-white/4 dark:border-white/10 dark:hover:border-amber-300/30 dark:hover:bg-white/6 dark:shadow-xl dark:shadow-black/30"
              >
                {/* Glowing top line */}
                <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent dark:via-amber-300/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:scale-110 transition-transform dark:bg-white/5 dark:border-white/10 dark:text-zinc-300`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-500">{stat.label}</span>
                </div>

                <p className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight dark:text-white">
                  <span ref={(el) => { counterRefs.current[i] = el; }}>0</span>
                  <span className="text-amber-500 dark:text-amber-300">{stat.suffix}</span>
                </p>
                <p className="mt-1.5 text-xs text-zinc-500">{stat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-10">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">Scroll</span>
        <div className="h-12 w-px overflow-hidden bg-zinc-200 dark:bg-white/10">
          <div className="animate-scroll-cue h-4 w-full bg-linear-to-b from-transparent via-amber-500 to-amber-500 dark:via-amber-300 dark:to-amber-300" />
        </div>
      </div>
    </section>
  );
}
