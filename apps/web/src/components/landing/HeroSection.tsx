'use client';

/**
 * HeroSection.tsx
 * ───────────────
 * Executive hero section for CV GASELA GROUP.
 * Clean, authoritative corporate presentation with GSAP entrance,
 * animated KPI metrics, and high-contrast action CTAs.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Building2, CalendarDays, Users2, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useLandingContent } from './LandingContentProvider';

const STAT_ICONS = [Building2, CalendarDays, Users2, LayoutGrid];

export function HeroSection() {
  const { content } = useLandingContent();
  const hero = content.hero;
  const heroRef = useRef<HTMLElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.1 });

      tl
        // Subtle background zoom
        .fromTo(
          '.hero-bg',
          { scale: 1.05, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.8, ease: 'power2.out' },
          0,
        )
        // Headline and eyebrow stagger
        .fromTo(
          '.hero-word',
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 },
          0.2,
        )
        // Subtitle
        .fromTo(
          '.hero-sub',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          0.6,
        )
        // CTA buttons
        .fromTo(
          '.hero-cta',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08 },
          0.8,
        )
        // Metric cards
        .fromTo(
          '.hero-stat-card',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 },
          1.0,
        );

      // Animated counters
      hero.stats.forEach((stat, i) => {
        const el = counterRefs.current[i];
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 2.0,
          ease: 'power2.out',
          delay: 1.2,
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
      className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden bg-slate-50 dark:bg-zinc-950 pt-28 pb-16 md:pt-36 md:pb-20 border-b border-slate-200/80 dark:border-zinc-800/80"
      aria-label="CV GASELA GROUP — Profil Perusahaan"
    >
      {/* ── Background Photography ── */}
      <div
        className="hero-bg absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-30"
        style={{ backgroundImage: `url('${hero.backgroundImage}')` }}
        role="img"
        aria-label="Fasad korporat CV GASELA GROUP"
      />

      {/* ── Clean Architectural Overlays ── */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-50/90 via-slate-50/80 to-slate-50 dark:from-zinc-950/90 dark:via-zinc-950/85 dark:to-zinc-950" />

      {/* ── Main Content Container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full">
        {/* Corporate Location Kicker */}
        <p className="hero-word text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-3">
          Holding Perusahaan · Cikoneng, Ciamis
        </p>

        {/* Headline */}
        <h1 className="mb-5 max-w-4xl">
          <span className="hero-word block font-sans text-3xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-slate-950 dark:text-white">
            {hero.title} {hero.accent}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-sub max-w-2xl text-sm sm:text-base md:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed mb-8 font-normal">
          {hero.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-12 md:mb-14">
          <a
            href={hero.primaryCtaHref}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('portfolio');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.pushState(null, '', '/landing#portfolio');
              }
            }}
            className="hero-cta inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs transition-all duration-200 w-full sm:w-auto dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>{hero.primaryCtaLabel}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </a>
          <Link
            href={hero.secondaryCtaHref}
            className="hero-cta inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-xs sm:text-sm tracking-wide hover:bg-slate-100 hover:text-slate-950 hover:border-slate-400 transition-all duration-200 w-full sm:w-auto dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:text-white shadow-2xs"
          >
            {hero.secondaryCtaLabel}
          </Link>
        </div>

        {/* ── KPI Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hero.stats.map((stat, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length];
            return (
              <div
                key={stat.label}
                className="hero-stat-card p-5 rounded-xl bg-white/90 border border-slate-200/90 dark:bg-zinc-900/70 dark:border-zinc-800 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {stat.label}
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                  <span ref={(el) => { counterRefs.current[i] = el; }}>0</span>
                  <span className="text-amber-700 dark:text-amber-400">{stat.suffix}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

