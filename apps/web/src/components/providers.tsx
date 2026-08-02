'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useQueryClientProvider } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClientProvider();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
