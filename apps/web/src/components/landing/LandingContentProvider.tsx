'use client';

/**
 * LandingContentProvider.tsx
 * ──────────────────────────
 * Fetches the landing page content from the backend (merged with admin
 * overrides server-side) and exposes it through React context. If the
 * request fails (backend offline, first paint), it falls back to
 * DEFAULT_LANDING_CONTENT so the public site never breaks.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_LANDING_CONTENT,
  type LandingContent,
  type LandingSection,
} from '@gasela/shared-types';
import { api } from '@/lib/api-client';

interface LandingContentContextValue {
  content: LandingContent;
  /** Meta dari backend (kapan tiap section terakhir diubah) */
  meta: Partial<Record<LandingSection, { updatedAt: string }>>;
  loading: boolean;
  refetch: () => Promise<void>;
}

const LandingContentContext = createContext<LandingContentContextValue | null>(null);

export function LandingContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [meta, setMeta] = useState<Partial<Record<LandingSection, { updatedAt: string }>>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const remote = await api<LandingContent>('/api/landing');
      setContent(remote);
      setMeta({});
    } catch {
      // Backend tidak terjangkau → pakai default
      setContent(DEFAULT_LANDING_CONTENT);
    }
  }, []);

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  return (
    <LandingContentContext.Provider value={{ content, meta, loading, refetch }}>
      {children}
    </LandingContentContext.Provider>
  );
}

export function useLandingContent(): LandingContentContextValue {
  const ctx = useContext(LandingContentContext);
  if (!ctx) {
    throw new Error('useLandingContent harus dipakai di dalam <LandingContentProvider>');
  }
  return ctx;
}
