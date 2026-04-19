import { cn } from '../../lib/cn';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-[24px] bg-surface-high', className)} />;
}
