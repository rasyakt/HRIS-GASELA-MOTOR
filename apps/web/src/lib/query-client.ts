'use client';

import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function useQueryClientProvider() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return queryClient;
}