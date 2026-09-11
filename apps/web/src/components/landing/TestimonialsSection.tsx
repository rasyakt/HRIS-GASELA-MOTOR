'use client';

/**
 * TestimonialsSection.tsx
 * ────────────────────────
 * Social proof & client reviews component for CV GASELA GROUP.
 * Displays Google Reviews trust metrics and authentic testimonials
 * across all four business units.
 */

import { Star, Quote, CheckCircle2, Building, Trophy, Car, Cookie, ShoppingBag } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  unit: string;
  unitIcon: React.ComponentType<{ className?: string }>;
  rating: number;
  text: string;
  date: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'testi-1',
    name: 'Bambang Setyawan',
    role: 'Pemilik Kendaraan (Pelanggan Rutin)',
    unit: 'DN Gasela Motor',
    unitIcon: Car,
    rating: 5,
    text: 'Bengkel paling terpercaya di kawasan Cikoneng-Ciamis. Peralatan balancing dan spooring-nya sangat akurat. Mekanik teliti menjelaskan keluhan mesin tanpa melebih-lebihkan biaya. Cuci steam-nya juga bersih sampai ke kolong mobil.',
    date: 'Google Maps Review',
  },
  {
    id: 'testi-2',
    name: 'Fajar Pratama',
    role: 'Kapten Tim Futsal Priangan Cup',
    unit: 'DN Gasela Futsal Stadium',
    unitIcon: Trophy,
    rating: 5,
    text: 'Kualitas rumput sintetis USA-nya empuk dan nyaman di lutut. Penerangan lapangan saat main malam sangat terang, kamar mandi bersih dengan air hangat, dan area parkir mobilnya luas. Selalu jadi pilihan utama buat sparing mingguan.',
    date: 'Komunitas Futsal Ciamis',
  },
  {
    id: 'testi-3',
    name: 'Hj. Elis Rohayati',
    role: 'Pengusaha Kerupuk Babanggi & Kuliner',
    unit: 'DN Gasela Plastik & Sellular',
    unitIcon: ShoppingBag,
    rating: 5,
    text: 'Sudah lebih dari 10 tahun langganan plastik kemasan dan bumbu di Gasela Plastik. Stok ukuran selalu ada dan harga grosir sangat bersaing untuk para perajin makanan di Cikoneng. Pelayanan karyawannya ramah dan cekatan.',
    date: 'Mitra UMKM Cikoneng',
  },
  {
    id: 'testi-4',
    name: 'Rian Hidayat',
    role: 'Distributor Oleh-Oleh & Snack Priangan',
    unit: 'Makaroni Cap Ikan Tawes',
    unitIcon: Cookie,
    rating: 5,
    text: 'Makaroni Cap Ikan Tawes teksturnya renyah gurih tidak keras, bumbunya pas dan higienis. Varian Balado dan Ekstra Pedas selalu jadi best-seller yang paling cepat ludes di toko kami. Produk legendaris yang konsisten kualitasnya sejak 1996.',
    date: 'Distributor Bandung & Garut',
  },
];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative bg-slate-50/70 dark:bg-zinc-950 py-24 sm:py-28 px-5 sm:px-8 lg:px-12 border-b border-slate-200/80 dark:border-zinc-800/80"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Header & Trust Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 dark:border-zinc-800 pb-8">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Bukti Kualitas &amp; Kemitraan Nyata
            </p>
            <h2
              id="testimonials-heading"
              className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight"
            >
              Dipercaya Masyarakat Priangan Timur Sejak 1996
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed pt-1">
              Komitmen kami selama lebih dari dua dekade adalah memberikan produk berkualitas prima dan pelayanan tulus di seluruh lini bisnis.
            </p>
          </div>

          {/* Google Review Badge */}
          <div className="shrink-0 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 font-black text-lg">
                4.8
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  Rating Kepuasan Pelanggan
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Berdasarkan 350+ Ulasan Google Maps
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {TESTIMONIALS.map((t) => {
            const UnitIcon = t.unitIcon;
            return (
              <div
                key={t.id}
                className="group p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Unit Tag + Star */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      <UnitIcon className="size-3 text-amber-600 dark:text-amber-400" />
                      {t.unit}
                    </span>
                    <div className="flex items-center text-amber-500">
                      {[...Array(t.rating)].map((_, idx) => (
                        <Star key={idx} className="size-3 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                  </div>

                  {/* Quote text */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed italic mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {t.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-42.5">
                      {t.role}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                    Terverifikasi
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
