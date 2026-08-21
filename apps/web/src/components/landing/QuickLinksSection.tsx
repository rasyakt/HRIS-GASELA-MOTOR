'use client';

/**
 * QuickLinksSection.tsx
 * ─────────────────────
 * Official Link Hub for Makaroni Cap Ikan Tawes (CV GASELA GROUP).
 * Features official brand icons for WhatsApp, TikTok, Linktree, and Instagram.
 * Clean, streamlined, and high-impact design.
 */

import { useRef } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Sparkles, ArrowDown } from 'lucide-react';
import { SiWhatsapp, SiShopee, SiTiktok, SiInstagram } from 'react-icons/si';

gsap.registerPlugin(ScrollTrigger);

// ── Official App Brand Icons Helper Wrappers ──────────────────────────────────

function WhatsAppIcon() {
  return <SiWhatsapp className="w-6 h-6 text-white" />;
}

function ShopeeIcon() {
  return <SiShopee className="w-6 h-6 text-white" />;
}

function TikTokIcon() {
  return <SiTiktok className="w-5.5 h-5.5 text-white dark:text-zinc-950" />;
}

function InstagramIcon() {
  return <SiInstagram className="w-6 h-6 text-white" />;
}

// ── Link Data ──────────────────────────────────────────────────────────

const OFFICIAL_LINKS = [
  {
    id: 'whatsapp-cs',
    title: 'WhatsApp Pemesanan CS Official',
    desc: 'Chat langsung via WhatsApp 0859-2189-4777',
    icon: WhatsAppIcon,
    url: 'https://wa.me/6285921894777',
    bgColor: 'bg-[#25D366] shadow-md shadow-emerald-500/20 border-transparent',
  },
  {
    id: 'shopee-official',
    title: 'Shopee Official Store (capikantawes)',
    desc: 'Toko resmi Shopee Makaroni Cap Ikan Tawes',
    icon: ShopeeIcon,
    url: 'https://shopee.co.id/capikantawes',
    bgColor: 'bg-[#EE4D2D] shadow-md shadow-orange-500/20 border-transparent',
  },
  {
    id: 'tiktok-official',
    title: 'TikTok @capikantawes',
    desc: 'Konten seru, video produk & TikTok Shop resmi',
    icon: TikTokIcon,
    url: 'https://www.tiktok.com/@capikantawes?is_from_webapp=1&sender_device=pc',
    bgColor: 'bg-zinc-950 dark:bg-white shadow-md border-transparent',
  },
  {
    id: 'reseller-program',
    title: 'Kemitraan Reseller & Distributor',
    desc: 'Harga khusus pabrik langsung dari Cikoneng, Ciamis',
    icon: WhatsAppIcon,
    url: 'https://wa.me/6285921894777?text=Halo%20Admin%20Makaroni%20Ikan%20Tawes%2C%20saya%20tertarik%20menjadi%20Reseller%2FDistributor',
    bgColor: 'bg-[#25D366] shadow-md shadow-emerald-500/20 border-transparent',
  },
  {
    id: 'instagram-official',
    title: 'Instagram @makaroni.ikantawes',
    desc: 'Update postingan, resep & cerita seru pabrik',
    icon: InstagramIcon,
    url: 'https://www.instagram.com/makaroni.ikantawes?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    bgColor: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md shadow-pink-500/20 border-transparent',
  },
];

export function QuickLinksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.ql-head',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.ql-head', start: 'top 85%' },
        }
      );

      gsap.fromTo(
        '.ql-card',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.ql-grid', start: 'top 85%' },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="official-links"
      className="relative bg-zinc-50 dark:bg-zinc-950 py-10 md:py-20 px-4 md:px-12 lg:px-24 border-t border-zinc-200/80 dark:border-white/6 overflow-hidden"
      aria-labelledby="quicklinks-heading"
    >
      <div className="max-w-3xl mx-auto space-y-5 md:space-y-8 relative z-10">
        {/* ── Brand Logo & Header ── */}
        <div className="ql-head text-center space-y-2 md:space-y-3">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-500/30 shadow-md p-0.5 bg-red-600 shrink-0">
              <Image
                src="/makaroni_logo.png"
                alt="Makaroni Cap Ikan Tawes Logo"
                fill
                className="object-cover rounded-full"
              />
            </div>
            <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              @Makaronikantawes
            </span>
          </div>

          <h2
            id="quicklinks-heading"
            className="font-sans text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight pt-1"
          >
            Akses Cepat &amp; Pemesanan Resmi
          </h2>

          <p className="text-xs sm:text-sm md:text-base font-medium text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
            <span>Nostalgia ada, jajanan viral juga ada 😎</span>
            <span>— Belanja gampang klik link di bawah</span>
            <ArrowDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400 animate-bounce inline-block" />
          </p>
        </div>

        {/* ── Links List with Official App Brand Logos ── */}
        <div className="ql-grid space-y-2 md:space-y-3">
          {OFFICIAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ql-card group flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-white border border-zinc-200/80 shadow-sm hover:border-amber-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 dark:bg-zinc-900/80 dark:border-white/10 dark:hover:border-amber-300/30"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${link.bgColor}`}>
                    <Icon />
                  </div>
                  <div>
                    <h3 className="font-sans text-xs sm:text-sm md:text-base font-bold text-zinc-900 dark:text-white tracking-normal leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs md:text-sm font-normal text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 line-clamp-1">{link.desc}</p>
                  </div>
                </div>

                <div className="shrink-0 pl-2 sm:pl-3">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
