'use client';

/**
 * QuickLinksSection.tsx
 * ─────────────────────
 * Official Link Hub for Makaroni Cap Ikan Tawes (CV GASELA GROUP).
 * Clean, structured, enterprise-grade channel directory.
 */

import { useRef } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { SiWhatsapp, SiShopee, SiTiktok, SiInstagram } from 'react-icons/si';

gsap.registerPlugin(ScrollTrigger);

// ── Official Brand Icons ──────────────────────────────────────────────────────

function WhatsAppIcon() {
  return <SiWhatsapp className="w-5 h-5 text-white" />;
}

function ShopeeIcon() {
  return <SiShopee className="w-5 h-5 text-white" />;
}

function TikTokIcon() {
  return <SiTiktok className="w-4.5 h-4.5 text-white dark:text-zinc-950" />;
}

function InstagramIcon() {
  return <SiInstagram className="w-5 h-5 text-white" />;
}

// ── Link Data ──────────────────────────────────────────────────────────

const OFFICIAL_LINKS = [
  {
    id: 'whatsapp-cs',
    title: 'WhatsApp Pemesanan CS Official',
    desc: 'Layanan cepat pemesanan retail & grosir (0859-2189-4777)',
    icon: WhatsAppIcon,
    url: 'https://wa.me/6285921894777',
    bgColor: 'bg-[#25D366] text-white',
  },
  {
    id: 'shopee-official',
    title: 'Shopee Official Store (capikantawes)',
    desc: 'Toko resmi e-commerce Makaroni Cap Ikan Tawes',
    icon: ShopeeIcon,
    url: 'https://shopee.co.id/capikantawes',
    bgColor: 'bg-[#EE4D2D] text-white',
  },
  {
    id: 'reseller-program',
    title: 'Kemitraan Reseller & Distributor',
    desc: 'Program kemitraan harga pabrik langsung dari Cikoneng, Ciamis',
    icon: WhatsAppIcon,
    url: 'https://wa.me/6285921894777?text=Halo%20Admin%20Makaroni%20Ikan%20Tawes%2C%20saya%20tertarik%20menjadi%20Reseller%2FDistributor',
    bgColor: 'bg-[#25D366] text-white',
  },
  {
    id: 'tiktok-official',
    title: 'TikTok @capikantawes',
    desc: 'Akun konten resmi dan TikTok Shop CV GASELA GROUP',
    icon: TikTokIcon,
    url: 'https://www.tiktok.com/@capikantawes?is_from_webapp=1&sender_device=pc',
    bgColor: 'bg-slate-900 dark:bg-white text-white dark:text-zinc-950',
  },
  {
    id: 'instagram-official',
    title: 'Instagram @makaroni.ikantawes',
    desc: 'Dokumentasi pabrik, katalog produk, dan informasi resmi',
    icon: InstagramIcon,
    url: 'https://www.instagram.com/makaroni.ikantawes?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    bgColor: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white',
  },
];

export function QuickLinksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.ql-head',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.ql-head', start: 'top 85%' },
        },
      );

      gsap.fromTo(
        '.ql-card',
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.06,
          scrollTrigger: { trigger: '.ql-grid', start: 'top 85%' },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="official-links"
      className="relative bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-2xs"
      aria-labelledby="quicklinks-heading"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ── Brand Logo & Header ── */}
        <div className="ql-head text-center space-y-2">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-red-600 shadow-2xs">
              <Image
                src="/makaroni_logo.png"
                alt="Makaroni Cap Ikan Tawes Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              @Makaronikantawes Official
            </span>
          </div>

          <h2
            id="quicklinks-heading"
            className="font-sans text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight"
          >
            Akses Pemesanan &amp; Kemitraan Resmi
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-normal">
            Pilih saluran resmi di bawah untuk transaksi langsung atau informasi kemitraan
          </p>
        </div>

        {/* ── Links List ── */}
        <div className="ql-grid space-y-2.5">
          {OFFICIAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ql-card group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 hover:border-slate-300 dark:hover:border-zinc-600 transition-all duration-200 shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${link.bgColor}`}>
                    <Icon />
                  </div>
                  <div>
                    <h3 className="font-sans text-xs sm:text-sm font-bold text-slate-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{link.desc}</p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

