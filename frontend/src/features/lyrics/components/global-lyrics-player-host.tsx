import YouTube from 'react-youtube';
import { useLyricsPlayerContext } from '../context/lyrics-player-context';

type GlobalLyricsPlayerHostProps = {
  mode?: 'hidden' | 'panel';
};

export function GlobalLyricsPlayerHost({ mode = 'hidden' }: GlobalLyricsPlayerHostProps) {
  const { nowPlaying, handlePlayerReady, handlePlayerStateChange } = useLyricsPlayerContext();

  if (!nowPlaying?.videoId) {
    return null;
  }

  const isPanelMode = mode === 'panel';

  return (
    <div
      className={
        isPanelMode
          ? 'aspect-video w-full overflow-hidden bg-surface-high'
          : 'pointer-events-none fixed -bottom-20 -right-20 z-[-1] h-1 w-1 overflow-hidden opacity-0'
      }
      aria-hidden={isPanelMode ? undefined : 'true'}
    >
      <YouTube
        key={nowPlaying.videoId}
        videoId={nowPlaying.videoId}
        opts={{
          width: isPanelMode ? '100%' : '1',
          height: isPanelMode ? '100%' : '1',
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1
          }
        }}
        className={
          isPanelMode
            ? 'h-full w-full [&>iframe]:h-full [&>iframe]:w-full'
            : 'h-1 w-1 [&>iframe]:h-1 [&>iframe]:w-1'
        }
        onReady={handlePlayerReady}
        onStateChange={handlePlayerStateChange}
      />
    </div>
  );
}
