'use client';

/**
 * ForceDark.tsx
 * ──────────────
 * Pins the /landing route to the dark theme by adding the `dark` class to
 * <html>, regardless of the user's saved portal theme preference.
 */

import { useEffect } from 'react';

export function ForceDark() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return null;
}
