import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-full border border-outline-variant bg-surface-high px-4 py-3 text-sm text-tertiary placeholder:text-outline premium-transition focus:border-primary focus:shadow-glow-primary focus-ring',
        className
      )}
      {...props}
    />
  );
}
