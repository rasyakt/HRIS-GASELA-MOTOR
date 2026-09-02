import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number | string | undefined | null;
  onChangeValue?: (numericValue: number, rawString: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  min?: number;
  max?: number;
}

/**
 * Format a numeric string or number into Indonesian thousand separator (e.g. 5000000 -> "5.000.000")
 */
export function formatRupiahDisplay(val: number | string | undefined | null): string {
  if (val === '' || val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

/**
 * Parse numeric digits from a string (e.g. "5.000.000" -> 5000000)
 */
export function parseRupiahDigits(val: string): number {
  const digits = val.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onChangeValue,
      onChange,
      prefix = 'Rp',
      min = 0,
      max,
      disabled,
      placeholder = '0',
      ...props
    },
    ref
  ) => {
    // Format incoming value with dots
    const displayValue = React.useMemo(() => {
      return formatRupiahDisplay(value);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation and edit shortcuts
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
        // Allow Ctrl/Cmd + A, C, V, X, Z
        ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))
      ) {
        return;
      }

      // Explicitly block minus, plus, scientific 'e', decimals, and letters
      if (e.key === '-' || e.key === '+' || e.key.toLowerCase() === 'e' || e.key === '.' || e.key === ',') {
        e.preventDefault();
        return;
      }

      // Only allow 0-9
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      // Strip everything except digits
      const digitsOnly = pastedText.replace(/\D/g, '');
      if (!digitsOnly) return;

      let numVal = parseInt(digitsOnly, 10);
      if (min !== undefined && numVal < min) numVal = min;
      if (max !== undefined && numVal > max) numVal = max;

      onChangeValue?.(numVal, String(numVal));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      // Strip everything except digits
      const digitsOnly = rawInput.replace(/\D/g, '');
      
      let numVal = digitsOnly ? parseInt(digitsOnly, 10) : 0;
      if (min !== undefined && numVal < min) numVal = min;
      if (max !== undefined && numVal > max) numVal = max;

      onChangeValue?.(numVal, digitsOnly);
      if (onChange) {
        e.target.value = digitsOnly;
        onChange(e);
      }
    };

    return (
      <div className="relative flex w-full items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 select-none text-xs font-bold text-zinc-400 dark:text-zinc-500">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 font-semibold',
            prefix ? 'pl-9 pr-3' : 'px-3',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
