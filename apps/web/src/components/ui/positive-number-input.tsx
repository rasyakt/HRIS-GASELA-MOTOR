import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PositiveNumberInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number | string | undefined | null;
  onChangeValue?: (numValue: number, rawString: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
}

export const PositiveNumberInput = React.forwardRef<HTMLInputElement, PositiveNumberInputProps>(
  (
    {
      className,
      value,
      onChangeValue,
      onChange,
      allowDecimal = false,
      min = 0,
      max,
      disabled,
      placeholder = '0',
      ...props
    },
    ref
  ) => {
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
        ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))
      ) {
        return;
      }

      // Explicitly block minus, plus, scientific 'e'
      if (e.key === '-' || e.key === '+' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        return;
      }

      // If decimal is allowed, permit one dot or comma
      if (allowDecimal && (e.key === '.' || e.key === ',')) {
        const currentStr = String(value ?? '');
        if (currentStr.includes('.') || currentStr.includes(',')) {
          e.preventDefault();
        }
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
      let cleaned = allowDecimal
        ? pastedText.replace(/[^0-9.]/g, '')
        : pastedText.replace(/\D/g, '');

      if (!cleaned) return;

      let numVal = parseFloat(cleaned) || 0;
      if (min !== undefined && numVal < min) numVal = min;
      if (max !== undefined && numVal > max) numVal = max;

      onChangeValue?.(numVal, String(numVal));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;
      if (allowDecimal) {
        // Replace comma with dot
        raw = raw.replace(',', '.');
        // Allow at most one dot and only digits
        const parts = raw.split('.');
        if (parts.length > 2) {
          raw = parts[0] + '.' + parts.slice(1).join('');
        }
        raw = raw.replace(/[^0-9.]/g, '');
      } else {
        raw = raw.replace(/\D/g, '');
      }

      let numVal = raw ? parseFloat(raw) || 0 : 0;
      if (min !== undefined && numVal < min) numVal = min;
      if (max !== undefined && numVal > max) numVal = max;

      onChangeValue?.(numVal, raw);
      if (onChange) {
        e.target.value = raw;
        onChange(e);
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 font-semibold',
          className
        )}
        {...props}
      />
    );
  }
);

PositiveNumberInput.displayName = 'PositiveNumberInput';
