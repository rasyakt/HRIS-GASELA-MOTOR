'use client';

/**
 * HeroSection.tsx
 * ───────────────
 * Full-screen hero section for CV GASELA GROUP.
 * Features an ultra-HD luxury corporate architectural background, rich glassmorphism panels,
 * ambient emerald lighting, and high-value corporate presentation.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, MapPin, Building2, ShieldCheck, LayoutGrid, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.1 });

      tl
        // Slow Ken Burns background zoom
        .fromTo('.hero-bg', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 0.75, duration: 2.5, ease: 'power3.out' }, 0)
        // Headline stagger
        .fromTo(
          '.hero-word',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out', stagger: 0.08 },
          0.4,
        )
        // Subtitle
        .fromTo('.hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.8)
        // Actions
        .fromTo('.hero-cta', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08 }, 1.0)
        // Glass stat cards
        .fromTo('.hero-stat-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }, 1.2);
    },
    { scope: heroRef },
  );

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-slate-50 dark:bg-zinc-950 pt-20 pb-10 md:pt-24 md:pb-16"
      aria-label="CV GASELA GROUP hero introduction"
    >
      {/* ── Ultra-HD Background Image ── */}
      <div
        className="hero-bg absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
        style={{ backgroundImage: "url('/gasela_hd_hero.png')" }}
        role="img"
        aria-label="Gasela Group ultra HD corporate facade"
      />

      {/* ── Multi-Layered Cinematic Dark Gradients ── */}
      <div className="absolute inset-0 bg-linear-to-b from-white via-slate-50/90 to-slate-100 dark:from-zinc-950/90 dark:via-zinc-950/70 dark:to-zinc-950" />
      <div className="absolute inset-0 bg-linear-to-r from-slate-50 via-white/60 dark:from-zinc-950 dark:via-zinc-950/80 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.12),transparent_60%)]" />

      {/* Ambient Glow Orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/3 w-125 h-125 rounded-full bg-blue-600/5 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full bg-red-600/5 blur-[100px]" />

      {/* Micro-grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[64px_64px]" />

      {/* ── Content Container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 lg:px-24 w-full">
        
        {/* Main Headline */}
        <div className="max-w-4xl mb-6 md:mb-8 mt-4 md:mt-0">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tighter text-slate-900 dark:text-white drop-shadow-xl dark:drop-shadow-2xl">
            <span className="hero-word block text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-linear-to-r dark:from-white dark:via-zinc-300 dark:to-zinc-500">CV GASELA</span>
            <span className="hero-word block text-transparent bg-clip-text bg-linear-to-r from-blue-500 via-blue-400 to-red-500 font-extrabold">
              GROUP.
            </span>
          </h1>
        </div>

        {/* Subtitle & Value Statement */}
        <p className="hero-sub max-w-2xl text-base md:text-xl text-slate-600 dark:text-zinc-300 font-medium dark:font-normal leading-relaxed mb-8 md:mb-10 drop-shadow-xs dark:drop-shadow-sm">
          Ekosistem terintegrasi yang menaungi 4 bidang usaha unggulan — otomotif, ritel, arena olahraga, 
          dan manufaktur pangan dalam satu standar profesionalisme tinggi di Jawa Barat.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10 md:mb-16">
          <a
            href="#portfolio"
            className="hero-cta group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-blue-600 text-white font-extrabold text-sm tracking-wide hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-500/20 active:scale-[0.98] w-full sm:w-auto"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>Jelajahi Lini Bisnis</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <Link
            href="/login"
            className="hero-cta inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border border-slate-300 bg-white/90 text-slate-700 font-semibold text-sm tracking-wide hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white transition-all duration-200 backdrop-blur-md shadow-md shadow-slate-200/50 dark:shadow-none w-full sm:w-auto"
          >
            <span>Portal HRIS Karyawan</span>
          </Link>
        </div>

        {/* ── Glassmorphism Metric Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Unit Bisnis', value: '4 Sektor Utama', desc: 'Otomotif, Ritel, Futsal, Pangan', icon: Building2, color: 'text-blue-400' },
            { label: 'Pusat Operasional', value: 'Cikoneng, Ciamis', desc: 'JL. Raya Cikoneng-Ciamis', icon: MapPin, color: 'text-red-400' },
            { label: 'Direktur Utama', value: 'H. Didin Rojidin', desc: 'Owner & Pemimpin Perusahaan', icon: ShieldCheck, color: 'text-blue-400' },
            { label: 'Pertumbuhan', value: 'Terintegrasi', desc: 'Manajemen HRIS Modern', icon: TrendingUp, color: 'text-red-400' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="hero-stat-card relative p-5 sm:p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/80 backdrop-blur-xl hover:border-blue-300 dark:hover:border-blue-500/40 transition-all duration-300 group shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-row items-center sm:flex-col sm:items-start gap-4 sm:gap-0"
              >
                {/* Glowing subtle top line */}
                <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                
                <div className={`w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-center sm:mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold tracking-widest text-slate-500 dark:text-zinc-500 uppercase mb-0.5 sm:mb-1">{item.label}</p>
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1">{item.value}</p>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium dark:font-normal leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
