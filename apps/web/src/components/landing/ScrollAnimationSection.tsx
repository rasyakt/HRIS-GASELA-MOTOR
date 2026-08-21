'use client';

/**
 * ScrollAnimationSection.tsx
 * ─────────────────────────
 * Centerpiece pinned horizontal scrub showcase for CV GASELA GROUP.
 * High-precision enterprise cards featuring authentic facility photography,
 * structured capability lists, and smooth progress tracking.
 */

import { useRef, useMemo } from 'react';
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
  CheckCircle2,
} from 'lucide-react';
import type { BusinessUnit as BusinessUnitContent } from '@gasela/shared-types';
import { useLandingContent } from './LandingContentProvider';

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
}

const UNIT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  motor: Car,
  sellular: Smartphone,
  futsal: Trophy,
  makaroni: Cookie,
};

function toBusinessUnits(units: BusinessUnitContent[]): BusinessUnit[] {
  return units.map((u) => ({
    ...u,
    icon: UNIT_ICONS[u.id] ?? Car,
  }));
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Unit Card
// ─────────────────────────────────────────────────────────────

function UnitCard({ unit }: { unit: BusinessUnit }) {
  const Icon = unit.icon;
  return (
    <Link
      href={`/landing/unit/${unit.id}`}
      className="unit-card relative shrink-0 w-[85vw] sm:w-95 md:w-102.5 h-115 md:h-120 rounded-2xl border border-slate-200/90 bg-white/95 dark:bg-zinc-900/90 dark:border-zinc-800 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700 group cursor-pointer shadow-2xs"
      style={{ willChange: 'transform, opacity' }}
      aria-label={`Lihat detail Unit Bisnis: ${unit.name}`}
    >
      {/* ── Image Header ── */}
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <Image
          src={unit.image}
          alt={unit.name}
          fill
          sizes="(max-width: 640px) 85vw, 410px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-transparent to-transparent" />

        {/* Watermark Number */}
        <span className="absolute top-3 right-4 font-sans text-3xl font-black text-white/40 leading-none select-none tracking-tight">
          {unit.number}
        </span>

        {/* Category Badge */}
        <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {unit.category}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="relative flex-1 flex flex-col justify-between p-5 md:p-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300">
              <Icon className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-sans text-lg font-bold text-slate-950 dark:text-white tracking-tight leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {unit.name}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {unit.description}
          </p>
        </div>

        {/* Capabilities Checklist */}
        <div className="my-3 py-3 border-y border-slate-100 dark:border-zinc-800 space-y-1.5">
          {unit.services.slice(0, 3).map((svc) => (
            <div key={svc} className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="font-medium line-clamp-1">{svc}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate">{unit.location}</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0">
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
  const { content } = useLandingContent();
  const portfolio = content.portfolio;
  const units = useMemo(() => toBusinessUnits(portfolio.units), [portfolio.units]);
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
      const firstItemWidth = allItems[0]?.offsetWidth ?? 380;
      const lastItemWidth = allItems[allItems.length - 1]?.offsetWidth ?? 380;
      const gap = 24;

      let totalWidth = 0;
      allItems.forEach((el) => {
        totalWidth += el.offsetWidth;
      });
      totalWidth += gap * (allItems.length - 1);

      // Perfectly center the first and last items at the pin start/end
      const startX = stageWidth / 2 - firstItemWidth / 2;
      const lastItemCenterOffset = totalWidth - lastItemWidth / 2;
      const endX = stageWidth / 2 - lastItemCenterOffset;

      // Independent intro label animation
      gsap.fromTo(
        '.sa-intro-label',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
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
            { opacity: 0.5, scale: 0.96 },
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
      style={{ height: '400vh' }}
      aria-label="Portofolio Bisnis Gasela Group"
    >
      <div
        ref={stageRef}
        className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between relative border-b border-slate-200/80 dark:border-zinc-800/80"
      >
        {/* Section Header */}
        <div className="relative z-10 shrink-0 pt-24 pb-4 px-5 sm:px-8 lg:px-12">
          <p className="sa-intro-label text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            {portfolio.eyebrow}
          </p>

          <h2 className="sa-intro-label font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight max-w-3xl">
            {portfolio.title} {portfolio.highlight}
          </h2>
        </div>

        {/* Horizontal Card Strip */}
        <div className="flex-1 flex items-center overflow-visible relative z-10">
          <div ref={stripRef} className="flex gap-6 w-max" style={{ willChange: 'transform' }}>
            {units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        </div>

        {/* Bottom Progress Rail */}
        <div className="shrink-0 h-0.5 bg-slate-200 dark:bg-zinc-800 relative z-10 overflow-hidden">
          <div className="sa-progress-bar absolute inset-y-0 left-0 right-0 origin-left bg-amber-600 dark:bg-amber-400 scale-x-0" />
        </div>
      </div>
    </div>
  );
}


