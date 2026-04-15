import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { homeService } from '../../home/services/home.service';
import type { SyncedLine } from '../../home/types/home.types';
import { LyricsControlPanel } from '../components/lyrics-control-panel';
import { LyricsPanel } from '../components/lyrics-panel';
import { useLyricsPlayer } from '../hooks/use-lyrics-player';
import { extractYouTubeVideoId } from '../utils/lyrics-time.utils';

export default function LyricsWorkspacePage() {
  const [searchParams] = useSearchParams();
  const queryUrl = searchParams.get('url')?.trim() ?? '';
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from;

  const syncedLyricsQuery = useQuery({
    queryKey: ['synced-lyrics', queryUrl],
    queryFn: () => homeService.fetchSyncedLyrics(queryUrl),
    enabled: queryUrl.length > 0
  });

  const lines = syncedLyricsQuery.data?.lines ?? [];
  const lineRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const manualScrollPauseUntilRef = useRef(0);

  const {
    activeLineIndex,
    playbackRate,
    playbackSpeeds,
    loopIndices,
    loopRange,
    setLoopRange,
    setSpeed,
    seekToLine,
    toggleLoopLine,
    toggleLoop,
    handlePlayerReady,
    handlePlayerStateChange
  } = useLyricsPlayer(lines);

  const handleLineClick = useCallback(
    (line: SyncedLine) => {
      seekToLine(line);
    },
    [seekToLine]
  );

  const handleLoopToggle = useCallback((index: number) => {
    toggleLoopLine(lines[index]);
  }, [lines, toggleLoopLine]);

  const registerLineRef = useCallback((index: number, element: HTMLButtonElement | null) => {
    lineRefs.current[index] = element;
  }, []);

  const handleManualScroll = useCallback(() => {
    manualScrollPauseUntilRef.current = Date.now() + 1800;
  }, []);

  useEffect(() => {
    if (activeLineIndex < 0) {
      return;
    }

    // Disable auto-scroll when a loop is active to prevent jittering up/down
    if (loopIndices.length > 0) {
      return;
    }

    if (Date.now() <= manualScrollPauseUntilRef.current) {
      return;
    }

    const lineElement = lineRefs.current[activeLineIndex];
    if (lineElement) {
      // Use block: 'center' to keep the active line in middle of the screen
      // behavior: 'smooth' is nice, but for very fast songs it might lag behind.
      // We keep it smooth for premium feel but ensure the 50ms trigger is fast enough.
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex]);

  const videoId = extractYouTubeVideoId(syncedLyricsQuery.data?.video_url);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (typeof from === 'string' && from.length > 0) {
      navigate(from);
      return;
    }

    navigate('/');
  }, [from, navigate]);

  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      <main className='flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row'>
        <div className='flex h-[50vh] min-h-0 flex-col border-b border-outline-variant/10 lg:h-full lg:flex-[65] lg:border-b-0'>
          <LyricsPanel
            queryUrl={queryUrl}
            lines={lines}
            activeLineIndex={activeLineIndex}
            loopIndices={loopIndices}
            loopRange={loopRange}
            isLoading={syncedLyricsQuery.isLoading}
            errorMessage={syncedLyricsQuery.isError ? syncedLyricsQuery.error.message : undefined}
            onLineClick={handleLineClick}
            onLoopToggle={handleLoopToggle}
            onLoopRangeChange={setLoopRange}
            registerLineRef={registerLineRef}
            onManualScroll={handleManualScroll}
            onBack={handleBack}
          />
        </div>

        <div className='flex min-h-0 flex-1 flex-col overflow-y-auto lg:h-full lg:flex-[35] lg:border-l lg:border-outline-variant/10'>
          <LyricsControlPanel
            videoId={videoId}
            playbackRate={playbackRate}
            playbackSpeeds={playbackSpeeds}
            loopActive={loopIndices.length > 0}
            onSpeedSelect={setSpeed}
            onToggleLoop={toggleLoop}
            onPlayerReady={handlePlayerReady}
            onPlayerStateChange={handlePlayerStateChange}
          />
        </div>
      </main>
    </div>
  );
}