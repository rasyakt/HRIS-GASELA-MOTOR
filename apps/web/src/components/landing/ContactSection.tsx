'use client';

/**
 * ContactSection.tsx
 * ──────────────────
 * Luxury contact directory for CV GASELA GROUP.
 * Fully theme-aware (light & dark).
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useLandingContent } from './LandingContentProvider';

gsap.registerPlugin(ScrollTrigger);

const OFFICE_DOTS = ['bg-blue-500 dark:bg-blue-400', 'bg-red-500 dark:bg-red-400'];

export function ContactSection() {
  const { content } = useLandingContent();
  const contact = content.contact;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.contact-head',
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-head', start: 'top 85%' },
        },
      );

      gsap.fromTo(
        '.contact-card',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.09,
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
      className="relative bg-zinc-50 dark:bg-zinc-950 py-32 px-6 md:px-12 lg:px-24 border-t border-zinc-200/80 dark:border-white/[0.06] overflow-hidden"
      aria-labelledby="contact-heading"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/3 w-150 h-150 bg-amber-400/10 rounded-full blur-[150px] pointer-events-none dark:bg-amber-400/[0.05]" />
      <div className="absolute bottom-0 right-1/4 w-125 h-125 bg-blue-500/10 rounded-full blur-[130px] pointer-events-none dark:bg-blue-600/[0.07]" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* ── Header ── */}
        <div className="contact-head flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-200/80 pb-12 dark:border-white/[0.07]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 dark:bg-amber-300" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 dark:bg-amber-300" />
              </span>
              <span className="text-amber-600 dark:text-amber-300 text-xs font-bold tracking-[0.3em] uppercase">
                {contact.eyebrow}
              </span>
            </div>
            <h2
              id="contact-heading"
              className="font-display text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight"
            >
              {contact.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`mailto:${contact.emailAddress}`}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 text-white font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300 dark:from-amber-300 dark:via-amber-400 dark:to-amber-300 dark:text-zinc-950 dark:shadow-[0_10px_40px_-10px_rgba(251,191,36,0.6)] dark:hover:shadow-[0_12px_55px_-8px_rgba(251,191,36,0.8)]"
            >
              <Mail className="w-4 h-4" />
              <span>{contact.emailLabel}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full border border-zinc-300 bg-white/90 text-zinc-700 font-bold text-sm uppercase tracking-[0.15em] hover:border-zinc-400 hover:bg-white hover:text-zinc-900 transition-all duration-300 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-200 dark:hover:border-white/30 dark:hover:bg-white/[0.07] dark:hover:text-white"
            >
              Portal HRIS Karyawan
            </Link>
          </div>
        </div>

        {/* ── Office Grid ── */}
        <div className="contact-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {contact.offices.map((office, i) => (
            <div
              key={office.id}
              className="contact-card group relative p-7 rounded-2xl bg-white/80 border border-zinc-200/80 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-amber-500/30 hover:bg-white hover:-translate-y-1 shadow-lg shadow-zinc-900/5 dark:bg-white/[0.03] dark:border-white/[0.08] dark:hover:border-amber-300/25 dark:hover:bg-white/[0.05] dark:shadow-xl dark:shadow-black/30"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:via-amber-300/40" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  {office.name}
                </h3>
                <span className={`w-2 h-2 rounded-full ${OFFICE_DOTS[i % OFFICE_DOTS.length]} shadow-[0_0_12px_rgba(217,119,6,0.4)] dark:shadow-[0_0_12px_rgba(251,191,36,0.4)]`} />
              </div>

              <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-5">{office.services}</p>

              <div className="space-y-3 pt-5 border-t border-zinc-100 text-xs text-zinc-600 dark:border-white/[0.07] dark:text-zinc-400">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 dark:bg-white/[0.04] dark:border-white/[0.08]">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300/80" />
                  </span>
                  <span className="truncate font-medium">{office.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 dark:bg-white/[0.04] dark:border-white/[0.08]">
                    <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300/80" />
                  </span>
                  <span className="font-medium">{office.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sekretariat Band ── */}
        <div className="contact-card p-8 md:p-10 rounded-2xl border border-amber-500/25 bg-linear-to-r from-amber-500/[0.06] via-transparent to-blue-500/[0.06] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-lg shadow-zinc-900/5 dark:border-amber-300/20 dark:from-amber-300/[0.06] dark:via-transparent dark:to-blue-500/[0.06] dark:shadow-xl dark:shadow-black/30">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:bg-amber-300/10 dark:border-amber-300/30 dark:text-amber-300">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-1.5 dark:text-amber-300">
                {contact.addressLabel}
              </p>
              <p className="text-zinc-900 dark:text-white font-bold text-lg tracking-tight">
                {contact.addressTitle}
              </p>
              <p className="text-zinc-500 text-sm mt-1">{contact.addressSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:justify-end">
            <a
              href={`tel:${contact.addressPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 border border-zinc-300 bg-white px-5 py-3 rounded-full hover:border-amber-500/50 hover:text-amber-600 transition-all duration-300 dark:text-white dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-amber-300/40 dark:hover:text-amber-200"
            >
              <Phone className="w-4 h-4 text-amber-500 dark:text-amber-300" />
              {contact.addressPhone}
            </a>
            <a
              href={`mailto:${contact.emailAddress}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 border border-zinc-300 bg-white px-5 py-3 rounded-full hover:border-amber-500/50 hover:text-amber-600 transition-all duration-300 dark:text-white dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-amber-300/40 dark:hover:text-amber-200"
            >
              <Mail className="w-4 h-4 text-amber-500 dark:text-amber-300" />
              {contact.emailAddress}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
