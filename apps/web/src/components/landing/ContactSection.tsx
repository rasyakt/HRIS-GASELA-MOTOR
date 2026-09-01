'use client';

/**
 * ContactSection.tsx
 * ──────────────────
 * Corporate contact & branch directory for CV GASELA GROUP.
 * Clean, minimalist layout with verified phone numbers, addresses,
 * and direct communication channels.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useLandingContent } from './LandingContentProvider';

gsap.registerPlugin(ScrollTrigger);

export function ContactSection() {
  const { content } = useLandingContent();
  const contact = content.contact;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.contact-head',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-head', start: 'top 85%' },
        },
      );

      gsap.fromTo(
        '.contact-card',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.contact-grid', start: 'top 85%' },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative bg-slate-50/60 dark:bg-zinc-950 py-24 sm:py-28 px-5 sm:px-8 lg:px-12 border-b border-slate-200/70 dark:border-zinc-800/80"
      aria-labelledby="contact-heading"
    >
      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* ── Header ── */}
        <div className="contact-head flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/70 pb-8 dark:border-zinc-800/80">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              {contact.eyebrow}
            </p>
            <h2
              id="contact-heading"
              className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight"
            >
              {contact.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${contact.emailAddress}`}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow-sm transition-all duration-200 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{contact.emailLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-xs tracking-wide hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-white shadow-2xs"
            >
              Portal HRIS Karyawan
            </Link>
          </div>
        </div>

        {/* ── Branch Office Grid ── */}
        <div className="contact-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contact.offices.map((office) => (
            <div
              key={office.id}
              className="contact-card group p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-sans text-[15px] sm:text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                  {office.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-5">
                  {office.services}
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/70 text-xs">
                <div className="flex items-start gap-2 text-slate-600 dark:text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{office.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <a
                    href={`tel:${office.phone.replace(/[^0-9+]/g, '')}`}
                    className="font-medium text-slate-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    {office.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Headquarters Secretariat Card ── */}
        <div className="contact-card p-6 sm:p-7 rounded-2xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center text-slate-600 dark:text-zinc-300">
              <MapPin className="w-4.5 h-4.5 text-slate-500 dark:text-zinc-400" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                {contact.addressLabel}
              </span>
              <h3 className="text-slate-900 dark:text-white font-bold text-base sm:text-lg tracking-tight">
                {contact.addressTitle}
              </h3>
              <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
                {contact.addressSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${contact.addressPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 px-3.5 py-2 rounded-xl transition-all dark:text-zinc-300 dark:border-zinc-700/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:hover:text-white shadow-2xs group"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors" />
              <span>{contact.addressPhone}</span>
            </a>
            <a
              href={`mailto:${contact.emailAddress}`}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 px-3.5 py-2 rounded-xl transition-all dark:text-zinc-300 dark:border-zinc-700/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:hover:text-white shadow-2xs group"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors" />
              <span>{contact.emailAddress}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

