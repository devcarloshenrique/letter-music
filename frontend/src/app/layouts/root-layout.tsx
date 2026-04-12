import type { PropsWithChildren } from 'react';
import { BottomNav } from '../../shared/components/layout/bottom-nav';
import { Navbar } from '../../shared/components/layout/navbar';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen bg-background text-on-surface'>
      <Navbar />
      <main className='dot-grid flex min-h-screen flex-col items-center justify-center px-8 pb-20 pt-24'>{children}</main>
      <BottomNav />
    </div>
  );
}
