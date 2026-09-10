'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Membersihkan input nomor telepon Indonesia:
 * - Menghilangkan karakter non-digit (kecuali '+' di awal saat parsing)
 * - Menghapus awalan '+62', '62'
 * - Menghapus angka '0' di depan (leading zero)
 * Hasil akhir: digit murni nomor nasional (contoh: '81234567890')
 */
export function cleanIndonesianPhone(val?: string | null): string {
  if (!val) return '';
  let str = String(val).trim();

  // Bersihkan karakter selain digit dan tanda '+'
  str = str.replace(/[^\d+]/g, '');

  // Hilangkan awalan +62 atau 62
  if (str.startsWith('+62')) {
    str = str.slice(3);
  } else if (str.startsWith('62')) {
    str = str.slice(2);
  }

  // Hilangkan awalan 0 berulang jika ada (misal '0812' -> '812')
  while (str.startsWith('0')) {
    str = str.slice(1);
  }

  // Ambil hanya digit angka
  return str.replace(/\D/g, '');
}

/**
 * Mengubah nomor menjadi format internasional E.164 (+62xxxxxxxx)
 */
export function formatToE164(val?: string | null): string {
  const digits = cleanIndonesianPhone(val);
  return digits ? `+62${digits}` : '';
}

export interface PhoneInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value?: string | null;
  onChange?: (value: string) => void;
  onChangeValue?: (e164Value: string, nationalValue: string) => void;
  maskType?: 'phone';
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      value,
      onChange,
      onChangeValue,
      disabled,
      maskType,
      placeholder = '81234567890',
      maxLength = 15,
      ...props
    },
    ref
  ) => {
    const [revealed, setRevealed] = React.useState(false);

    // Ambil digit murni tanpa awalan 0 / +62 / 62 untuk ditampilkan di dalam input
    const nationalDigits = cleanIndonesianPhone(value);

    // Format tampilan jika field dalam mode disabled & masking aktif
    const getDisplayValue = () => {
      if (!disabled || !maskType || revealed) {
        return nationalDigits;
      }
      if (!nationalDigits) return '';
      // Masking 4 digit awal & 4 digit akhir, tengahnya bintang
      if (nationalDigits.length <= 6) {
        return nationalDigits.replace(/.(?=.{2})/g, '*');
      }
      const start = nationalDigits.slice(0, 3);
      const end = nationalDigits.slice(-4);
      return `${start}****${end}`;
    };

    const handleProcessChange = (rawText: string) => {
      const cleaned = cleanIndonesianPhone(rawText);
      const e164 = cleaned ? `+62${cleaned}` : '';

      onChange?.(e164);
      onChangeValue?.(e164, cleaned);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleProcessChange(e.target.value);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      handleProcessChange(pasted);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Izinkan tombol kontrol standar
      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ];

      if (
        allowedKeys.includes(e.key) ||
        ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))
      ) {
        return;
      }

      // Jika input masih kosong dan user menekan angka 0, cegah agar tidak bisa diketik
      if (!nationalDigits && e.key === '0') {
        e.preventDefault();
        return;
      }

      // Hanya izinkan input digit 0-9
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <div
        className={cn(
          'relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent text-base transition-colors md:text-sm',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          disabled
            ? 'pointer-events-none cursor-not-allowed bg-input/50 opacity-50 dark:bg-input/80'
            : 'dark:bg-input/30',
          className
        )}
      >
        {/* Prefix Badge +62 */}
        <div
          className={cn(
            'flex h-full shrink-0 select-none items-center gap-1.5 border-r border-input bg-zinc-100/90 px-2.5 font-medium text-xs text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 rounded-l-[7px]'
          )}
        >
          <svg className="size-3.5 rounded-[2px] shadow-2xs border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0" viewBox="0 0 3 2">
            <rect width="3" height="1" fill="#e11d48" />
            <rect y="1" width="3" height="1" fill="#ffffff" />
          </svg>
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">+62</span>
        </div>

        {/* Text Input */}
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          disabled={disabled}
          value={getDisplayValue()}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn(
            'h-full w-full min-w-0 bg-transparent px-2.5 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
            disabled && maskType && nationalDigits ? 'pr-8' : ''
          )}
          {...props}
        />

        {/* Eye Toggle untuk Masking Mode */}
        {disabled && maskType && nationalDigits ? (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            title={revealed ? 'Sembunyikan nomor' : 'Tampilkan nomor lengkap'}
            className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none"
          >
            {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        ) : null}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
