import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-outline-variant bg-surface p-6 shadow-ambient premium-transition hover:border-primary/50',
        className
      )}
      {...props}
    />
  );
}
