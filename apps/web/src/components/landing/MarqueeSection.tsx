/**
 * MarqueeSection.tsx
 * ──────────────────
 * Infinite scrolling ticker of the CV GASELA GROUP business lines.
 * Pure CSS animation — pauses on hover.
 */

const ITEMS = [
  { name: 'Gasela Motor', tag: 'Otomotif & Servis' },
  { name: 'Gasela Sellular & Plastik', tag: 'Ritel & Percetakan' },
  { name: 'Gasela Futsal Stadium', tag: 'Arena Olahraga' },
  { name: 'Makaroni Cap Ikan Tawes', tag: 'Industri Pangan' },
];

export function MarqueeSection() {
  return (
    <section
      aria-hidden
      className="relative border-y border-white/[0.06] bg-zinc-950 overflow-hidden py-6"
    >
      <div className="flex w-max animate-marquee">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
            {ITEMS.map((item) => (
              <div key={`${dup}-${item.name}`} className="flex items-center gap-6 md:gap-10 px-6 md:px-10">
                <span className="text-sm md:text-base font-black uppercase tracking-[0.25em] text-white/85 whitespace-nowrap">
                  {item.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/70 whitespace-nowrap">
                  {item.tag}
                </span>
                <span className="text-amber-300/50 select-none" aria-hidden>
                  ✦
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-linear-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-linear-to-l from-zinc-950 to-transparent" />
    </section>
  );
}
