import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full border border-transparent px-5 py-2.5 text-sm font-bold premium-transition interactive-scale focus-ring disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-background hover:brightness-110 hover:shadow-glow-primary',
        secondary: 'bg-surface-high text-secondary border-outline-variant hover:border-secondary hover:shadow-glow-secondary',
        ghost: 'bg-transparent text-tertiary border-outline hover:border-primary hover:text-primary'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
