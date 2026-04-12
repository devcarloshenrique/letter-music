import { lazy, Suspense } from 'react';
import { Skeleton } from '../../shared/components/feedback/skeleton';

const HomePage = lazy(() => import('../../features/home/pages/home-page'));

export function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton className='h-[40vh] w-full' />}>
      <HomePage />
    </Suspense>
  );
}
