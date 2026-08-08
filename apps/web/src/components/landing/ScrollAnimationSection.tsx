'use client';

/**
 * ScrollAnimationSection.tsx
 * ─────────────────────────
 * The centerpiece pinned horizontal scrub section for CV GASELA GROUP.
 * Luxury glass cards featuring unit photography, gold accents and
 * a scrubbed progress rail. Fully theme-aware (light & dark).
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import Image from 'next/image';
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
  image: string;
  textColor: string;
}

const BUSINESS_UNITS: BusinessUnit[] = [
  {
    id: 'motor',
    number: '01',
    name: 'Gasela Motor',
    category: 'Otomotif & Servis',
    icon: Car,
    description:
      'Pusat perawatan kendaraan komprehensif — car service, car wash hidrolik, car saloon, dan suku cadang resmi terlengkap.',
    location: 'Jl. Raya Cikoneng No.135, Cikoneng, Ciamis',
    phone: '(0265) 776103',
    services: ['Car Service', 'Car Wash & Salon', 'Genuine Spareparts', 'Layanan Otomotif'],
    image: '/gasela_hd_motor.png',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'sellular',
    number: '02',
    name: 'Gasela Sellular & Plastik',
    category: 'Ritel & Percetakan',
    icon: Smartphone,
    description:
      'Ritel terpadu: voucher perdana & isi ulang, ATK, cetak photo, fotocopy, laminating, plastik industri, dan bumbu pangan.',
    location: 'Jalan Raya, Cikoneng, Ciamis',
    phone: '(0265) 2752592',
    services: ['Voucher & Telekomunikasi', 'Cetak Photo & Offset', 'Macam Ukuran Plastik', 'Bumbu Industri Pangan'],
    image: '/gasela_hd_sellular.png',
    textColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'futsal',
    number: '03',
    name: 'Gasela Futsal Stadium',
    category: 'Olahraga & Complex',
    icon: Trophy,
    description:
      'Stadion futsal premium rumput sintetis super grass 18×30 m², mushola, kamar mandi air hangat, kantin & cafe, parkir luas.',
    location: 'Jl. Raya Cikoneng, Cikoneng, Ciamis',
    phone: '(0265) 777000',
    services: ['Rumput Sintetis 18×30 m²', 'Kantin & Cafe Stadium', 'Kamar Mandi Air Hangat', 'Karaoke Keluarga'],
    image: '/gasela_hd_futsal.png',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'makaroni',
    number: '04',
    name: 'Makaroni Cap Ikan Tawes',
    category: 'Industri Pangan',
    icon: Cookie,
    description:
      'Industri olahan pangan spesialis makaroni goreng dan maksor higienis. Varian original, balado, keju, jagung bakar, dan super pedas.',
    location: 'Jl. Tentara Pelajar No.165, Cikoneng, Ciamis',
    phone: '(0265) 2751184',
    services: ['Makaroni Special Ikan Tawes', 'Maksor Extra Pedas', 'Varian Bumbu Spesial', 'Distribusi Skala Besar'],
    image: '/gasela_hd_makaroni.png',
    textColor: 'text-red-600 dark:text-red-400',
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
      className={`unit-card relative shrink-0 w-[82vw] sm:w-85 md:w-105 h-[60vh] min-h-105 max-h-135 rounded-3xl border border-zinc-200/80 bg-white/85 backdrop-blur-2xl overflow-hidden flex flex-col transition-all duration-500 hover:border-amber-500/40 hover:-translate-y-1.5 shadow-xl shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-900/70 dark:hover:border-amber-300/30 dark:shadow-2xl dark:shadow-black/50 group cursor-pointer`}
      style={{ willChange: 'transform, opacity' }}
      aria-label={`Lihat detail Unit Bisnis: ${unit.name}`}
    >
      {/* ── Image Header ── */}
      <div className="relative h-36 md:h-44 shrink-0 overflow-hidden">
        <Image
          src={unit.image}
          alt={unit.name}
          fill
          sizes="(max-width: 640px) 82vw, 30rem"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-50/50 via-transparent to-transparent dark:from-zinc-900 dark:via-zinc-900/25 dark:to-transparent" />

        {/* Watermark number */}
        <span className="absolute top-4 right-6 font-display text-6xl font-black text-zinc-900/10 leading-none select-none tracking-tight dark:text-amber-200/25">
          {unit.number}
        </span>

        {/* Category badge */}
        <span className="absolute bottom-4 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/40 bg-white/85 backdrop-blur-md text-[9px] font-extrabold uppercase tracking-[0.22em] text-amber-700 dark:border-amber-300/30 dark:bg-zinc-950/70 dark:text-amber-200">
          <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-300" />
          {unit.category}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="relative flex-1 flex flex-col justify-between p-4 md:p-6">
        <div>
          <div className="flex items-start gap-3 md:gap-4 mb-2 md:mb-3">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:scale-105 group-hover:border-amber-500/30 transition-all dark:bg-white/[0.05] dark:border-white/10 dark:text-zinc-300 dark:group-hover:border-amber-300/30`}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="font-display text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight pt-1">
              {unit.name}
            </h3>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">{unit.description}</p>
        </div>

        {/* Services */}
        <div className="my-2.5 py-2.5 border-y border-zinc-200/80 grid grid-cols-1 gap-1.5 dark:border-white/[0.07]">
          {unit.services.map((svc) => (
            <div key={svc} className="flex items-center gap-2 text-[11px] md:text-xs text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className={`w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500`} />
              <span className="font-medium line-clamp-1">{svc}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-600" />
              <span className="truncate block">{unit.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-600" />
              <span className="truncate block">{unit.phone}</span>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 dark:bg-white/[0.06] dark:border-white/10 dark:text-zinc-400 dark:group-hover:bg-linear-to-r dark:group-hover:from-amber-300 dark:group-hover:to-amber-400 dark:group-hover:text-zinc-950">
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
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

      // Perfectly center the first and last items at the pin start/end
      const startX = stageWidth / 2 - firstItemWidth / 2;
      const lastItemCenterOffset = totalWidth - lastItemWidth / 2;
      const endX = stageWidth / 2 - lastItemCenterOffset;

      // Independent intro label animation (not scrubbed)
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
        },
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

      tl.fromTo(stripRef.current, { x: startX }, { x: endX, ease: 'none', duration: 3 }, 0);

      // Progress rail
      tl.fromTo('.sa-progress-bar', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 3 }, 0);

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
      className="relative bg-zinc-50 dark:bg-zinc-950"
      style={{ height: '500vh' }}
      aria-label="Portofolio Bisnis Gasela Group"
    >
      <div
        ref={stageRef}
        className="h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between relative"
      >
        {/* HD Abstract Texture Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.05] mix-blend-luminosity pointer-events-none dark:opacity-15"
          style={{ backgroundImage: "url('/gasela_hd_texture.png')" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-50/60 via-zinc-50/85 to-zinc-50 pointer-events-none dark:from-zinc-950/60 dark:via-zinc-950/85 dark:to-zinc-950" />

        {/* Ambient Grid Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />
        <div className="pointer-events-none absolute top-1/4 right-0 w-125 h-125 bg-amber-400/10 rounded-full blur-[130px] dark:bg-amber-400/[0.05]" />
        <div className="pointer-events-none absolute bottom-1/4 left-0 w-125 h-125 bg-blue-500/10 rounded-full blur-[130px] dark:bg-blue-600/[0.08]" />

        {/* Section Header */}
        <div className="relative z-10 shrink-0 pt-24 pb-5 px-6 md:px-12 lg:px-24">
          <div className="sa-intro-label flex items-center gap-3 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 dark:bg-amber-300" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-300" />
            </span>
            <span className="text-amber-600 dark:text-amber-300 text-xs font-bold tracking-[0.3em] uppercase">
              Portofolio Bisnis Terpadu
            </span>
          </div>

          <h2 className="sa-intro-label font-display text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight max-w-3xl">
            Lini Perusahaan{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-600 to-amber-500 dark:from-amber-200 dark:to-amber-500">
              CV GASELA
            </span>
          </h2>
        </div>

        {/* Horizontal Card Strip */}
        <div className="flex-1 flex items-center overflow-visible relative z-10">
          <div ref={stripRef} className="flex gap-8 w-max" style={{ willChange: 'transform' }}>
            {BUSINESS_UNITS.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}

            {/* Outro Summary Card */}
            <div className="shrink-0 w-72 h-[60vh] min-h-105 max-h-135 flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl border border-amber-500/30 bg-linear-to-b from-amber-500/6 to-transparent backdrop-blur-xl text-center shadow-xl shadow-zinc-900/5 hover:border-amber-500/60 transition-colors dark:border-amber-300/25 dark:from-amber-300/8 dark:to-transparent dark:shadow-2xl dark:shadow-black/50 dark:hover:border-amber-300/50">
              <div className="w-16 h-16 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center mb-5 text-amber-600 shadow-[0_0_40px_-8px_rgba(217,119,6,0.35)] dark:border-amber-300/40 dark:bg-amber-300/10 dark:text-amber-300 dark:shadow-[0_0_40px_-8px_rgba(251,191,36,0.5)]">
                <ArrowRight className="w-7 h-7" />
              </div>
              <p className="font-display text-2xl font-black text-zinc-900 tracking-tight dark:text-white">
                Terintegrasi Sempurna
              </p>
              <p className="text-xs text-zinc-500 mt-3">Kecamatan Cikoneng, Kabupaten Ciamis</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mt-6 dark:text-amber-300/80">
                Sejak 1996
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Progress Rail */}
        <div className="shrink-0 h-[3px] bg-zinc-200 relative z-10 overflow-hidden dark:bg-white/[0.06]">
          <div className="sa-progress-bar absolute inset-y-0 left-0 right-0 origin-left bg-linear-to-r from-amber-500 via-amber-400 to-blue-600 dark:from-amber-400 dark:via-amber-300 dark:to-blue-500 scale-x-0" />
        </div>
      </div>
    </div>
  );
}
