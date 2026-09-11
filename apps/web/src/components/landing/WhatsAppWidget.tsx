'use client';

/**
 * WhatsAppWidget.tsx
 * ──────────────────
 * Floating direct WhatsApp customer service widget for CV GASELA GROUP.
 * Enables instant mobile & desktop conversion for futsal bookings,
 * workshop consultations, snack orders, and corporate inquiries.
 */

import { useState } from 'react';
import { MessageCircle, X, ChevronRight, PhoneCall, Clock, ShieldCheck } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';

const WA_CHANNELS = [
  {
    id: 'general',
    title: 'Customer Service Pusat',
    desc: 'Informasi umum CV GASELA GROUP & kemitraan',
    phone: '0859-2189-4777',
    message: 'Halo CV GASELA GROUP, saya ingin informasi lebih lanjut mengenai...',
    badge: 'Respon Cepat',
  },
  {
    id: 'futsal',
    title: 'Booking Gasela Futsal Stadium',
    desc: 'Cek jadwal kosong, sewa lapangan, & turnamen',
    phone: '0859-2189-4777',
    message: 'Halo Gasela Futsal Stadium, saya ingin tanya ketersediaan jadwal sewa lapangan untuk tanggal...',
    badge: 'Booking 08.00-23.00',
  },
  {
    id: 'motor',
    title: 'Servis & Cuci DN Gasela Motor',
    desc: 'Konsultasi keluhan mobil, servis berkala, & cuci steam',
    phone: '0859-2189-4777',
    message: 'Halo DN Gasela Motor, saya ingin konsultasi servis mobil / tanya antrean cuci steam...',
    badge: '08.00-17.00',
  },
  {
    id: 'makaroni',
    title: 'Pemesanan Makaroni & Plastik',
    desc: 'Pemesanan retail, grosir kartonan, & plastik kemasan',
    phone: '0859-2189-4777',
    message: 'Halo Admin Makaroni Cap Ikan Tawes / Gasela Plastik, saya ingin memesan produk...',
    badge: 'Pabrik & Toko',
  },
];

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChannel = (message: string) => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/6285921894777?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {/* ── Pop-up Dialog ── */}
      {isOpen && (
        <div className="mb-3 w-[92vw] max-w-90 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-xs">
                <SiWhatsapp className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chat WhatsApp Resmi
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  CV GASELA GROUP Cikoneng
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              aria-label="Tutup menu WhatsApp"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Quick Notice */}
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Customer service aktif melayani via WhatsApp</span>
          </div>

          {/* Channels List */}
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-0.5">
            {WA_CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleOpenChannel(ch.message)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-zinc-800/80 dark:bg-zinc-850/60 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-950/30 cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {ch.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {ch.desc}
                  </p>
                </div>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-slate-400 group-hover:border-emerald-500 group-hover:bg-[#25D366] group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800 transition-all shadow-2xs">
                  <ChevronRight className="size-3.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Footer Direct Call */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Official Verified
            </span>
            <a
              href="tel:+62265776103"
              className="font-medium text-slate-700 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-400"
            >
              Telepon Kantor: (0265) 776103
            </a>
          </div>
        </div>
      )}

      {/* ── Floating Main Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
        aria-label="Hubungi kami melalui WhatsApp"
      >
        <div className="relative">
          <SiWhatsapp className="size-5 sm:size-5.5" />
          <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-white border-2 border-[#25D366] animate-ping" />
        </div>
        <span className="text-xs sm:text-sm font-bold tracking-tight">
          {isOpen ? 'Tutup WhatsApp' : 'Tanya via WhatsApp'}
        </span>
      </button>
    </div>
  );
}
