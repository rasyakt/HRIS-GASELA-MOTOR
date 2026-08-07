'use client';

/**
 * ScrollAnimationSection.tsx
 * ─────────────────────────
 * The centerpiece pinned horizontal scrub section for CV GASELA GROUP.
 * Themes and colors matching the official corporate logo (Red & Blue).
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import {
  Car,
  Smartphone,
  Trophy,
  Cookie,
  ArrowRight,
  MapPin,
  Phone,
  CheckCircle2,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────

interface BusinessUnit {
  id: string;
  number: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  location: string;
  phone: string;
  services: string[];
  gradientBg: string;
  textColor: string;      // text-blue-400 or text-red-400
  badgeStyle: string;     // custom border/bg combination
  hoverBorder: string;    // hover border color
  topLineColor: string;   // top line gradient via-color
  watermarkHover: string; // large number hover text color
}

const BUSINESS_UNITS: BusinessUnit[] = [
  {
    id: 'motor',
    number: '01',
    name: 'Gasela Motor',
    category: 'OTOMOTIF & SERVIS',
    icon: Car,
    description:
      'Pusat perawatan kendaraan bermotor komprehensif — car service, car wash hidrolik, car saloon, dan penyedia suku cadang resmi terlengkap.',
    location: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 776103',
    services: ['Car Service', 'Car Wash & Salon', 'Genuine Spareparts', 'Layanan Otomotif'],
    gradientBg: 'from-blue-50/40 via-white/90 to-slate-50 dark:from-blue-950/40 dark:via-zinc-900/90 dark:to-zinc-950',
    textColor: 'text-blue-600 dark:text-blue-400',
    badgeStyle: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-500/50',
    topLineColor: 'via-blue-400/40 dark:via-blue-500/40',
    watermarkHover: 'group-hover:text-blue-500/5 dark:group-hover:text-blue-500/10',
  },
  {
    id: 'sellular',
    number: '02',
    name: 'Gasela Sellular & Plastik',
    category: 'RITEL & PERCETAKAN',
    icon: Smartphone,
    description:
      'Layanan ritel terpadu menyediakan voucher perdana & isi ulang, ATK, cetak photo, print data, fotocopy, laminating, plastik industri, dan bumbu pangan mentah.',
    location: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 2752592',
    services: ['Voucher & Telekomunikasi', 'Cetak Photo & Offset', 'Macam Ukuran Plastik', 'Bumbu Industri Pangan'],
    gradientBg: 'from-red-50/40 via-white/90 to-slate-50 dark:from-red-950/30 dark:via-zinc-900/90 dark:to-zinc-950',
    textColor: 'text-red-600 dark:text-red-400',
    badgeStyle: 'text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-400',
    hoverBorder: 'hover:border-red-300 dark:hover:border-red-500/50',
    topLineColor: 'via-red-400/40 dark:via-red-500/40',
    watermarkHover: 'group-hover:text-red-500/5 dark:group-hover:text-red-500/10',
  },
  {
    id: 'futsal',
    number: '03',
    name: 'Gasela Futsal Stadium',
    category: 'OLAHRAGA & COMPLEX',
    icon: Trophy,
    description:
      'Stadion futsal premium dengan rumput sintetis super gross 18×30 m², ditunjang mushola, kamar mandi air hangat, kantin & cafe, parkir luas, dan karaoke keluarga.',
    location: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 777000',
    services: ['Rumput Sintetis 18×30 m²', 'Kantin & Cafe Stadium', 'Kamar Mandi Air Hangat', 'Karaoke Keluarga'],
    gradientBg: 'from-blue-50/40 via-white/90 to-slate-50 dark:from-blue-950/40 dark:via-zinc-900/90 dark:to-zinc-950',
    textColor: 'text-blue-600 dark:text-blue-400',
    badgeStyle: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-500/50',
    topLineColor: 'via-blue-400/40 dark:via-blue-500/40',
    watermarkHover: 'group-hover:text-blue-500/5 dark:group-hover:text-blue-500/10',
  },
  {
    id: 'makaroni',
    number: '04',
    name: 'Makaroni Cap Ikan Tawes',
    category: 'INDUSTRI PANGAN',
    icon: Cookie,
    description:
      'Industri olahan pangan spesialis makaroni goreng dan maksor higienis. Varian rasa original, balado, keju, jagung bakar, rasa jeruk, dan super pedas.',
    location: 'JL. Tentara Pelajar, Kamp. Gunung Asih 1',
    phone: '(0265) 2751184',
    services: ['Makaroni Special Ikan Tawes', 'Maksor Extra Pedas', 'Varian Bumbu Spesial', 'Distribusi Skala Besar'],
    gradientBg: 'from-red-50/40 via-white/90 to-slate-50 dark:from-red-950/30 dark:via-zinc-900/90 dark:to-zinc-950',
    textColor: 'text-red-600 dark:text-red-400',
    badgeStyle: 'text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-400',
    hoverBorder: 'hover:border-red-300 dark:hover:border-red-500/50',
    topLineColor: 'via-red-400/40 dark:via-red-500/40',
    watermarkHover: 'group-hover:text-red-500/5 dark:group-hover:text-red-500/10',
  },
];

// ─────────────────────────────────────────────────────────────
// Sub-component: Unit Card
// ─────────────────────────────────────────────────────────────

function UnitCard({ unit }: { unit: BusinessUnit }) {
  const Icon = unit.icon;
  return (
    <Link
      href={`/landing/unit/${unit.id}`}
      className={`unit-card relative shrink-0 w-[82vw] sm:w-85 md:w-115 h-[65vh] min-h-[480px] max-h-[580px] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-linear-to-b ${unit.gradientBg} backdrop-blur-2xl overflow-hidden flex flex-col justify-between p-5 sm:p-6 md:p-8 transition-all duration-500 ${unit.hoverBorder} shadow-xl shadow-slate-200/50 dark:shadow-2xl group cursor-pointer hover:shadow-2xl hover:-translate-y-1`}
      style={{ willChange: 'transform, opacity' }}
      aria-label={`Lihat detail Unit Bisnis: ${unit.name}`}
    >
      {/* Top subtle highlight border line */}
      <div className={`absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent ${unit.topLineColor} to-transparent`} />

      {/* Large Watermark Index Number */}
      <span className={`absolute top-4 right-8 text-9xl font-black text-slate-100 dark:text-zinc-800/30 leading-none select-none tracking-tighter ${unit.watermarkHover} transition-colors`}>
        {unit.number}
      </span>

      {/* Card Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-zinc-800/90 border border-slate-100 dark:border-zinc-700/80 shadow-xs dark:shadow-none flex items-center justify-center ${unit.textColor} group-hover:scale-105 transition-all`}>
            <Icon className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <span className={`text-[9px] md:text-[10px] font-extrabold tracking-widest px-3 py-1.5 rounded-full uppercase border ${unit.badgeStyle}`}>
            {unit.category}
          </span>
        </div>

        <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 md:mb-4">{unit.name}</h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal leading-relaxed line-clamp-3">{unit.description}</p>
      </div>

      {/* Services Grid */}
      <div className="relative z-10 my-3 py-3 sm:my-4 sm:py-4 border-y border-slate-200 dark:border-zinc-800/80 grid grid-cols-1 gap-2">
        {unit.services.map((svc) => (
          <div key={svc} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-300">
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${unit.textColor}`} />
            <span className="font-medium line-clamp-1">{svc}</span>
          </div>
        ))}
      </div>

      {/* Card Footer */}
      <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-4">
        <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-400" />
            <span className="truncate block">{unit.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-400" />
            <span className="truncate block">{unit.phone}</span>
          </div>
        </div>

        {/* Small arrow indicator */}
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function ScrollAnimationSection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!triggerRef.current || !stageRef.current || !stripRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>('.unit-card');
      const cardCount = cards.length;

      const allItems = gsap.utils.toArray<HTMLElement>(stripRef.current.children);
      const stageWidth = window.innerWidth;
      const firstItemWidth = allItems[0]?.offsetWidth ?? 400;
      const lastItemWidth = allItems[allItems.length - 1]?.offsetWidth ?? 300;
      const gap = 32;

      let totalWidth = 0;
      allItems.forEach((el) => {
        totalWidth += el.offsetWidth;
      });
      totalWidth += gap * (allItems.length - 1);

      // Calculate start and end X to perfectly center the first and last items
      const startX = stageWidth / 2 - firstItemWidth / 2;
      const lastItemCenterOffset = totalWidth - lastItemWidth / 2;
      const endX = stageWidth / 2 - lastItemCenterOffset;

      // Independent animation for intro label (not scrubbed)
      gsap.fromTo(
        '.sa-intro-label',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: triggerRef.current,
            start: 'top 75%',
          },
        }
      );

      // Scrubbed horizontal scroll animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: stageRef.current,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        stripRef.current,
        { x: startX },
        {
          x: endX,
          ease: 'none',
          duration: 3,
        },
        0,
      );

      cards.forEach((card, i) => {
        if (i > 0) {
          const startAt = (i - 0.4) * (3 / cardCount);
          tl.fromTo(
            card,
            { opacity: 0.4, scale: 0.94 },
            { opacity: 1, scale: 1, duration: (3 / cardCount) * 0.8, ease: 'power2.out' },
            Math.max(0, startAt),
          );
        }
      });
    },
    { scope: triggerRef },
  );

  return (
    <div
      ref={triggerRef}
      className="relative bg-slate-50 dark:bg-zinc-950"
      style={{ height: '500vh' }}
      aria-label="Portofolio Bisnis Gasela Group"
    >
      <div
        ref={stageRef}
        className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between relative"
      >
        {/* HD Abstract Texture Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 dark:opacity-40 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: "url('/gasela_hd_texture.png')" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-50/50 via-slate-50/80 to-slate-50 dark:from-zinc-950 dark:via-zinc-950/80 dark:to-zinc-950 pointer-events-none" />

        {/* Ambient Grid Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />

        {/* Section Header */}
        <div className="relative z-10 shrink-0 pt-20 pb-4 px-6 md:px-16 lg:px-24">
          <div className="sa-intro-label flex items-center gap-3 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">
              Portofolio Bisnis Terpadu
            </span>
          </div>

          <h2 className="sa-intro-label text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-3xl">
            Lini Perusahaan{' '}
            <span className="text-slate-400 dark:text-zinc-500 font-extrabold">CV GASELA</span>
          </h2>
        </div>

        {/* Horizontal Card Strip */}
        <div className="flex-1 flex items-center overflow-hidden relative z-10">
          <div
            ref={stripRef}
            className="flex gap-8 w-max"
            style={{ willChange: 'transform' }}
          >
            {BUSINESS_UNITS.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}

            {/* Outro Summary Card */}
            <div className="shrink-0 w-64 h-[65vh] min-h-[480px] max-h-[580px] flex flex-col items-center justify-center p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur-xl text-center shadow-lg shadow-slate-200/50 dark:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-500/30 transition-colors">
              <div className="w-14 h-14 rounded-full border border-blue-500/30 dark:border-blue-500/40 bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <ArrowRight className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Terintegrasi Sempurna</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Kecamatan Cikoneng, Ciamis</p>
            </div>
          </div>
        </div>

        {/* Bottom Progress Bar - Red to Blue gradient */}
        <div className="shrink-0 h-1 bg-zinc-900 relative z-10">
          <div className="sa-progress-bar absolute inset-y-0 left-0 bg-linear-to-r from-blue-500 to-red-500 w-0 transition-all" />
        </div>
      </div>
    </div>
  );
}
