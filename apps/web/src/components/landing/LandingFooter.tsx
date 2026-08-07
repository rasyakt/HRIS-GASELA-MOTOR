/**
 * LandingFooter.tsx
 * ─────────────────
 * Sleek, high-contrast minimalist corporate footer.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Instagram, Facebook, ArrowRight } from 'lucide-react';

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900 pt-20 pb-10 px-6 md:px-16 lg:px-24" role="contentinfo">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
        
        {/* 1. Brand & About */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <Image src="/cvgasela.png" alt="CV Gasela Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <span className="text-slate-900 dark:text-white font-extrabold text-sm tracking-wider uppercase leading-none block">
                CV. GASELA GROUP
              </span>
              <span className="text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-widest uppercase block mt-1">
                Terintegrasi Sempurna
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed pr-4">
            Ekosistem bisnis terpadu yang menaungi sektor otomotif, ritel, arena olahraga, dan manufaktur pangan dengan standar profesionalisme tinggi di Jawa Barat.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2. Lini Perusahaan */}
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-sm tracking-wider uppercase mb-6">Lini Perusahaan</h3>
          <ul className="space-y-4">
            <li>
              <Link href="/landing/unit/motor" className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 group transition-colors">
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /> Gasela Motor
              </Link>
            </li>
            <li>
              <Link href="/landing/unit/sellular" className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 group transition-colors">
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /> Gasela Sellular & Plastik
              </Link>
            </li>
            <li>
              <Link href="/landing/unit/futsal" className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 group transition-colors">
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /> Gasela Futsal Stadium
              </Link>
            </li>
            <li>
              <Link href="/landing/unit/makaroni" className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 group transition-colors">
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /> Makaroni Cap Ikan Tawes
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Akses Cepat */}
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-sm tracking-wider uppercase mb-6">Akses Cepat</h3>
          <ul className="space-y-4">
            <li><a href="#hero" className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Beranda</a></li>
            <li><a href="#about" className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Biografi Perusahaan</a></li>
            <li><a href="#portfolio" className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Portofolio Bisnis</a></li>
            <li>
              <Link href="/login" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Portal HRIS Karyawan
              </Link>
            </li>
          </ul>
        </div>

        {/* 4. Hubungi Kami */}
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-sm tracking-wider uppercase mb-6">Hubungi Kami</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
                JL. Raya Cikoneng - Ciamis,<br/>Jawa Barat, Indonesia
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">(0265) 776103</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">info@gaselagrup.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
          © {year} CV GASELA GROUP. Hak cipta dilindungi undang-undang.
        </p>
        <div className="flex items-center gap-6 text-xs font-medium text-slate-400 dark:text-zinc-500">
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Kebijakan Privasi</a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Syarat & Ketentuan</a>
        </div>
      </div>
    </footer>
  );
}
