'use client';

/**
 * ContactSection.tsx
 * ──────────────────
 * Luxury contact directory for CV GASELA GROUP.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

const OFFICES = [
  {
    name: 'Gasela Motor',
    address: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 776103',
    services: 'Car Service, Wash, Saloon & Spareparts',
    dot: 'bg-blue-400',
  },
  {
    name: 'Gasela Sellular & Plastik',
    address: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 2752592',
    services: 'Voucher, Percetakan, ATK & Plastik',
    dot: 'bg-red-400',
  },
  {
    name: 'Gasela Futsal Stadium',
    address: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 777000',
    services: 'Rumput Sintetis, Cafe & Karaoke',
    dot: 'bg-blue-400',
  },
  {
    name: 'Makaroni Cap Ikan Tawes',
    address: 'JL. Tentara Pelajar, Gunung Asih 1',
    phone: '(0265) 2751184',
    services: 'Industri Pangan & Makaroni Goreng',
    dot: 'bg-red-400',
  },
];

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.contact-head',
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-head', start: 'top 85%' },
        },
      );

      gsap.fromTo(
        '.contact-card',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.09,
          scrollTrigger: { trigger: '.contact-grid', start: 'top 85%' },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative bg-zinc-950 py-32 px-6 md:px-12 lg:px-24 border-t border-white/[0.06] overflow-hidden"
      aria-labelledby="contact-heading"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/3 w-150 h-150 bg-amber-400/[0.05] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-125 h-125 bg-blue-600/[0.07] rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* ── Header ── */}
        <div className="contact-head flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.07] pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
              </span>
              <span className="text-amber-300 text-xs font-bold tracking-[0.3em] uppercase">
                Direktori Sekretariat
              </span>
            </div>
            <h2
              id="contact-heading"
              className="font-display text-4xl md:text-5xl font-black text-white tracking-tight"
            >
              Hubungi Cabang Perusahaan.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="mailto:gaselafutsal@gmail.com"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-linear-to-r from-amber-300 via-amber-400 to-amber-300 text-zinc-950 font-black text-sm uppercase tracking-[0.15em] shadow-[0_10px_40px_-10px_rgba(251,191,36,0.6)] hover:shadow-[0_12px_55px_-8px_rgba(251,191,36,0.8)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Mail className="w-4 h-4" />
              <span>Email Resmi</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full border border-white/15 bg-white/[0.03] text-zinc-200 font-bold text-sm uppercase tracking-[0.15em] hover:border-white/30 hover:bg-white/[0.07] hover:text-white transition-all duration-300"
            >
              Portal HRIS Karyawan
            </Link>
          </div>
        </div>

        {/* ── Office Grid ── */}
        <div className="contact-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {OFFICES.map((office) => (
            <div
              key={office.name}
              className="contact-card group relative p-7 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-amber-300/25 hover:bg-white/[0.05] hover:-translate-y-1 shadow-xl shadow-black/30"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-amber-300/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-black text-white tracking-tight">{office.name}</h3>
                <span className={`w-2 h-2 rounded-full ${office.dot} shadow-[0_0_12px_rgba(251,191,36,0.4)]`} />
              </div>

              <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-5">{office.services}</p>

              <div className="space-y-3 pt-5 border-t border-white/[0.07] text-xs text-zinc-400">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-amber-300/80" />
                  </span>
                  <span className="truncate font-medium">{office.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-amber-300/80" />
                  </span>
                  <span className="font-medium">{office.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sekretariat Band ── */}
        <div className="contact-card p-8 md:p-10 rounded-2xl border border-amber-300/20 bg-linear-to-r from-amber-300/[0.06] via-transparent to-blue-500/[0.06] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-xl shadow-black/30">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-300/10 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300 mb-1.5">
                Sekretariat Utama Grup
              </p>
              <p className="text-white font-bold text-lg tracking-tight">JL. Raya Cikoneng - Ciamis, Jawa Barat</p>
              <p className="text-zinc-500 text-sm mt-1">
                Kecamatan Cikoneng, Kabupaten Ciamis — Indonesia
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:justify-end">
            <a
              href="tel:+62265776103"
              className="inline-flex items-center gap-2 text-sm font-bold text-white border border-white/15 bg-white/[0.04] px-5 py-3 rounded-full hover:border-amber-300/40 hover:text-amber-200 transition-all duration-300"
            >
              <Phone className="w-4 h-4 text-amber-300" />
              (0265) 776103
            </a>
            <a
              href="mailto:gaselafutsal@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-bold text-white border border-white/15 bg-white/[0.04] px-5 py-3 rounded-full hover:border-amber-300/40 hover:text-amber-200 transition-all duration-300"
            >
              <Mail className="w-4 h-4 text-amber-300" />
              gaselafutsal@gmail.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
