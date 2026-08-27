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
    default: "CV GASELA GROUP — GaselaPulse",
    template: "%s | CV GASELA GROUP",
  },
  description:
    "Portal Resmi CV GASELA GROUP & GaselaPulse HRIS. Konglomerasi bisnis terkemuka di Cikoneng, Ciamis: DN Gasela Motor, DN Gasela Futsal Stadium, DN Gasela Sellular & Plastik, dan Makaroni Spesial Cap Ikan Tawes.",
  keywords: [
    "CV GASELA",
    "Gasela Group",
    "Gasela Motor",
    "Gasela Futsal",
    "Gasela Sellular",
    "Gasela Plastik",
    "Makaroni Ikan Tawes",
    "GaselaPulse",
    "HRIS Gasela",
    "Cikoneng",
    "Ciamis",
    "Jawa Barat",
    "Bengkel Mobil Ciamis",
    "Futsal Ciamis",
    "Otomotif Cikoneng",
    "Distributor Plastik Cikoneng",
  ],
  authors: [{ name: "CV GASELA GROUP", url: "https://gasela.my.id" }],
  creator: "CV GASELA GROUP",
  publisher: "CV GASELA GROUP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://gasela.my.id",
  },
  openGraph: {
    title: "CV GASELA GROUP — Konglomerasi Bisnis Cikoneng, Ciamis",
    description:
      "Portal Resmi CV GASELA GROUP & Sistem Manajemen HRIS GaselaPulse. Menaungi Gasela Motor, Gasela Futsal, Gasela Sellular & Plastik, serta Makaroni Cap Ikan Tawes.",
    url: "https://gasela.my.id",
    siteName: "CV GASELA GROUP",
    images: [
      {
        url: "/gasela_hd_hero.png",
        width: 1200,
        height: 630,
        alt: "CV GASELA GROUP Cikoneng Ciamis",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CV GASELA GROUP — Cikoneng, Ciamis",
    description:
      "Gabungan bisnis terkemuka di Cikoneng, Ciamis: Bengkel Mobil, Futsal Stadium, Sellular & Plastik, dan Makaroni Ikan Tawes.",
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