import { useEffect, useState } from 'react';

/**
 * Custom hook untuk detect online/offline status
 * Mendengarkan event online/offline dari browser
 * 
 * @returns boolean - true jika online, false jika offline
 * 
 * @example
 * const isOnline = useOnlineStatus();
 * 
 * if (!isOnline) {
 *   return <div>Anda sedang offline. Cek koneksi internet.</div>;
 * }
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
