'use client';

/**
 * AboutSection.tsx
 * ────────────────
 * Editorial corporate biography for CV GASELA GROUP:
 * narrative, founder profile, company journey timeline and core values.
 * Clean, structured, theme-aware enterprise aesthetic.
 */

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Award, Users2, Building } from 'lucide-react';
import { useLandingContent } from './LandingContentProvider';

gsap.registerPlugin(ScrollTrigger);

const PILLAR_ICONS = [ShieldCheck, Award, Users2, Building];

export function AboutSection() {
  const { content } = useLandingContent();
  const about = content.about;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.about-title',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about-title', start: 'top 85%' },
        },
      );

      gsap.fromTo(
        '.about-copy',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about-copy', start: 'top 88%' },
        },
      );

      gsap.fromTo(
        '.timeline-item',
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: '.timeline', start: 'top 80%' },
        },
      );

      gsap.fromTo(
        '.pillar-card',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.pillars-grid', start: 'top 85%' },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative bg-slate-50 dark:bg-zinc-950 py-24 sm:py-28 px-5 sm:px-8 lg:px-12 border-b border-slate-200/80 dark:border-zinc-800/80"
      aria-labelledby="about-heading"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* ── Story + Timeline ── */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Narrative & Founder */}
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              {about.eyebrow}
            </p>

            <h2
              id="about-heading"
              className="about-title font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight"
            >
              {about.title} {about.highlight}
            </h2>

            <div className="about-copy space-y-4 text-slate-600 dark:text-zinc-300 leading-relaxed text-sm sm:text-base font-normal">
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Founder Card */}
            <div className="about-copy mt-8 p-6 rounded-xl border border-slate-200/90 bg-white/90 dark:bg-zinc-900/80 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-base dark:bg-amber-500 dark:text-zinc-950">
                  {about.founderInitials}
                </div>
                <div>
                  <h3 className="text-slate-950 dark:text-white font-extrabold text-base tracking-tight">
                    {about.founderName}
                  </h3>
                  <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                    {about.founderRole}
                  </p>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-2 italic leading-relaxed">
                    &ldquo;{about.founderQuote}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="lg:col-span-6">
            <div className="timeline relative pl-7 sm:pl-8 space-y-6">
              {/* Vertical Connector Line */}
              <div className="absolute left-1.75 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-zinc-800" />

              {about.timeline.map((item) => (
                <div key={item.id} className="timeline-item relative">
                  {/* Node Dot */}
                  <span className="absolute -left-7 sm:-left-8 top-3.5 w-3.5 h-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-amber-600 dark:border-zinc-950 dark:bg-amber-400 shadow-xs" />

                  <div className="p-5 rounded-2xl border border-slate-200/90 bg-white/90 dark:bg-zinc-900/70 dark:border-zinc-800 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Tahun {item.year}
                      </span>
                    </div>
                    <h3 className="text-slate-950 dark:text-white font-bold text-base tracking-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4 Corporate Pillars Bento Grid ── */}
        <div className="pillars-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 sm:mt-20">
          {about.pillars.map((pillar, i) => {
            const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
            return (
              <div
                key={pillar.title}
                className="pillar-card p-6 rounded-2xl bg-white/90 border border-slate-200/90 dark:bg-zinc-900/70 dark:border-zinc-800 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white tracking-tight mb-1.5">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

