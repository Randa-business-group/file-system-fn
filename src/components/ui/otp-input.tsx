'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

const OTPInput = React.forwardRef<HTMLInputElement, OTPInputProps>(
  ({ value = '', onChange, length = 6, disabled = false, className, ...props }, ref) => {
    const [otp, setOtp] = React.useState<string[]>(Array(length).fill(''));
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    // Sync external value with internal state
    React.useEffect(() => {
      if (value !== undefined) {
        const otpArray = value.replace(/\D/g, '').split('').slice(0, length);
        setOtp([...otpArray, ...Array(length - otpArray.length).fill('')]);
      }
    }, [value, length]);

    const handleChange = (index: number, val: string) => {
      const sanitized = val.replace(/\D/g, '');

      if (sanitized.length === 0) {
        // Handle backspace/delete
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
        return;
      }

      // Handle paste or multiple character input
      if (sanitized.length > 1) {
        const chars = sanitized.split('').slice(0, length);
        const newOtp = [...Array(length).fill('')];
        chars.forEach((char, i) => {
          if (i < length) {
            newOtp[i] = char;
          }
        });
        setOtp(newOtp);
        onChange?.(newOtp.join(''));

        // Focus last filled input or last input
        const nextIndex = Math.min(chars.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
        return;
      }

      // Single character input
      const newOtp = [...otp];
      newOtp[index] = sanitized;
      setOtp(newOtp);
      onChange?.(newOtp.join(''));

      // Move to next input
      if (index < length - 1 && sanitized) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        // If current input is empty and backspace is pressed, move to previous input
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text/plain');
      const sanitized = pastedData.replace(/\D/g, '');

      if (sanitized) {
        const chars = sanitized.split('').slice(0, length);
        const newOtp = [...Array(length).fill('')];
        chars.forEach((char, i) => {
          if (i < length) {
            newOtp[i] = char;
          }
        });
        setOtp(newOtp);
        onChange?.(newOtp.join(''));

        // Focus last filled input or last input
        const nextIndex = Math.min(chars.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
      }
    };

    return (
      <div className={cn('flex gap-1.5 justify-center sm:gap-2', className)}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
              // Forward ref to first input
              if (index === 0 && ref) {
                if (typeof ref === 'function') {
                  ref(el);
                } else {
                  ref.current = el;
                }
              }
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-center text-base font-semibold text-foreground transition-colors sm:h-12 sm:w-12 sm:text-lg',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              digit && 'border-primary'
            )}
            {...props}
          />
        ))}
      </div>
    );
  }
);

OTPInput.displayName = 'OTPInput';

export { OTPInput };
