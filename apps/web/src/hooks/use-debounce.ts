import { useEffect, useState } from 'react';

/**
 * Custom hook untuk debounce value
 * Berguna untuk search input agar tidak trigger query terlalu sering
 * 
 * @param value - Value yang akan di-debounce
 * @param delay - Delay dalam milliseconds (default: 300ms)
 * @returns Debounced value
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 * 
 * useEffect(() => {
 *   // API call dengan debouncedSearch
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
