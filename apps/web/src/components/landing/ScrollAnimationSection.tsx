'use client';

/**
 * ScrollAnimationSection.tsx
 * ─────────────────────────
 * The centerpiece pinned horizontal scrub section for CV GASELA GROUP.
 * Luxury glass cards featuring unit photography, gold accents and
 * a scrubbed progress rail.
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
    location: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 776103',
    services: ['Car Service', 'Car Wash & Salon', 'Genuine Spareparts', 'Layanan Otomotif'],
    image: '/gasela_hd_motor.png',
    textColor: 'text-blue-400',
  },
  {
    id: 'sellular',
    number: '02',
    name: 'Gasela Sellular & Plastik',
    category: 'Ritel & Percetakan',
    icon: Smartphone,
    description:
      'Ritel terpadu: voucher perdana & isi ulang, ATK, cetak photo, fotocopy, laminating, plastik industri, dan bumbu pangan.',
    location: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 2752592',
    services: ['Voucher & Telekomunikasi', 'Cetak Photo & Offset', 'Macam Ukuran Plastik', 'Bumbu Industri Pangan'],
    image: '/gasela_hd_sellular.png',
    textColor: 'text-red-400',
  },
  {
    id: 'futsal',
    number: '03',
    name: 'Gasela Futsal Stadium',
    category: 'Olahraga & Complex',
    icon: Trophy,
    description:
      'Stadion futsal premium rumput sintetis super grass 18×30 m², mushola, kamar mandi air hangat, kantin & cafe, parkir luas.',
    location: 'JL. Raya Cikoneng-Ciamis',
    phone: '(0265) 777000',
    services: ['Rumput Sintetis 18×30 m²', 'Kantin & Cafe Stadium', 'Kamar Mandi Air Hangat', 'Karaoke Keluarga'],
    image: '/gasela_hd_futsal.png',
    textColor: 'text-blue-400',
  },
  {
    id: 'makaroni',
    number: '04',
    name: 'Makaroni Cap Ikan Tawes',
    category: 'Industri Pangan',
    icon: Cookie,
    description:
      'Industri olahan pangan spesialis makaroni goreng dan maksor higienis. Varian original, balado, keju, jagung bakar, dan super pedas.',
    location: 'JL. Tentara Pelajar, Gunung Asih 1',
    phone: '(0265) 2751184',
    services: ['Makaroni Special Ikan Tawes', 'Maksor Extra Pedas', 'Varian Bumbu Spesial', 'Distribusi Skala Besar'],
    image: '/gasela_hd_makaroni.png',
    textColor: 'text-red-400',
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
      className={`unit-card relative shrink-0 w-[82vw] sm:w-95 md:w-120 h-[66vh] min-h-[500px] max-h-[620px] rounded-[1.75rem] border border-white/10 bg-zinc-900/70 backdrop-blur-2xl overflow-hidden flex flex-col transition-all duration-500 hover:border-amber-300/30 hover:-translate-y-1.5 shadow-2xl shadow-black/50 group cursor-pointer`}
      style={{ willChange: 'transform, opacity' }}
      aria-label={`Lihat detail Unit Bisnis: ${unit.name}`}
    >
      {/* ── Image Header ── */}
      <div className="relative h-44 md:h-52 shrink-0 overflow-hidden">
        <Image
          src={unit.image}
          alt={unit.name}
          fill
          sizes="(max-width: 640px) 82vw, 30rem"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/25 to-transparent" />

        {/* Watermark number */}
        <span className="absolute top-4 right-6 font-display text-6xl font-black text-amber-200/25 leading-none select-none tracking-tight">
          {unit.number}
        </span>

        {/* Category badge */}
        <span className="absolute bottom-4 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300/30 bg-zinc-950/70 backdrop-blur-md text-[9px] font-extrabold uppercase tracking-[0.22em] text-amber-200">
          <span className="w-1 h-1 rounded-full bg-amber-300" />
          {unit.category}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="relative flex-1 flex flex-col justify-between p-5 md:p-7">
        <div>
          <div className="flex items-start gap-4 mb-3">
            <div
              className={`w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center ${unit.textColor} group-hover:scale-105 group-hover:border-amber-300/30 transition-all`}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="font-display text-xl md:text-2xl font-black text-white tracking-tight leading-tight pt-1">
              {unit.name}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{unit.description}</p>
        </div>

        {/* Services */}
        <div className="my-3 py-3 border-y border-white/[0.07] grid grid-cols-1 gap-2">
          {unit.services.map((svc) => (
            <div key={svc} className="flex items-center gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${unit.textColor}`} />
              <span className="font-medium line-clamp-1">{svc}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              <span className="truncate block">{unit.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
              <span className="truncate block">{unit.phone}</span>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:bg-linear-to-r group-hover:from-amber-300 group-hover:to-amber-400 group-hover:text-zinc-950 transition-all duration-300">
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
      className="relative bg-zinc-950"
      style={{ height: '500vh' }}
      aria-label="Portofolio Bisnis Gasela Group"
    >
      <div
        ref={stageRef}
        className="h-screen w-full overflow-hidden bg-zinc-950 flex flex-col justify-between relative"
      >
        {/* HD Abstract Texture Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: "url('/gasela_hd_texture.png')" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/60 via-zinc-950/85 to-zinc-950 pointer-events-none" />

        {/* Ambient Grid Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />
        <div className="pointer-events-none absolute top-1/4 right-0 w-125 h-125 bg-amber-400/[0.05] rounded-full blur-[130px]" />
        <div className="pointer-events-none absolute bottom-1/4 left-0 w-125 h-125 bg-blue-600/[0.08] rounded-full blur-[130px]" />

        {/* Section Header */}
        <div className="relative z-10 shrink-0 pt-24 pb-5 px-6 md:px-12 lg:px-24">
          <div className="sa-intro-label flex items-center gap-3 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
            </span>
            <span className="text-amber-300 text-xs font-bold tracking-[0.3em] uppercase">Portofolio Bisnis Terpadu</span>
          </div>

          <h2 className="sa-intro-label font-display text-3xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
            Lini Perusahaan{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-amber-500">
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
            <div className="shrink-0 w-72 h-[66vh] min-h-[500px] max-h-[620px] flex flex-col items-center justify-center p-8 rounded-[1.75rem] border border-amber-300/25 bg-linear-to-b from-amber-300/[0.08] to-transparent backdrop-blur-xl text-center shadow-2xl shadow-black/50 hover:border-amber-300/50 transition-colors">
              <div className="w-16 h-16 rounded-full border border-amber-300/40 bg-amber-300/10 flex items-center justify-center mb-5 text-amber-300 shadow-[0_0_40px_-8px_rgba(251,191,36,0.5)]">
                <ArrowRight className="w-7 h-7" />
              </div>
              <p className="font-display text-2xl font-black text-white tracking-tight">Terintegrasi Sempurna</p>
              <p className="text-xs text-zinc-400 mt-3">Kecamatan Cikoneng, Kabupaten Ciamis</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/80 mt-6">Sejak 1996</p>
            </div>
          </div>
        </div>

        {/* Bottom Progress Rail */}
        <div className="shrink-0 h-[3px] bg-white/[0.06] relative z-10 overflow-hidden">
          <div className="sa-progress-bar absolute inset-y-0 left-0 right-0 origin-left bg-linear-to-r from-amber-400 via-amber-300 to-blue-500 scale-x-0" />
        </div>
      </div>
    </div>
  );
}
