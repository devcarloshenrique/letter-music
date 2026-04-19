import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return <div className={cn('glass-surface rounded-[24px]', className)} {...props} />;
}
