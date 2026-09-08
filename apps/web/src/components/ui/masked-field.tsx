'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import {
  maskNik,
  maskNpwp,
  maskBankAccount,
  maskPhone,
  maskEmail,
} from '@/lib/format';

export type MaskType = 'nik' | 'npwp' | 'bank' | 'phone' | 'email' | 'salary' | 'custom';

interface MaskedFieldProps {
  value?: string | number | null;
  type?: MaskType;
  customMask?: string;
  className?: string;
  textClassName?: string;
  allowToggle?: boolean;
  allowCopy?: boolean;
  emptyText?: string;
}

export function MaskedField({
  value,
  type = 'custom',
  customMask,
  className = '',
  textClassName = '',
  allowToggle = true,
  allowCopy = false,
  emptyText = '—',
}: MaskedFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (value === null || value === undefined || value === '') {
    return <span className={`text-zinc-400 dark:text-zinc-500 ${textClassName}`}>{emptyText}</span>;
  }

  const strValue = String(value);

  const getMaskedValue = (): string => {
    if (customMask) return customMask;
    switch (type) {
      case 'nik':
        return maskNik(strValue);
      case 'npwp':
        return maskNpwp(strValue);
      case 'bank':
        return maskBankAccount(strValue);
      case 'phone':
        return maskPhone(strValue);
      case 'email':
        return maskEmail(strValue);
      case 'salary':
        return 'Rp ••••••••';
      default:
        if (strValue.length <= 4) return '••••';
        return `${strValue.slice(0, 2)}••••${strValue.slice(-2)}`;
    }
  };

  const displayText = isRevealed ? strValue : getMaskedValue();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(strValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`font-mono text-inherit select-all ${textClassName}`}>
        {displayText}
      </span>

      {allowToggle && (
        <button
          type="button"
          onClick={() => setIsRevealed(!isRevealed)}
          title={isRevealed ? 'Sembunyikan data' : 'Tampilkan data lengkap'}
          className="inline-flex items-center justify-center p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors focus:outline-none"
        >
          {isRevealed ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </button>
      )}

      {allowCopy && (
        <button
          type="button"
          onClick={handleCopy}
          title="Salin data asli"
          className="inline-flex items-center justify-center p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors focus:outline-none"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      )}
    </span>
  );
}
