'use client';

/**
 * AboutSection.tsx
 * ────────────────
 * Editorial corporate story section for CV GASELA GROUP.
 * Themes and colors matching the official corporate logo (Red & Blue).
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Award, Users2, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Integritas & Kepemimpinan',
    desc: 'Dirintis dari nol oleh Bpk. H. Didin Rojidin hingga berkembang pesat menjadi grup bisnis terpandang di Ciamis.',
    colorClass: 'text-blue-600 dark:text-blue-400',
    hoverClass: 'hover:border-blue-400/40 dark:hover:border-blue-500/40 shadow-blue-500/5',
  },
  {
    icon: Award,
    title: 'Standar Layanan Kualitas',
    desc: 'Komitmen mutu konsisten di seluruh sektor otomotif, ritel telekomunikasi, arena futsal, dan manufaktur pangan.',
    colorClass: 'text-red-600 dark:text-red-400',
    hoverClass: 'hover:border-red-400/40 dark:hover:border-red-500/40 shadow-red-500/5',
  },
  {
    icon: Users2,
    title: 'Pemberdayaan Ekonomi Lokal',
    desc: 'Menciptakan ratusan lapangan kerja dan mendorong percepatan roda ekonomi masyarakat Cikoneng & sekitarnya.',
    colorClass: 'text-blue-600 dark:text-blue-400',
    hoverClass: 'hover:border-blue-400/40 dark:hover:border-blue-500/40 shadow-blue-500/5',
  },
  {
    icon: Zap,
    title: 'Administrasi Terpadu',
    desc: 'Sistem tata kelola HRIS terintegrasi demi efisiensi, akurasi data karyawan, dan operasional modern.',
    colorClass: 'text-red-600 dark:text-red-400',
    hoverClass: 'hover:border-red-400/40 dark:hover:border-red-500/40 shadow-red-500/5',
  },
];

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.about-title',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about-title',
            start: 'top 85%',
          },
        },
      );

      gsap.fromTo(
        '.pillar-card',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: '.pillars-grid',
            start: 'top 85%',
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative bg-white dark:bg-zinc-950 py-32 px-6 md:px-16 lg:px-24 border-t border-slate-100 dark:border-zinc-900 overflow-hidden"
      aria-labelledby="about-heading"
    >
      {/* Background ambient glow matching logo blue */}
      <div className="absolute top-0 right-0 w-150 h-150 bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        
        {/* Editorial Story Header */}
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">
                BIOGRAFI & REPUTASI
              </span>
            </div>
            <h2
              id="about-heading"
              className="about-title text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
            >
              Merintis Sukses Dari Nol.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-6 text-slate-600 dark:text-zinc-300 text-base leading-relaxed font-normal bg-slate-50/80 dark:bg-zinc-900/40 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800/80 backdrop-blur-xl">
            <p>
              <strong className="text-slate-900 dark:text-white">CV GASELA GROUP</strong> merupakan entitas penggabungan 
              beberapa cabang perusahaan strategis yang berbasis di kawasan Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat. 
              Dipimpin langsung oleh <strong className="text-slate-900 dark:text-white">Bpk. H. Didin Rojidin</strong> sebagai Owner sekaligus Direktur Perusahaan.
            </p>
            <p>
              Beliau adalah sosok pengusaha muda yang sukses merintis usaha dari titik awal hingga mencapai keberhasilan sejak usia masih menginjak kepala dua. 
              Kini CV GASELA menaungi empat unit bisnis utama: <span className="text-blue-600 dark:text-blue-400 font-semibold">Gasela Motor</span>,{' '}
              <span className="text-red-600 dark:text-red-400 font-semibold">Gasela Sellular & Plastik</span>,{' '}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Gasela Futsal Stadium</span>, serta industri pangan{' '}
              <span className="text-red-600 dark:text-red-400 font-semibold">Makaroni Spesial Cap Ikan Tawes</span>.
            </p>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="pillars-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className={`pillar-card relative p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 backdrop-blur-xl space-y-4 ${pillar.hoverClass} transition-all duration-300 group shadow-lg shadow-slate-200/50 dark:shadow-xl`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60 flex items-center justify-center ${pillar.colorClass} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{pillar.title}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-normal">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
