import YouTube from 'react-youtube';
import { useEffect, useRef } from 'react';
import { useLyricsPlayerContext } from '../context/lyrics-player-context';

type GlobalLyricsPlayerHostProps = {
  mode?: 'hidden' | 'panel' | 'workspace-docked';
};

const WORKSPACE_VIDEO_SLOT_ID = 'lyrics-sidebar-video-slot';

export function GlobalLyricsPlayerHost({ mode = 'hidden' }: GlobalLyricsPlayerHostProps) {
  const { nowPlaying, handlePlayerReady, handlePlayerStateChange } = useLyricsPlayerContext();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'workspace-docked') {
      if (wrapperRef.current) {
        wrapperRef.current.style.cssText = '';
      }
      return;
    }

    let frameId: number;

    const syncPosition = () => {
      const slot = document.getElementById(WORKSPACE_VIDEO_SLOT_ID);
      const wrapper = wrapperRef.current;
      
      if (!wrapper) {
        frameId = requestAnimationFrame(syncPosition);
        return;
      }

      if (!slot) {
        wrapper.style.opacity = '0';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-9999px';
      } else {
        const rect = slot.getBoundingClientRect();
        
        // Hide if outside viewport
        if (rect.width === 0 || rect.height === 0 || rect.left >= window.innerWidth || rect.right <= 0) {
          wrapper.style.opacity = '0';
          wrapper.style.pointerEvents = 'none';
          wrapper.style.position = 'fixed';
          wrapper.style.top = '-9999px';
        } else {
          wrapper.style.position = 'fixed';
          wrapper.style.top = `${rect.top}px`;
          wrapper.style.left = `${rect.left}px`;
          wrapper.style.width = `${rect.width}px`;
          wrapper.style.height = `${rect.height}px`;
          wrapper.style.zIndex = '50';
          wrapper.style.opacity = '1';
          wrapper.style.pointerEvents = 'auto';
          wrapper.style.borderRadius = '12px'; // matching rounded-xl
        }
      }
      
      frameId = requestAnimationFrame(syncPosition);
    };

    frameId = requestAnimationFrame(syncPosition);

    return () => cancelAnimationFrame(frameId);
  }, [mode, nowPlaying?.videoId]);

  if (!nowPlaying?.videoId) {
    return null;
  }

  const isVisibleMode = mode === 'panel' || mode === 'workspace-docked';

  return (
    <div
      ref={wrapperRef}
      className={
        isVisibleMode
          ? 'fixed -top-[9999px] overflow-hidden z-[50] opacity-0 pointer-events-none'
          : 'pointer-events-none fixed -bottom-20 -right-20 z-[-1] h-1 w-1 overflow-hidden opacity-0'
      }
      aria-hidden={!isVisibleMode ? 'true' : undefined}
    >
      <YouTube
        key={nowPlaying.videoId}
        videoId={nowPlaying.videoId}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            autoplay: 1,
            iv_load_policy: 3
          }
        }}
        className={
          isVisibleMode
            ? 'h-full w-full [&>iframe]:h-full [&>iframe]:w-full'
            : 'h-1 w-1 [&>iframe]:h-1 [&>iframe]:w-1'
        }
        onReady={handlePlayerReady}
        onStateChange={handlePlayerStateChange}
      />
    </div>
  );
}
