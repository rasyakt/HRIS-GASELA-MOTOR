'use client';

/**
 * ContactSection.tsx
 * ──────────────────
 * Sleek corporate office matrix & contact section for CV GASELA GROUP.
 * Themes and colors matching the official corporate logo (Red & Blue).
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
    accentColor: 'bg-blue-500',
    hoverBorder: 'hover:border-blue-400/40 dark:hover:border-blue-500/40 shadow-blue-500/5',
  },
  {
    name: 'Gasela Sellular & Plastik',
    address: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 2752592',
    services: 'Voucher, Percetakan, ATK & Plastik',
    accentColor: 'bg-red-500',
    hoverBorder: 'hover:border-red-400/40 dark:hover:border-red-500/40 shadow-red-500/5',
  },
  {
    name: 'Gasela Futsal Stadium',
    address: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 777000',
    services: 'Rumput Sintetis, Cafe & Karaoke',
    accentColor: 'bg-blue-500',
    hoverBorder: 'hover:border-blue-400/40 dark:hover:border-blue-500/40 shadow-blue-500/5',
  },
  {
    name: 'Makaroni Cap Ikan Tawes',
    address: 'JL. Tentara Pelajar, Kamp. Gunung Asih 1',
    phone: '(0265) 2751184',
    services: 'Industri Pangan & Makaroni Goreng',
    accentColor: 'bg-red-500',
    hoverBorder: 'hover:border-red-400/40 dark:hover:border-red-500/40 shadow-red-500/5',
  },
];

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.contact-card',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: '.contact-grid',
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
      id="contact"
      className="relative bg-slate-50 dark:bg-zinc-950 py-32 px-6 md:px-16 lg:px-24 border-t border-slate-200 dark:border-zinc-900 overflow-hidden"
      aria-labelledby="contact-heading"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 dark:border-zinc-900 pb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">
                DIREKTORI SEKRETARIAT
              </span>
            </div>
            <h2
              id="contact-heading"
              className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              Hubungi Cabang Perusahaan.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="mailto:gaselafutsal@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
            >
              <Mail className="w-4 h-4" />
              <span>Email Resmi</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white transition-all shadow-sm"
            >
              Portal HRIS Karyawan
            </Link>
          </div>
        </div>

        {/* Office Grid */}
        <div className="contact-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {OFFICES.map((office) => (
            <div
              key={office.name}
              className={`contact-card p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 space-y-4 ${office.hoverBorder} transition-colors shadow-lg shadow-slate-200/50 dark:shadow-none`}
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{office.name}</h3>
              
              <p className="text-xs text-slate-500 dark:text-zinc-500 font-normal">{office.services}</p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60 text-xs text-slate-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <span className="truncate">{office.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <span>{office.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
