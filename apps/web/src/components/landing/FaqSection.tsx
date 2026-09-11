'use client';

/**
 * FaqSection.tsx
 * ──────────────
 * Interactive visual FAQ Accordion component for CV GASELA GROUP.
 * Categorized by business unit with search and smooth disclosure animations.
 */

import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, MessageCircleQuestion } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'all' | 'motor' | 'futsal' | 'makaroni' | 'plastik' | 'holding';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-holding-1',
    category: 'holding',
    question: 'Apa itu CV GASELA GROUP dan apa saja unit bisnis yang dinaungi?',
    answer:
      'CV GASELA GROUP adalah holding perusahaan lokal unggulan yang didirikan sejak tahun 1996 di Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat. Holding ini menaungi 4 unit bisnis terintegrasi: DN Gasela Motor (bengkel mobil & cuci steam), DN Gasela Futsal Stadium (lapangan rumput sintetis USA), DN Gasela Sellular & Plastik (kemasan & logistik UMKM), serta Makaroni Spesial Cap Ikan Tawes (pelopor camilan makaroni khas Ciamis).',
  },
  {
    id: 'faq-motor-1',
    category: 'motor',
    question: 'Apa saja layanan servis kendaraan di DN Gasela Motor Cikoneng?',
    answer:
      'DN Gasela Motor menyediakan layanan otomotif terlengkap di Ciamis: cuci steam mobil & motor, servis berkala, tune-up mesin, salon mobil & detailing body, spooring 3D, balancing roda, serta penjualan spareparts resmi mobil terlengkap dengan mekanik bersertifikat dan bergaransi.',
  },
  {
    id: 'faq-futsal-1',
    category: 'futsal',
    question: 'Bagaimana cara reservasi jadwal sewa lapangan di Gasela Futsal Stadium?',
    answer:
      'Reservasi lapangan futsal dapat dilakukan langsung secara praktis melalui WhatsApp resmi di 0859-2189-4777 atau telepon (0265) 777000. Fasilitas kami mencakup lapangan rumput sintetis Supergrass USA ukuran 20x32m, kamar mandi air hangat, mushola bersih, tribun nonton bareng, kantin stadium, dan area parkir mobil/motor yang luas.',
  },
  {
    id: 'faq-makaroni-1',
    category: 'makaroni',
    question: 'Apakah Makaroni Spesial Cap Ikan Tawes melayani pengiriman luar kota dan reseller?',
    answer:
      'Ya, kami melayani pemesanan partai besar, kartonan, kemasan bal-balan, hingga kemasan retail untuk pengiriman ke seluruh kota di Indonesia (termasuk Shopee dan ekspedisi kargo). Tersedia paket harga distributor pabrik langsung dari Cikoneng bagi Anda yang ingin menjadi mitra reseller.',
  },
  {
    id: 'faq-plastik-1',
    category: 'plastik',
    question: 'Apakah DN Gasela Plastik melayani pembelian eceran atau hanya grosir?',
    answer:
      'DN Gasela Plastik melayani pembelian eceran maupun grosir skala besar untuk aneka kantong plastik, cup minuman, thinwall, mika kemasan makanan, bahan kerupuk mentah, bumbu tabur, hingga perlengkapan packaging UMKM kuliner dengan harga distributor kompetitif.',
  },
  {
    id: 'faq-hours-1',
    category: 'holding',
    question: 'Berapa jam operasional cabang-cabang CV GASELA GROUP?',
    answer:
      'Jam operasional: DN Gasela Motor buka setiap hari pukul 08.00–17.00 WIB; DN Gasela Futsal Stadium buka setiap hari pukul 08.00–23.00 WIB; DN Gasela Sellular & Plastik buka setiap hari pukul 07.30–18.00 WIB; serta Kantor Produksi Makaroni Cap Ikan Tawes melayani Senin–Sabtu pukul 08.00–17.00 WIB.',
  },
  {
    id: 'faq-loc-1',
    category: 'holding',
    question: 'Di mana letak lokasi kantor dan unit usaha CV GASELA GROUP?',
    answer:
      'Seluruh unit usaha CV GASELA GROUP berpusat di koridor strategis Jalan Raya Cikoneng (jalur utama Tasikmalaya – Ciamis), Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat 46261. Akses sangat mudah dijangkau dari arah Tasikmalaya maupun Ciamis Kota.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Semua Pertanyaan' },
  { id: 'holding', label: 'Holding & Lokasi' },
  { id: 'motor', label: 'Gasela Motor' },
  { id: 'futsal', label: 'Futsal Stadium' },
  { id: 'makaroni', label: 'Makaroni Ikan Tawes' },
  { id: 'plastik', label: 'Gasela Plastik' },
];

export function FaqSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'faq-holding-1': true, // default first item open
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = activeCategory === 'all'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <section
      id="faq"
      className="relative bg-white dark:bg-zinc-950 py-24 sm:py-28 px-5 sm:px-8 lg:px-12 border-b border-slate-200/80 dark:border-zinc-800/80"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-4xl mx-auto relative z-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
            <MessageCircleQuestion className="size-3.5" />
            Tanya Jawab Seputar Layanan
          </p>
          <h2
            id="faq-heading"
            className="font-sans text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight"
          >
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Informasi lengkap mengenai reservasi lapangan, servis kendaraan, pemesanan produk, dan layanan holding CV GASELA GROUP.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-zinc-950 shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-850 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openIds[faq.id] === true;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-zinc-850/60 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white pr-4 leading-snug">
                    {faq.question}
                  </span>
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-slate-100 dark:bg-zinc-750' : ''
                  }`}>
                    <ChevronDown className="size-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-100 dark:border-zinc-800/80 mt-1 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help CTA */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 p-5 sm:p-6 text-center space-y-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Punya Pertanyaan Spesifik yang Belum Terjawab?
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Tim kami siap membantu menjawab segala pertanyaan Anda terkait sewa lapangan, servis bengkel, grosir plastik, maupun kemitraan makaroni.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/6285921894777?text=Halo%20Admin%20CV%20GASELA%20GROUP%2C%20saya%20ingin%20bertanya%20mengenai..."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold tracking-wide transition-colors shadow-xs"
            >
              Hubungi CS via WhatsApp: 0859-2189-4777
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
