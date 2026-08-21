'use client';

/**
 * ContactSection.tsx
 * ──────────────────
 * Corporate contact & branch directory for CV GASELA GROUP.
 * Clean, structured layout with verified phone numbers, addresses,
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
      className="relative bg-slate-50 dark:bg-zinc-950 py-24 sm:py-28 px-5 sm:px-8 lg:px-12 border-b border-slate-200/80 dark:border-zinc-800/80"
      aria-labelledby="contact-heading"
    >
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* ── Header ── */}
        <div className="contact-head flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-8 dark:border-zinc-800/80">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs tracking-wide shadow-xs hover:shadow-sm transition-all duration-200 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
            >
              <Mail className="w-4 h-4" />
              <span>{contact.emailLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-xs tracking-wide hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-white shadow-2xs"
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
              className="contact-card p-6 rounded-2xl bg-white/90 border border-slate-200/90 dark:bg-zinc-900/70 dark:border-zinc-800 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-sans text-base font-extrabold text-slate-950 dark:text-white tracking-tight">
                    {office.name}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
                  {office.services}
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{office.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <a
                    href={`tel:${office.phone.replace(/[^0-9+]/g, '')}`}
                    className="font-bold text-slate-900 dark:text-zinc-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {office.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Headquarters Secretariat Card ── */}
        <div className="contact-card p-6 sm:p-8 rounded-2xl border border-slate-200/90 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/70 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                {contact.addressLabel}
              </span>
              <h3 className="text-slate-950 dark:text-white font-extrabold text-lg tracking-tight">
                {contact.addressTitle}
              </h3>
              <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
                {contact.addressSubtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`tel:${contact.addressPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 border border-slate-300 bg-white px-4 py-2.5 rounded-xl hover:border-slate-400 transition-all dark:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {contact.addressPhone}
            </a>
            <a
              href={`mailto:${contact.emailAddress}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 border border-slate-300 bg-white px-4 py-2.5 rounded-xl hover:border-slate-400 transition-all dark:text-white dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {contact.emailAddress}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

