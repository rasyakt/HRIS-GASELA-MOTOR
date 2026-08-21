'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useQueryClientProvider } from '@/lib/query-client';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClientProvider();
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
