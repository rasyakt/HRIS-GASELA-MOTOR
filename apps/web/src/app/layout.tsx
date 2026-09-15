import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gasela.my.id"),
  title: {
    default: "CV GASELA GROUP — Holding Perusahaan Cikoneng, Ciamis",
    template: "%s | CV GASELA GROUP",
  },
  description:
    "CV GASELA GROUP adalah holding perusahaan terkemuka di Cikoneng, Ciamis sejak 1996. Menaungi DN Gasela Motor, DN Gasela Futsal, DN Gasela Sellular & Plastik, dan Makaroni Cap Ikan Tawes.",
  keywords: [
    // Brand utama — semua varian penulisan
    "CV GASELA",
    "CV Gasela",
    "cv gasela",
    "CV. GASELA",
    "Gasela Group",
    "Gasela Grup",
    "GASELA GROUP",
    "gasela group",
    "CV Gasela Group",
    "CV GASELA GROUP",
    "Gasela",
    "gasela",
    "GASELA",
    "DN Gasela",
    "dn gasela",
    // Unit bisnis
    "Gasela Motor",
    "gasela motor",
    "DN Gasela Motor",
    "bengkel Gasela",
    "Gasela Futsal",
    "gasela futsal",
    "Futsal Stadium Gasela",
    "Gasela Futsal Stadium",
    "GOR Gasela",
    "Gasela Sellular",
    "Gasela Plastik",
    "gasela plastik",
    "toko plastik Gasela",
    // Produk ikonik
    "Makaroni Cap Ikan Tawes",
    "makaroni cap ikan tawes",
    "Makaroni Ikan Tawes",
    "Makaroni Spesial Cap Ikan Tawes",
    "Makroni Ikan Tawes",
    "Makroni Cap Ikan Tawes",
    "makaroni goreng ciamis",
    "camilan ciamis",
    "snack cikoneng",
    "oleh-oleh ciamis",
    // Lokasi
    "Cikoneng",
    "cikoneng",
    "Kabupaten Ciamis",
    "Ciamis",
    "ciamis",
    "Jawa Barat",
    "Priangan Timur",
    "Kecamatan Cikoneng",
    "Jl. Raya Cikoneng",
    // Bisnis lokal — motor/otomotif
    "bengkel mobil ciamis",
    "bengkel mobil cikoneng",
    "cuci steam ciamis",
    "cuci steam cikoneng",
    "servis mobil ciamis",
    "tune up mobil ciamis",
    "salon mobil ciamis",
    "spooring ciamis",
    "balancing ciamis",
    "sparepart mobil ciamis",
    "otomotif cikoneng",
    // Bisnis lokal — futsal
    "futsal ciamis",
    "lapangan futsal ciamis",
    "lapangan futsal cikoneng",
    "sewa lapangan futsal ciamis",
    "booking futsal ciamis",
    "GOR futsal ciamis",
    "futsal Priangan Timur",
    // Bisnis lokal — sellular & plastik
    "toko plastik ciamis",
    "distributor plastik ciamis",
    "plastik kemasan ciamis",
    "voucher pulsa cikoneng",
    "cetak foto cikoneng",
    "fotocopy cikoneng",
    "atk cikoneng",
    // HRIS
    "GaselaPulse",
    "GaselaPulse HRIS",
    "HRIS Gasela",
    "sistem HRIS ciamis",
    "software HRIS Indonesia",
    // Informasi umum
    "profil perusahaan gasela",
    "holding company ciamis",
    "holding perusahaan ciamis",
    "grup bisnis ciamis",
    "pusat bisnis cikoneng",
    "perusahaan cikoneng",
  ],
  authors: [{ name: "CV GASELA GROUP", url: "https://gasela.my.id" }],
  creator: "CV GASELA GROUP",
  publisher: "CV GASELA GROUP",
  category: "Business",
  classification: "Local Business, Automotive, Sports, Retail, Food Manufacturing",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://gasela.my.id",
  },
  openGraph: {
    title: "CV GASELA GROUP — Holding Perusahaan Cikoneng, Ciamis",
    description:
      "Holding perusahaan terkemuka di Cikoneng, Ciamis sejak 1996. Menaungi DN Gasela Motor, DN Gasela Futsal, DN Gasela Sellular & Plastik, serta Makaroni Cap Ikan Tawes.",
    url: "https://gasela.my.id",
    siteName: "CV GASELA GROUP",
    images: [
      {
        url: "/gasela_hd_hero.png",
        width: 1200,
        height: 630,
        alt: "CV GASELA GROUP — Holding Perusahaan Cikoneng, Ciamis, Jawa Barat",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CV GASELA GROUP — Holding Perusahaan Cikoneng, Ciamis",
    description:
      "Holding perusahaan terkemuka di Cikoneng, Ciamis sejak 1996: Gasela Motor, Gasela Futsal Stadium, Toko Plastik & Sellular, serta Makaroni Cap Ikan Tawes.",
    images: ["/gasela_hd_hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/cvgasela.png",
  },
  verification: {
    google: "google0eda516565717526",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}