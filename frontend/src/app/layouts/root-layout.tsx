import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FooterPlayer } from '../../features/lyrics/components/footer-player';
import { GlobalLyricsPlayerHost } from '../../features/lyrics/components/global-lyrics-player-host';
import { useLyricsPlayerContext } from '../../features/lyrics/context/lyrics-player-context';
import { SettingsAuthModal } from '../../shared/components/layout/settings-auth-modal';

export function RootLayout({ children }: PropsWithChildren) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClosingTransition, setIsClosingTransition] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const shouldLockViewport = isSettingsOpen || isClosingTransition;
  const location = useLocation();
  const navigate = useNavigate();
  const {
    nowPlaying,
    lines,
    activeLineIndex,
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    volume,
    loopIndices,
    togglePlayPause,
    jumpToAdjacentLine,
    cycleSpeed,
    toggleLoop,
    setVolume,
    seekTo,
    clearNowPlaying
  } = useLyricsPlayerContext();

  // Hide Top bar and Bottom nav in the workspace
  const isWorkspace = location.pathname.startsWith('/lyrics');
  const shouldShowGlobalFooterPlayer = !isWorkspace && Boolean(nowPlaying?.videoId);

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
      <GlobalLyricsPlayerHost mode={isWorkspace ? 'workspace-docked' : 'hidden'} />
      <div
        className={`relative z-0 transition-all duration-700 ${
          shouldLockViewport ? 'scale-105 select-none blur-[40px]' : ''
        }`}
      >
        <main
          className={`dot-grid min-h-screen w-full overflow-x-hidden overflow-y-auto ${
            !isWorkspace ? 'pt-8 pb-28 md:pb-8' : ''
          }`}
        >
          {children}
        </main>
      </div>
      <SettingsAuthModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />
      {shouldShowGlobalFooterPlayer && nowPlaying && (
        <FooterPlayer
          lines={lines}
          activeLineIndex={activeLineIndex}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          volume={volume}
          loopActive={loopIndices.length > 0}
          isKaraokeMode={false}
          songTitle={nowPlaying.songTitle}
          artistName={nowPlaying.artistName}
          thumbnail={nowPlaying.thumbnail}
          onTogglePlayPause={togglePlayPause}
          onPrevLine={() => jumpToAdjacentLine(-1)}
          onNextLine={() => jumpToAdjacentLine(1)}
          onCycleSpeed={cycleSpeed}
          onToggleLoop={toggleLoop}
          onVolumeChange={setVolume}
          onSeek={seekTo}
          onToggleKaraokeMode={() => {
            navigate(`/lyrics?url=${encodeURIComponent(nowPlaying.queryUrl)}`, {
              state: {
                from: `${location.pathname}${location.search}`
              }
            });
          }}
          onOpenLyrics={() => {
            navigate(`/lyrics?url=${encodeURIComponent(nowPlaying.queryUrl)}`, {
              state: {
                from: `${location.pathname}${location.search}`
              }
            });
          }}
          onStop={clearNowPlaying}
          showKaraokeToggle={false}
        />
      )}
    </div>
  );
}
