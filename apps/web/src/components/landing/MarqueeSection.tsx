'use client';

/**
 * MarqueeSection.tsx
 * ──────────────────
 * Corporate ticker ribbon showcasing CV GASELA GROUP business lines.
 * Clean, subtle, theme-aware with pause-on-hover.
 */

import { useLandingContent } from './LandingContentProvider';

export function MarqueeSection() {
  const { content } = useLandingContent();
  const items = content.marquee.items;

  return (
    <section
      aria-hidden
      className="relative border-y border-slate-200/80 bg-slate-100/70 dark:border-zinc-800/80 dark:bg-zinc-900/40 overflow-hidden py-3.5"
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
            {items.map((item) => (
              <div key={`${dup}-${item.id}`} className="flex items-center gap-4 sm:gap-6 px-6 sm:px-8">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight whitespace-nowrap">
                  {item.name}
                </span>
                <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-600/20 px-2 py-0.5 rounded-md whitespace-nowrap uppercase tracking-wider">
                  {item.tag}
                </span>
                <div className="h-3 w-px bg-slate-300 dark:bg-zinc-700 mx-2" aria-hidden="true" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Edge gradient masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-slate-50 to-transparent dark:from-zinc-950 dark:to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-slate-50 to-transparent dark:from-zinc-950 dark:to-transparent" />
    </section>
  );
}

