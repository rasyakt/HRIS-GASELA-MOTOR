'use client';

/**
 * MarqueeSection.tsx
 * ──────────────────
 * Infinite scrolling ticker of the CV GASELA GROUP business lines.
 * Pure CSS animation — pauses on hover. Theme-aware (light & dark).
 */

import { useLandingContent } from './LandingContentProvider';

export function MarqueeSection() {
  const { content } = useLandingContent();
  const items = content.marquee.items;

  return (
    <section
      aria-hidden
      className="relative border-y border-zinc-200/70 bg-zinc-100/60 dark:border-white/[0.06] dark:bg-zinc-950 overflow-hidden py-6"
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
            {items.map((item) => (
              <div key={`${dup}-${item.id}`} className="flex items-center gap-6 md:gap-10 px-6 md:px-10">
                <span className="text-sm md:text-base font-black uppercase tracking-[0.25em] text-zinc-700 whitespace-nowrap dark:text-white/85">
                  {item.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 whitespace-nowrap dark:text-amber-300/70">
                  {item.tag}
                </span>
                <span className="text-amber-500/60 select-none dark:text-amber-300/50" aria-hidden>
                  ✦
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-linear-to-r from-zinc-50 to-transparent dark:from-zinc-950 dark:to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-linear-to-l from-zinc-50 to-transparent dark:from-zinc-950 dark:to-transparent" />
    </section>
  );
}
