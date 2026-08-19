/**
 * landing.schema.ts
 * ─────────────────
 * Schema, types and DEFAULT content for the CV GASELA GROUP public
 * landing page. Served by the backend (merged with admin overrides)
 * and used by the web app as the render-time fallback.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Field-level schemas
// ─────────────────────────────────────────────────────────────

const textSchema = z.string();

const statSchema = z.object({
  id: z.string().min(1),
  value: z.number().min(0),
  suffix: z.string(),
  label: z.string(),
  desc: z.string(),
});

const marqueeItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  tag: z.string(),
});

const timelineItemSchema = z.object({
  id: z.string().min(1),
  year: z.string(),
  title: z.string(),
  desc: z.string(),
});

const pillarSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  desc: z.string(),
});

const businessUnitSchema = z.object({
  id: z.string().min(1),
  number: z.string(),
  name: z.string(),
  category: z.string(),
  image: z.string(),
  description: z.string(),
  location: z.string(),
  phone: z.string(),
  services: z.array(z.string()),
});

const officeSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  services: z.string(),
});
export type BusinessUnit = z.infer<typeof businessUnitSchema>;
export type Office = z.infer<typeof officeSchema>;

// ─────────────────────────────────────────────────────────────
// Section schemas (what the admin can edit per section)
// ─────────────────────────────────────────────────────────────

export const landingNavSchema = z.object({
  brandName: z.string(),
  brandTagline: z.string(),
  logo: z.string(),
  links: z.array(z.object({ id: z.string().min(1), label: z.string(), anchor: z.string() })),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});

export const landingHeroSchema = z.object({
  title: z.string(),
  accent: z.string(),
  subtitle: z.string(),
  backgroundImage: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaHref: z.string(),
  secondaryCtaLabel: z.string(),
  secondaryCtaHref: z.string(),
  stats: z.array(statSchema),
});

export const landingMarqueeSchema = z.object({
  items: z.array(marqueeItemSchema),
});

export const landingAboutSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  highlight: z.string(),
  paragraphs: z.array(z.string()),
  founderName: z.string(),
  founderRole: z.string(),
  founderQuote: z.string(),
  founderInitials: z.string(),
  timeline: z.array(timelineItemSchema),
  pillars: z.array(pillarSchema),
});

export const landingPortfolioSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  highlight: z.string(),
  units: z.array(businessUnitSchema),
  outroTitle: z.string(),
  outroSubtitle: z.string(),
  outroBadge: z.string(),
});

export const landingContactSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  emailLabel: z.string(),
  emailAddress: z.string(),
  offices: z.array(officeSchema),
  addressLabel: z.string(),
  addressTitle: z.string(),
  addressSubtitle: z.string(),
  addressPhone: z.string(),
});

export const landingFooterSchema = z.object({
  brandName: z.string(),
  brandTagline: z.string(),
  description: z.string(),
  columns: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string(),
      links: z.array(z.object({ id: z.string().min(1), label: z.string(), href: z.string() })),
    }),
  ),
  contactTitle: z.string(),
  contactAddress: z.string(),
  contactPhone: z.string(),
  contactEmail: z.string(),
  copyright: z.string(),
  privacyLabel: z.string(),
  termsLabel: z.string(),
});

export const LANDING_SECTIONS = [
  'nav',
  'hero',
  'marquee',
  'about',
  'portfolio',
  'contact',
  'footer',
] as const;
export type LandingSection = (typeof LANDING_SECTIONS)[number];

export const landingContentSchema = z.object({
  nav: landingNavSchema,
  hero: landingHeroSchema,
  marquee: landingMarqueeSchema,
  about: landingAboutSchema,
  portfolio: landingPortfolioSchema,
  contact: landingContactSchema,
  footer: landingFooterSchema,
});
export type LandingContent = z.infer<typeof landingContentSchema>;

export const updateLandingSectionSchema = z.record(z.string(), z.unknown());
export type UpdateLandingSectionInput = z.infer<typeof updateLandingSectionSchema>;

// ─────────────────────────────────────────────────────────────
// Defaults — single source of truth for the current landing copy
// ─────────────────────────────────────────────────────────────

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  nav: {
    brandName: 'CV. GASELA',
    brandTagline: 'Group',
    logo: '/cvgasela.png',
    links: [
      { id: 'beranda', label: 'Beranda', anchor: '#hero' },
      { id: 'biografi', label: 'Biografi', anchor: '#about' },
      { id: 'portfolio', label: 'Portofolio', anchor: '#portfolio' },
      { id: 'kontak', label: 'Kontak', anchor: '#contact' },
    ],
    ctaLabel: 'Portal HRIS',
    ctaHref: '/login',
  },
  hero: {
    title: 'CV GASELA',
    accent: 'GROUP.',
    subtitle:
      'Empat lini bisnis unggulan — otomotif, ritel & percetakan, arena olahraga, hingga industri pangan — dalam satu ekosistem terpadu dengan standar profesionalisme tinggi di Jawa Barat.',
    backgroundImage: '/gasela_hd_hero.png',
    primaryCtaLabel: 'Jelajahi Lini Bisnis',
    primaryCtaHref: '#portfolio',
    secondaryCtaLabel: 'Portal HRIS Karyawan',
    secondaryCtaHref: '/login',
    stats: [
      { id: 'unit', value: 4, suffix: '', label: 'Unit Bisnis', desc: 'Otomotif · Ritel · Futsal · Pangan' },
      { id: 'tahun', value: 30, suffix: '+', label: 'Tahun Berdiri', desc: 'Kiprah teruji sejak 1996' },
      { id: 'tenaga', value: 100, suffix: '+', label: 'Tenaga Kerja', desc: 'Roda ekonomi lokal berputar' },
      { id: 'ekosistem', value: 1, suffix: '', label: 'Ekosistem Terpadu', desc: 'Tata kelola HRIS modern' },
    ],
  },
  marquee: {
    items: [
      { id: 'motor', name: 'Gasela Motor', tag: 'Otomotif & Servis' },
      { id: 'sellular', name: 'Gasela Sellular & Plastik', tag: 'Ritel & Percetakan' },
      { id: 'futsal', name: 'Gasela Futsal Stadium', tag: 'Arena Olahraga' },
      { id: 'makaroni', name: 'Makaroni Cap Ikan Tawes', tag: 'Industri Pangan' },
    ],
  },
  about: {
    eyebrow: 'Biografi & Reputasi',
    title: 'Merintis Sukses Dari',
    highlight: 'Nol.',
    paragraphs: [
      'CV GASELA GROUP merupakan entitas penggabungan beberapa cabang perusahaan strategis yang berbasis di kawasan Kecamatan Cikoneng, Kabupaten Ciamis, Jawa Barat. Dipimpin langsung oleh Bpk. H. Didin Rojidin sebagai Owner sekaligus Direktur Perusahaan.',
      'Beliau adalah sosok pengusaha muda yang sukses merintis usaha dari titik awal hingga mencapai keberhasilan sejak usia menginjak kepala dua. Kini CV GASELA menaungi empat unit bisnis utama: Gasela Motor, Gasela Sellular & Plastik, Gasela Futsal Stadium, serta industri pangan Makaroni Spesial Cap Ikan Tawes.',
    ],
    founderName: 'H. Didin Rojidin',
    founderRole: 'Owner & Direktur Utama',
    founderQuote: 'Membangun kepercayaan lebih dulu, keuntungan mengikuti kemudian.',
    founderInitials: 'DR',
    timeline: [
      {
        id: '1996',
        year: '1996',
        title: 'Makaroni Cap Ikan Tawes',
        desc: 'Industri rumahan yang menjadi cikal bakal CV GASELA. Di tengah krisis moneter 1998, permintaan justru melonjak signifikan.',
      },
      {
        id: '2008',
        year: '2008',
        title: 'Gasela Motor & Sellular',
        desc: 'Ekspansi besar ke sektor otomotif dan ritel di JL. Raya Cikoneng-Ciamis, menandai lahirnya grup multi-bisnis.',
      },
      {
        id: '2012',
        year: '2012',
        title: 'Gasela Futsal Stadium',
        desc: 'Arena futsal rumput sintetis kelas premium — dijuluki lapangan termegah di kawasan Priangan Timur.',
      },
      {
        id: 'kini',
        year: 'Kini',
        title: 'GaselaPulse — Era Digital',
        desc: 'Tata kelola SDM terintegrasi melalui sistem HRIS modern yang melayani seluruh lini perusahaan.',
      },
    ],
    pillars: [
      {
        id: 'integritas',
        title: 'Integritas & Kepemimpinan',
        desc: 'Dirintis dari nol oleh Bpk. H. Didin Rojidin hingga menjadi grup bisnis terpandang di Ciamis.',
      },
      {
        id: 'kualitas',
        title: 'Standar Kualitas Premium',
        desc: 'Komitmen mutu konsisten di seluruh sektor otomotif, ritel, arena futsal, dan manufaktur pangan.',
      },
      {
        id: 'pemberdayaan',
        title: 'Pemberdayaan Lokal',
        desc: 'Menciptakan ratusan lapangan kerja dan mendorong percepatan roda ekonomi masyarakat Cikoneng.',
      },
      {
        id: 'administrasi',
        title: 'Administrasi Terpadu',
        desc: 'Tata kelola HRIS terintegrasi demi efisiensi, akurasi data, dan operasional yang modern.',
      },
    ],
  },
  portfolio: {
    eyebrow: 'Portofolio Bisnis Terpadu',
    title: 'Lini Perusahaan',
    highlight: 'CV GASELA',
    units: [
      {
        id: 'motor',
        number: '01',
        name: 'Gasela Motor',
        category: 'Otomotif & Servis',
        image: '/gasela_hd_motor.png',
        description:
          'Pusat perawatan kendaraan komprehensif — car service, car wash hidrolik, car saloon, dan suku cadang resmi terlengkap.',
        location: 'Jl. Raya Cikoneng No.135, Cikoneng, Ciamis',
        phone: '(0265) 776103',
        services: ['Car Service', 'Car Wash & Salon', 'Genuine Spareparts', 'Layanan Otomotif'],
      },
      {
        id: 'sellular',
        number: '02',
        name: 'Gasela Sellular & Plastik',
        category: 'Ritel & Percetakan',
        image: '/gasela_hd_sellular.png',
        description:
          'Ritel terpadu: voucher perdana & isi ulang, ATK, cetak photo, fotocopy, laminating, plastik industri, dan bumbu pangan.',
        location: 'Jalan Raya, Cikoneng, Ciamis',
        phone: '(0265) 2752592',
        services: ['Voucher & Telekomunikasi', 'Cetak Photo & Offset', 'Macam Ukuran Plastik', 'Bumbu Industri Pangan'],
      },
      {
        id: 'futsal',
        number: '03',
        name: 'Gasela Futsal Stadium',
        category: 'Olahraga & Complex',
        image: '/gasela_hd_futsal.png',
        description:
          'Stadion futsal premium rumput sintetis super grass 18×30 m², mushola, kamar mandi air hangat, kantin & cafe, parkir luas.',
        location: 'Jl. Raya Cikoneng, Cikoneng, Ciamis',
        phone: '(0265) 777000',
        services: ['Rumput Sintetis 18×30 m²', 'Kantin & Cafe Stadium', 'Kamar Mandi Air Hangat', 'Karaoke Keluarga'],
      },
      {
        id: 'makaroni',
        number: '04',
        name: 'Makaroni Cap Ikan Tawes',
        category: 'Industri Pangan',
        image: '/gasela_hd_makaroni.png',
        description:
          'Industri olahan pangan spesialis makaroni goreng dan maksor higienis. Varian original, balado, keju, jagung bakar, dan super pedas.',
        location: 'Jl. Tentara Pelajar No.165, Cikoneng, Ciamis',
        phone: '(0265) 2751184',
        services: ['Makaroni Special Ikan Tawes', 'Maksor Extra Pedas', 'Varian Bumbu Spesial', 'Distribusi Skala Besar'],
      },
    ],
    outroTitle: 'Terintegrasi Sempurna',
    outroSubtitle: 'Kecamatan Cikoneng, Kabupaten Ciamis',
    outroBadge: 'Sejak 1996',
  },
  contact: {
    eyebrow: 'Direktori Sekretariat',
    title: 'Hubungi Cabang Perusahaan.',
    emailLabel: 'Email Resmi',
    emailAddress: 'gaselafutsal@gmail.com',
    offices: [
      {
        id: 'motor',
        name: 'Gasela Motor',
        address: 'Jl. Raya Cikoneng No.135, Cikoneng, Ciamis',
        phone: '(0265) 776103',
        services: 'Car Service, Wash, Saloon & Spareparts',
      },
      {
        id: 'sellular',
        name: 'Gasela Sellular & Plastik',
        address: 'Jalan Raya, Cikoneng, Ciamis',
        phone: '(0265) 2752592',
        services: 'Voucher, Percetakan, ATK & Plastik',
      },
      {
        id: 'futsal',
        name: 'Gasela Futsal Stadium',
        address: 'Jl. Raya Cikoneng, Cikoneng, Ciamis',
        phone: '(0265) 777000',
        services: 'Rumput Sintetis, Cafe & Karaoke',
      },
      {
        id: 'makaroni',
        name: 'Makaroni Cap Ikan Tawes',
        address: 'Jl. Tentara Pelajar No.165, Cikoneng, Ciamis',
        phone: '(0265) 2751184',
        services: 'Industri Pangan & Makaroni Goreng',
      },
    ],
    addressLabel: 'Sekretariat Utama Grup',
    addressTitle: 'JL. Raya Cikoneng - Ciamis, Jawa Barat',
    addressSubtitle: 'Kecamatan Cikoneng, Kabupaten Ciamis — Indonesia',
    addressPhone: '(0265) 776103',
  },
  footer: {
    brandName: 'CV. GASELA GROUP',
    brandTagline: 'Terintegrasi Sempurna',
    description:
      'Ekosistem bisnis terpadu yang menaungi sektor otomotif, ritel, arena olahraga, dan manufaktur pangan dengan standar profesionalisme tinggi di Jawa Barat.',
    columns: [
      {
        id: 'lini',
        title: 'Lini Perusahaan',
        links: [
          { id: 'u-motor', label: 'Gasela Motor', href: '/landing/unit/motor' },
          { id: 'u-sellular', label: 'Gasela Sellular & Plastik', href: '/landing/unit/sellular' },
          { id: 'u-futsal', label: 'Gasela Futsal Stadium', href: '/landing/unit/futsal' },
          { id: 'u-makaroni', label: 'Makaroni Cap Ikan Tawes', href: '/landing/unit/makaroni' },
        ],
      },
      {
        id: 'akses',
        title: 'Akses Cepat',
        links: [
          { id: 'a-hero', label: 'Beranda', href: '#hero' },
          { id: 'a-about', label: 'Biografi Perusahaan', href: '#about' },
          { id: 'a-portfolio', label: 'Portofolio Bisnis', href: '#portfolio' },
          { id: 'a-login', label: 'Portal HRIS Karyawan', href: '/login' },
        ],
      },
    ],
    contactTitle: 'Hubungi Kami',
    contactAddress: 'JL. Raya Cikoneng - Ciamis,\nJawa Barat, Indonesia',
    contactPhone: '(0265) 776103',
    contactEmail: 'info@gaselagrup.com',
    copyright: 'CV GASELA GROUP. Hak cipta dilindungi undang-undang.',
    privacyLabel: 'Kebijakan Privasi',
    termsLabel: 'Syarat & Ketentuan',
  },
};
