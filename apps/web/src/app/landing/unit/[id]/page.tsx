import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Phone, Mail, Facebook, Clock, ShieldCheck, MapPin, Navigation } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
  makaroni: {
    id: 'makaroni',
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

// ─────────────────────────────────────────────────────────────
// Next.js Config
// ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const unit = UNIT_DETAILS[id];
  if (!unit) return { title: 'Lini Bisnis tidak ditemukan' };
  return {
    title: `${unit.name} — CV GASELA GROUP`,
    description: unit.description,
  };
}

export async function generateStaticParams() {
  return [{ id: 'futsal' }, { id: 'motor' }, { id: 'sellular' }, { id: 'makaroni' }];
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
    <div className="min-h-screen bg-zinc-950 text-white relative py-28 px-6 md:px-16 lg:px-24 overflow-hidden">
      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[64px_64px]" />
      <div className="absolute top-1/4 right-1/4 w-150 h-150 bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-100 h-100 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Back Link */}
        <Link
          href="/landing#portfolio"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Portfolio</span>
        </Link>

        {/* Hero Section of the Unit */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">
                Lini Bisnis CV GASELA
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              {unit.name}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-300 font-semibold italic">
              &ldquo;{unit.tagline}&rdquo;
            </p>

            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              {unit.description}
            </p>

            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-500 text-xs font-medium">
              <Clock className="w-4 h-4" />
              <span>Didirikan {unit.year ? `Tahun ${unit.year}` : 'Sejak Awal Grup'}</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-80 md:h-100 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 backdrop-blur-md overflow-hidden shadow-xl dark:shadow-2xl">
            <Image
              src={unit.image}
              alt={unit.name}
              fill
              className="object-cover opacity-80"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-white via-white/20 dark:from-zinc-950 dark:via-zinc-950/20 to-transparent" />
          </div>
        </div>

        {/* Features & Content Grids */}
        <div className="grid md:grid-cols-2 gap-8 pt-6">
          {/* Left Block: Features */}
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800/80">
              <ShieldCheck className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Fasilitas & Penghargaan</h2>
            </div>
            <ul className="space-y-3.5">
              {unit.features.map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Block: Menu (For Futsal / Makaroni / Motor / Sellular) or Contact Box */}
          {unit.menus ? (
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800/80">
                <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {id === 'futsal' && 'Menu Favorit Café'}
                  {id === 'makaroni' && 'Varian Rasa Makaroni'}
                  {id === 'motor' && 'Layanan Otomotif'}
                  {id === 'sellular' && 'Layanan Ritel & Jasa'}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-zinc-300">
                {unit.menus.map((item) => (
                  <div key={item} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none">
                    <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800/80">
                  <MapPin className="w-5 h-5 text-red-500 dark:text-red-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Lokasi Sekretariat</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Semua transaksi, reservasi, dan koordinasi resmi dilakukan langsung pada lokasi sekretariat kantor unit terkait.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/80 text-xs text-slate-500 dark:text-zinc-400 space-y-1 shadow-sm dark:shadow-none">
                <p className="font-semibold text-slate-900 dark:text-white">Alamat Resmi:</p>
                <p>{unit.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Location & Map */}
        {unit.mapEmbed && (
          <div className="grid lg:grid-cols-12 gap-8 pt-6">
            {/* Address Card */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-6 p-8 rounded-3xl border border-amber-300/20 bg-linear-to-b from-amber-300/[0.06] to-transparent backdrop-blur-xl shadow-xl shadow-black/30">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <span className="w-10 h-10 rounded-xl bg-amber-300/10 border border-amber-300/30 flex items-center justify-center text-amber-300">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <h2 className="font-display text-xl font-black text-white tracking-tight">Lokasi &amp; Peta</h2>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{unit.location}</p>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-linear-to-r from-amber-300 via-amber-400 to-amber-300 text-zinc-950 font-black text-sm uppercase tracking-[0.15em] shadow-[0_10px_40px_-10px_rgba(251,191,36,0.6)] hover:shadow-[0_12px_55px_-8px_rgba(251,191,36,0.8)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <Navigation className="w-4 h-4" />
                Buka di Google Maps
              </a>
            </div>

            {/* Map Embed */}
            <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-zinc-900/40 overflow-hidden relative min-h-[320px] md:min-h-[420px] shadow-2xl shadow-black/50">
              <iframe
                src={unit.mapEmbed}
                title={`Peta lokasi ${unit.name}`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0, filter: 'invert(0.88) hue-rotate(180deg) contrast(0.9) saturate(0.65)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        )}

        {/* Contacts Matrix */}
        <div className="border-t border-slate-200 dark:border-zinc-900 pt-12 grid sm:grid-cols-3 gap-6 text-sm text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 font-semibold uppercase">Telepon</p>
              <p className="text-slate-900 dark:text-white font-bold tracking-tight mt-0.5">{unit.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 font-semibold uppercase">Email</p>
              <p className="text-slate-900 dark:text-white font-bold tracking-tight mt-0.5">{unit.email ?? 'info@gaselagrup.com'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Facebook className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 font-semibold uppercase">Facebook</p>
              <p className="text-slate-900 dark:text-white font-bold tracking-tight mt-0.5 truncate">{unit.facebook ?? 'Gasela Group'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
