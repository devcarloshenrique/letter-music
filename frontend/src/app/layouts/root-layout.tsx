import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from '../../shared/components/layout/bottom-nav';
import { Navbar } from '../../shared/components/layout/navbar';
import { SettingsAuthModal } from '../../shared/components/layout/settings-auth-modal';

export function RootLayout({ children }: PropsWithChildren) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClosingTransition, setIsClosingTransition] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const shouldLockViewport = isSettingsOpen || isClosingTransition;
  const location = useLocation();

  // Hide Top bar and Bottom nav in the workspace
  const isWorkspace = location.pathname.startsWith('/lyrics');

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (shouldLockViewport) {
      html.style.overflow = 'hidden';
      html.style.height = '100%';
      body.style.overflow = 'hidden';
      body.style.height = '100%';
      body.style.position = 'fixed';
      body.style.width = '100%';
      body.style.overscrollBehavior = 'none';
    }

    return () => {
      html.style.overflow = '';
      html.style.height = '';
      body.style.overflow = '';
      body.style.height = '';
      body.style.position = '';
      body.style.width = '';
      body.style.overscrollBehavior = '';
    };
  }, [shouldLockViewport]);

  const handleOpenSettings = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsClosingTransition(false);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setIsClosingTransition(true);

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsClosingTransition(false);
      closeTimeoutRef.current = null;
    }, 720);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-on-surface">
      {!isWorkspace && <Navbar onOpenSettings={handleOpenSettings} />}
      <div
        className={`relative z-0 transition-all duration-700 ${
          shouldLockViewport ? 'scale-105 select-none blur-[40px]' : ''
        }`}
      >
        <main
          className={`dot-grid min-h-screen w-full overflow-x-hidden overflow-y-auto ${
            !isWorkspace ? 'pt-[76px] pb-28 md:pb-8' : ''
          }`}
        >
          {children}
        </main>
      </div>
      {!isWorkspace && <BottomNav />}
      <SettingsAuthModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}
