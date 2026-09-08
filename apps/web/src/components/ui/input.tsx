import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <InputPrimitive
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative w-full">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

interface MaskedInputProps extends React.ComponentProps<"input"> {
  maskType?: 'nik' | 'npwp' | 'bank' | 'phone' | 'email';
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, value, maskType, disabled, ...props }, ref) => {
    const [revealed, setRevealed] = React.useState(false);

    const getDisplayValue = () => {
      if (revealed || !disabled || value === undefined || value === null) {
        return value ?? '';
      }
      const str = String(value);
      if (!str) return '';
      switch (maskType) {
        case 'nik':
          return str.length < 10 ? str.replace(/.(?=.{2})/g, '*') : `${str.slice(0, 6)}******${str.slice(-4)}`;
        case 'npwp':
          return str.length < 8 ? str.replace(/.(?=.{2})/g, '*') : `${str.slice(0, 6)}******${str.slice(-3)}`;
        case 'bank':
          return str.length <= 6 ? str.replace(/.(?=.{2})/g, '•') : `${str.slice(0, 4)}••••${str.slice(-4)}`;
        case 'phone':
          return str.length <= 6 ? str.replace(/.(?=.{2})/g, '*') : `${str.slice(0, 4)}****${str.slice(-4)}`;
        case 'email': {
          const at = str.indexOf('@');
          if (at <= 1) return str;
          const u = str.slice(0, at);
          const d = str.slice(at);
          return u.length <= 2 ? `${u[0]}***${d}` : `${u[0]}***${u[u.length - 1]}${d}`;
        }
        default:
          return str;
      }
    };

    return (
      <div className="relative w-full">
        <Input
          className={cn(disabled && value ? "pr-9" : "", className)}
          value={getDisplayValue()}
          disabled={disabled}
          ref={ref}
          {...props}
        />
        {disabled && value ? (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            title={revealed ? 'Sembunyikan data' : 'Tampilkan data lengkap'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none p-0.5"
          >
            {revealed ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </button>
        ) : null}
      </div>
    );
  }
);
MaskedInput.displayName = "MaskedInput";

export { Input, PasswordInput, MaskedInput }

