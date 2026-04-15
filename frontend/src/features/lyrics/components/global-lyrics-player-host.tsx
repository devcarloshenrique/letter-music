import YouTube from 'react-youtube';
import { useLyricsPlayerContext } from '../context/lyrics-player-context';

export function GlobalLyricsPlayerHost() {
  const { nowPlaying, handlePlayerReady, handlePlayerStateChange } = useLyricsPlayerContext();

  if (!nowPlaying?.videoId) {
    return null;
  }

  return (
    <div className='pointer-events-none fixed -bottom-20 -right-20 z-[-1] h-1 w-1 overflow-hidden opacity-0' aria-hidden='true'>
      <YouTube
        key={nowPlaying.videoId}
        videoId={nowPlaying.videoId}
        opts={{
          width: '1',
          height: '1',
          playerVars: {
            rel: 0,
            modestbranding: 1
          }
        }}
        className='h-1 w-1 [&>iframe]:h-1 [&>iframe]:w-1'
        onReady={handlePlayerReady}
        onStateChange={handlePlayerStateChange}
      />
    </div>
  );
}
