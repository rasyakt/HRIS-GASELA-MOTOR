'use client';

/**
 * AboutSection.tsx
 * ────────────────
 * Editorial corporate story for CV GASELA GROUP:
 * narrative, founder profile, company journey timeline and core values.
 * Fully theme-aware (light & dark).
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Award, Users2, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const TIMELINE = [
  {
    year: '1996',
    title: 'Makaroni Cap Ikan Tawes',
    desc: 'Industri rumahan yang menjadi cikal bakal CV GASELA. Di tengah krisis moneter 1998, permintaan justru melonjak signifikan.',
    accent: 'text-amber-600 dark:text-amber-300',
  },
  {
    year: '2008',
    title: 'Gasela Motor & Sellular',
    desc: 'Ekspansi besar ke sektor otomotif dan ritel di JL. Raya Cikoneng-Ciamis, menandai lahirnya grup multi-bisnis.',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    year: '2012',
    title: 'Gasela Futsal Stadium',
    desc: 'Arena futsal rumput sintetis kelas premium — dijuluki lapangan termegah di kawasan Priangan Timur.',
    accent: 'text-red-600 dark:text-red-400',
  },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Integritas & Kepemimpinan',
    desc: 'Dirintis dari nol oleh Bpk. H. Didin Rojidin hingga menjadi grup bisnis terpandang di Ciamis.',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Award,
    title: 'Standar Kualitas Premium',
    desc: 'Komitmen mutu konsisten di seluruh sektor otomotif, ritel, arena futsal, dan manufaktur pangan.',
    color: 'text-red-600 dark:text-red-400',
  },
  {
    icon: Users2,
    title: 'Pemberdayaan Lokal',
    desc: 'Menciptakan ratusan lapangan kerja dan mendorong percepatan roda ekonomi masyarakat Cikoneng.',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Zap,
    title: 'Administrasi Terpadu',
    desc: 'Tata kelola HRIS terintegrasi demi efisiensi, akurasi data, dan operasional yang modern.',
    color: 'text-red-600 dark:text-red-400',
  },
];

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.about-title',
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about-title', start: 'top 85%' },
        },
      );

      gsap.fromTo(
        '.about-copy',
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about-copy', start: 'top 88%' },
        },
      );

      gsap.fromTo(
        '.timeline-item',
        { opacity: 0, x: 28 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.14,
          scrollTrigger: { trigger: '.timeline', start: 'top 80%' },
        },
      );

      gsap.fromTo(
        '.pillar-card',
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '.pillars-grid', start: 'top 85%' },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative bg-zinc-50 dark:bg-zinc-950 py-32 px-6 md:px-12 lg:px-24 overflow-hidden"
      aria-labelledby="about-heading"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-150 h-150 bg-blue-500/10 rounded-full blur-[150px] pointer-events-none dark:bg-blue-600/10" />
      <div className="absolute bottom-1/3 -left-32 w-125 h-125 bg-amber-400/15 rounded-full blur-[140px] pointer-events-none dark:bg-amber-400/[0.06]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ── Story + Founder ── */}
        <div className="grid lg:grid-cols-12 gap-14 lg:gap-16 items-start">
          {/* Narrative */}
          <div className="lg:col-span-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 dark:bg-amber-300" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-300" />
              </span>
              <span className="text-amber-600 dark:text-amber-300 text-xs font-bold tracking-[0.3em] uppercase">
                Biografi &amp; Reputasi
              </span>
            </div>

            <h2
              id="about-heading"
              className="about-title font-display text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.05] mb-8"
            >
              Merintis Sukses
              <br />
              Dari{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-600 to-amber-500 dark:from-amber-200 dark:to-amber-500">
                Nol.
              </span>
            </h2>

            <div className="about-copy space-y-5 text-zinc-600 dark:text-zinc-400 leading-relaxed text-[15px]">
              <p>
                <strong className="text-zinc-900 dark:text-white font-bold">CV GASELA GROUP</strong> merupakan entitas
                penggabungan beberapa cabang perusahaan strategis yang berbasis di kawasan Kecamatan Cikoneng,
                Kabupaten Ciamis, Jawa Barat. Dipimpin langsung oleh{' '}
                <strong className="text-zinc-900 dark:text-white font-bold">Bpk. H. Didin Rojidin</strong> sebagai
                Owner sekaligus Direktur Perusahaan.
              </p>
              <p>
                Beliau adalah sosok pengusaha muda yang sukses merintis usaha dari titik awal hingga mencapai
                keberhasilan sejak usia menginjak kepala dua. Kini CV GASELA menaungi empat unit bisnis utama:{' '}
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Gasela Motor</span>,{' '}
                <span className="text-red-600 dark:text-red-400 font-semibold">Gasela Sellular &amp; Plastik</span>,{' '}
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Gasela Futsal Stadium</span>, serta
                industri pangan{' '}
                <span className="text-red-600 dark:text-red-400 font-semibold">Makaroni Spesial Cap Ikan Tawes</span>.
              </p>
            </div>

            {/* Founder card */}
            <div className="about-copy mt-10 p-7 rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl flex items-center gap-5 shadow-lg shadow-zinc-900/5 hover:border-amber-500/30 transition-colors duration-300 dark:bg-white/[0.03] dark:border-white/10 dark:hover:border-amber-300/25 dark:shadow-xl dark:shadow-black/30">
              <div className="relative shrink-0 w-16 h-16 rounded-full bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(217,119,6,0.5)] dark:from-amber-300 dark:to-amber-500 dark:shadow-[0_10px_30px_-8px_rgba(251,191,36,0.6)]">
                <span className="font-display text-xl font-black text-white dark:text-zinc-950">DR</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-white dark:border-zinc-950" />
              </div>
              <div>
                <p className="text-zinc-900 dark:text-white font-bold text-base tracking-tight">H. Didin Rojidin</p>
                <p className="text-amber-600 dark:text-amber-300 text-[11px] font-bold uppercase tracking-[0.22em] mt-1">
                  Owner &amp; Direktur Utama
                </p>
                <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">
                  &ldquo;Membangun kepercayaan lebih dulu, keuntungan mengikuti kemudian.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-6">
            <div className="timeline relative pl-8 md:pl-10 space-y-10">
              {/* Vertical line */}
              <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-px bg-linear-to-b from-amber-500/60 via-zinc-300 to-red-500/40 dark:from-amber-300/60 dark:via-white/15 dark:to-red-500/50" />

              {TIMELINE.map((item) => (
                <div key={item.year} className="timeline-item relative">
                  {/* Node dot */}
                  <span className="absolute -left-8 md:-left-10 top-1.5 flex h-[15px] w-[15px] -translate-x-1/2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500/40 animate-ping opacity-60 dark:bg-amber-300/40" />
                    <span className="relative inline-flex rounded-full h-[15px] w-[15px] bg-linear-to-br from-amber-500 to-amber-600 shadow-[0_0_16px_rgba(217,119,6,0.5)] dark:from-amber-300 dark:to-amber-500 dark:shadow-[0_0_16px_rgba(251,191,36,0.55)]" />
                  </span>

                  <div className="group p-6 rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl hover:border-amber-500/30 hover:bg-white transition-all duration-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-amber-300/25 dark:hover:bg-white/[0.05] dark:shadow-xl dark:shadow-black/20">
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className={`font-display text-2xl font-black tracking-tight ${item.accent}`}>
                        {item.year}
                      </span>
                      <span className="h-px flex-1 bg-linear-to-r from-zinc-300 to-transparent dark:from-white/15 dark:to-transparent" />
                    </div>
                    <h3 className="text-zinc-900 dark:text-white font-bold text-lg tracking-tight mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Core Values ── */}
        <div className="pillars-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-24">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="pillar-card group relative p-7 rounded-2xl bg-white/80 border border-zinc-200/80 backdrop-blur-xl space-y-4 overflow-hidden transition-all duration-500 hover:border-amber-500/30 hover:bg-white hover:-translate-y-1 shadow-lg shadow-zinc-900/5 dark:bg-white/3 dark:border-white/8 dark:hover:border-amber-300/25 dark:hover:bg-white/5 dark:shadow-xl dark:shadow-black/30"
              >
                <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:via-amber-300/40" />

                <div
                  className={`w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-300 dark:bg-white/5 dark:border-white/10 dark:text-zinc-300 dark:group-hover:border-amber-300/30`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{pillar.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
