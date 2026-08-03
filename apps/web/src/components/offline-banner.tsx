'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

/**
 * Banner yang muncul ketika user offline
 * Automatically shows/hides based on network status
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="size-4" />
      <span>Anda sedang offline. Beberapa fitur mungkin tidak tersedia.</span>
    </div>
  );
}
