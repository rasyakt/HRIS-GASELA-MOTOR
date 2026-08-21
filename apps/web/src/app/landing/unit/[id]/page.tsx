import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Phone, Mail, Facebook, Clock, ShieldCheck, MapPin, Navigation } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SocialMediaSection } from '@/components/landing/SocialMediaSection';
import { QuickLinksSection } from '@/components/landing/QuickLinksSection';
import { UnitBreadcrumbJsonLd } from '@/components/landing/JsonLd';

// ─────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────

interface UnitDetail {
  id: string;
  name: string;
  tagline: string;
  year?: string;
  description: string;
  image: string;
  phone: string;
  email?: string;
  facebook?: string;
  features: string[];
  menus?: string[];
  location: string;
  mapEmbed?: string;
}

const UNIT_DETAILS: Record<string, UnitDetail> = {
  futsal: {
    id: 'futsal',
    name: 'DN GASELA Futsal Stadium',
    tagline: 'Kenyamanan Para Pecinta Futsal',
    year: '2012',
    description:
      'DN GASELA Futsal adalah salah satu cabang perusahaan dari sekian banyak perusahaan yang tergabung ke dalam CV. GASELA yang berlokasi di JL. Raya Cikoneng - Ciamis, Jawa Barat. Dengan difasilitasi lapangan rumput sintetis supergrass USA dengan luas 20 X 32m menjadikannya lapangan futsal termegah di kawasan Priangan Timur pada tahun 2013/2014.',
    image: '/gasela_hd_futsal.png',
    phone: '(0265) 777000',
    email: 'gaselafutsal@gmail.com',
    facebook: 'Gasela Futsal stadium',
    location: 'Jl. Raya Cikoneng, Cikoneng, Kec. Cikoneng, Kabupaten Ciamis, Jawa Barat 46261',
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.3960191376086!2d108.2614693743148!3d-7.309329271862742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f5a22296f9d05%3A0x88fb566c3cf6dedb!2sGasela%20Futsal%20Cikoneng!5e0!3m2!1sid!2sid!4v1786186397643!5m2!1sid!2sid',
    features: [
      'Lapangan Rumput Sintetis Supergrass USA (20 x 32m)',
      'Toilet & Kamar Mandi Air Hangat',
      'Mushola Bersih & Nyaman',
      'Lokasi Nonton Bareng',
      'Area Parkir Luas (25 x 15m)',
      'Ruang Karaoke Keluarga',
      'Kantin & Cafe Stadium',
    ],
    menus: [
      'Mie Baso',
      'Mie Ayam',
      'Mie Goreng & Mie Rebus',
      'Mie Mewek khas Cafe GASELA',
      'Kwetiaw & Bihun',
      'Nasi Goreng Spesial',
      'Pisang Keju & Singkong Keju',
      'Aneka Jus Segar & Es Float',
      'Sop Buah & Salad Buah',
    ],
  },
  motor: {
    id: 'motor',
    name: 'DN GASELA Motor',
    tagline: 'Penyedia Layanan Otomotif Anda',
    year: '2008',
    description:
      'DN GASELA motor adalah salah satu cabang perusahaan dari sekian banyak perusahaan yang tergabung ke dalam CV. GASELA yang berlokasi di JL. Raya Cikoneng – Ciamis, Jawa Barat. Didirikan pada tahun 2008, kini DN GASELA Motor berkembang pesat menjadi pusat pelayanan otomotif terbesar dan terlengkap di wilayah Kabupaten Ciamis.',
    image: '/gasela_hd_motor.png',
    phone: '(0265) 776103',
    location: 'Jl. Raya Cikoneng No.135, Cikoneng, Kec. Cikoneng, Kabupaten Ciamis, Jawa Barat 46261',
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.3797626760756!2d108.27070527431488!3d-7.311163971882833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f5a28582ca8b7%3A0x4e72dd1aa39933e9!2sDN.%20Gasela%20Motor!5e0!3m2!1sid!2sid!4v1786188192529!5m2!1sid!2sid',
    features: [
      'Pusat Pelayanan Otomotif Terbesar di Kabupaten Ciamis',
      'Peralatan Servis Modern, Canggih, & Akurat',
      'Tenaga Kerja Mekanik Terampil & Berpengalaman',
      'Suku Cadang Mobil Terlengkap & Resmi',
      'Jaminan Kenyamanan Keluhan Otomotif Konsumen',
    ],
    menus: [
      'Cuci Steam (Mobil / Motor)',
      'Car Service & Tune-Up',
      'Car Saloon & Detailing',
      'Spooring Kendaraan',
      'Balancing Roda',
      'Spareparts Mobil Resmi',
    ],
  },
  sellular: {
    id: 'sellular',
    name: 'DN GASELA Sellular & GASELA Plastik',
    tagline: 'Pelayanan Wirausaha Anda',
    year: '2008',
    description:
      'DN GASELA Sellular didirikan pada tahun 2008 sebagai pusat penyedia voucher seluler, alat tulis kantor, cetak photo, dan fotocopy. Bersamaan dengan kemajuan industri pangan di daerah Cikoneng, didirikanlah DN GASELA Plastik satu atap dengan Sellular sebagai pusat pembelanjaan bagi pengusaha industri pangan di daerah Kecamatan Cikoneng dan luar kota. Pada tahun 2012 dilakukan renovasi gedung untuk memperluas kapasitas penyimpanan stock barang.',
    image: '/gasela_hd_sellular.png',
    phone: '(0265) 2752592',
    location: 'M7QF+H86, Jalan Raya, Cikoneng, Kec. Cikoneng, Kabupaten Ciamis, Jawa Barat 46261',
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d989.3450908791173!2d108.27262806952203!3d-7.311096169341812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f5a2627e0f729%3A0xe91150898c2bed9e!2sGasela%20Photo%20Copy%20-%20Plastik!5e0!3m2!1sid!2sid!4v1786189533268!5m2!1sid!2sid',
    features: [
      'Pusat Pembelanjaan Pengusaha Industri Pangan Cikoneng',
      'Pelayanan Terpadu Satu Atap (Sellular & Plastik)',
      'Renovasi Kapasitas Gudang Stock Luas (Tahun 2012)',
      'Melayani Pelanggan Dalam Kota hingga Luar Kota',
      'Layanan ATK, Cetak, Photocopy, & Perdana Lengkap',
    ],
    menus: [
      'Voucher Perdana & Isi Ulang',
      'Cetak Photo & Print Data',
      'Jasa Fotocopy & Laminating',
      'Alat Tulis Kantor (ATK)',
      'Macam Ukuran Plastik',
      'Bahan Kerupuk Babanggi',
      'Bumbu Industri Pangan',
    ],
  },
  makaronikantawes: {
    id: 'makaronikantawes',
    name: 'Makaroni Spesial Cap Ikan Tawes',
    tagline: 'Produksi DN - Citarasa Legendaris',
    year: '1996',
    description:
      'Ikan Tawes adalah sebuah merek perusahaan yang memproduksi makanan ringan yang berupa makaroni goreng spesial. Perusahaan ini mulai dirintis sejak tahun 1996 melalui industri rumahan. Pada tahun 1998, di tengah krisis moneter, perusahaan justru mengalami peningkatan permintaan pasar yang sangat signifikan. Makroni cap Ikan Tawes merupakan aset awal berdirinya CV. GASELA sebelum berekspansi merintis unit bisnis lainnya.',
    image: '/gasela_hd_makaroni.png',
    phone: '0265 2751184',
    location: 'Jl. Tentara Pelajar No.165, RT.19/RW.006, Cikoneng, Kec. Cikoneng, Kabupaten Ciamis, Jawa Barat 46261',
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1428.4564084103179!2d108.2626518668212!3d-7.306483811002274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f5b64a939098b%3A0xdad57fcbe6cece3c!2sMakroni%20ikan%20tawes!5e0!3m2!1sid!2sid!4v1786185805120!5m2!1sid!2sid',
    features: [
      'Aset Landasan Awal Berdirinya CV. GASELA',
      'Penghargaan KUKM Berprestasi di Jawa Barat (2 Juli 2008 oleh Gubernur Jabar)',
      'Penghargaan Pembina Terbaik Tenaga Kerja Perempuan Ciamis (2 November 2006 oleh Bupati)',
      'Merintis Ekspansi Gasela Motor, Sellular, & Futsal Stadium',
      'Proses Produksi Higienis & Terstandardisasi',
    ],
    menus: [
      'Rasa Original Khas Tawes',
      'Rasa Keju Gurih',
      'Rasa Jagung Bakar',
      'Rasa Jagung Manis',
      'Rasa Balado Pedas',
      'Rasa Extra Pedas',
    ],
  },
};

// Alias fallback for makaroni route
UNIT_DETAILS['makaroni'] = UNIT_DETAILS['makaronikantawes'];

// ─────────────────────────────────────────────────────────────
// Next.js Config
// ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const unit = UNIT_DETAILS[id];
  if (!unit) return { title: 'Lini Bisnis tidak ditemukan' };

  const canonicalUrl = `https://gasela.my.id/landing/unit/${id}`;

  return {
    title: `${unit.name} — ${unit.tagline} | CV GASELA GROUP`,
    description: `${unit.description.slice(0, 160)}... Hubungi ${unit.phone} atau kunjungi lokasi kami di Cikoneng, Ciamis.`,
    keywords: [
      unit.name,
      unit.tagline,
      'CV GASELA',
      'Cikoneng',
      'Ciamis',
      'Jawa Barat',
      ...(unit.features || []),
      ...(unit.menus || []),
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${unit.name} — CV GASELA GROUP`,
      description: `${unit.tagline} — ${unit.description.slice(0, 150)}...`,
      url: canonicalUrl,
      siteName: 'CV GASELA GROUP',
      images: [
        {
          url: unit.image,
          width: 1200,
          height: 630,
          alt: `${unit.name} Cikoneng Ciamis`,
        },
      ],
      type: 'article',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${unit.name} — CV GASELA GROUP`,
      description: unit.tagline,
      images: [unit.image],
    },
  };
}

export async function generateStaticParams() {
  return [{ id: 'futsal' }, { id: 'motor' }, { id: 'sellular' }, { id: 'makaronikantawes' }, { id: 'makaroni' }];
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = UNIT_DETAILS[id];

  if (!unit) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 relative py-28 px-5 sm:px-8 lg:px-12">
      {/* Breadcrumb Structured Data */}
      <UnitBreadcrumbJsonLd name={unit.name} url={`https://gasela.my.id/landing/unit/${id}`} />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* Back Link */}
        <Link
          href="/landing#portfolio"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white text-xs font-bold uppercase tracking-wider transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Portofolio</span>
        </Link>

        {/* Hero Section of the Unit */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Lini Bisnis CV GASELA GROUP
            </p>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-950 dark:text-white">
              {unit.name}
            </h1>

            <p className="text-base sm:text-lg text-amber-800 dark:text-amber-400 font-bold">
              &ldquo;{unit.tagline}&rdquo;
            </p>

            <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-sm sm:text-base font-normal">
              {unit.description}
            </p>

            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-semibold">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Didirikan {unit.year ? `Tahun ${unit.year}` : 'Sejak Awal Grup'} · Cikoneng, Ciamis</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-72 sm:h-80 md:h-96 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 overflow-hidden shadow-2xs">
            <Image
              src={unit.image}
              alt={unit.name}
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* Features & Content Grids */}
        <div className="grid md:grid-cols-2 gap-6 pt-4">
          {/* Left Block: Features */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-bold text-slate-950 dark:text-white tracking-tight">Fasilitas & Keunggulan</h2>
            </div>
            <ul className="space-y-3">
              {unit.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mt-2 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Block: Menu / Services / Contact */}
          {unit.menus ? (
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 shadow-2xs space-y-5">
              <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white tracking-tight">
                    {id === 'futsal' && 'Menu Favorit Café'}
                    {(id === 'makaronikantawes' || id === 'makaroni') && 'Varian Rasa Makaroni'}
                    {id === 'motor' && 'Layanan Otomotif'}
                    {id === 'sellular' && 'Layanan Ritel & Jasa'}
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                {unit.menus.map((item) => (
                  <div key={item} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
                    <span className="font-medium truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 shadow-2xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-zinc-800">
                  <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white tracking-tight">Lokasi Sekretariat</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Semua transaksi, reservasi, dan koordinasi resmi dilakukan langsung pada lokasi sekretariat kantor unit terkait.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                <p className="font-bold text-slate-950 dark:text-white">Alamat Resmi:</p>
                <p>{unit.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Makaroni Cap Ikan Tawes Exclusive Order Hub & Social Media Sections */}
        {(id === 'makaronikantawes' || id === 'makaroni') && (
          <div className="space-y-8 pt-4">
            <QuickLinksSection />
            <SocialMediaSection />
          </div>
        )}

        {/* Google Maps Embed */}
        {unit.mapEmbed && (
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tracking-tight">
                Lokasi &amp; Peta Operasional
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {unit.location}
            </p>

            <div className="w-full rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-100 overflow-hidden relative min-h-80 md:min-h-100 shadow-2xs">
              <iframe
                src={unit.mapEmbed}
                title={`Peta lokasi ${unit.name}`}
                className="absolute inset-0 w-full h-full border-0 dark:[filter:invert(0.88)_hue-rotate(180deg)_contrast(0.9)_saturate(0.65)]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        )}

        {/* Contacts Matrix */}
        <div className="border-t border-slate-200/80 dark:border-zinc-800/80 pt-8 grid sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <a
            href={`tel:${unit.phone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/90 dark:bg-zinc-900/70 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Telepon</p>
              <p className="text-slate-950 dark:text-white font-bold tracking-tight mt-0.5">{unit.phone}</p>
            </div>
          </a>

          <a
            href={`mailto:${unit.email ?? 'info@gaselagrup.com'}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/90 dark:bg-zinc-900/70 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Email</p>
              <p className="text-slate-950 dark:text-white font-bold tracking-tight mt-0.5">{unit.email ?? 'info@gaselagrup.com'}</p>
            </div>
          </a>

          <a
            href={`https://facebook.com/search/top?q=${encodeURIComponent(unit.facebook ?? 'Gasela Group')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/90 dark:bg-zinc-900/70 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-2xs"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 shrink-0">
              <Facebook className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Facebook</p>
              <p className="text-slate-950 dark:text-white font-bold tracking-tight mt-0.5 truncate">{unit.facebook ?? 'Gasela Group'}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
