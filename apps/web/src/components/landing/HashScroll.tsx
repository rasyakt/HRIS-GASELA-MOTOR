'use client';

/**
 * HashScroll.tsx
 * ──────────────
 * Handles smooth-scrolling to hash anchors (e.g. /landing#portfolio)
 * after client-side navigation. Works reliably with GSAP pinned sections.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
