import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Skeleton } from '../../shared/components/feedback/skeleton';

const HomePage = lazy(() => import('../../features/home/pages/home-page'));
const LyricsWorkspacePage = lazy(() => import('../../features/lyrics/pages/lyrics-workspace-page'));

export function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton className='h-[40vh] w-full' />}>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/lyrics' element={<LyricsWorkspacePage />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Suspense>
  );
}
