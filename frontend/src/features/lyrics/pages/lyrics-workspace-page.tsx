import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { homeService } from '../../home/services/home.service';
import type { SyncedLine } from '../../home/types/home.types';
import { FooterPlayer } from '../components/footer-player';
import { KaraokeView } from '../components/karaoke-view';
import { LyricsControlPanel } from '../components/lyrics-control-panel';
import { LyricsPanel } from '../components/lyrics-panel';
import { useLyricsPlayer } from '../hooks/use-lyrics-player';
import { extractYouTubeVideoId } from '../utils/lyrics-time.utils';

type ViewMode = 'list' | 'karaoke';

const formatSlug = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function LyricsWorkspacePage() {
  const [searchParams] = useSearchParams();
  const queryUrl = searchParams.get('url')?.trim() ?? '';
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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
    currentTime,
    duration,
    playbackRate,
    volume,
    playbackSpeeds,
    loopIndices,
    loopRange,
    setLoopRange,
    setSpeed,
    setVolume,
    seekTo,
    seekToLine,
    toggleLoopLine,
    cycleSpeed,
    togglePlayPause,
    jumpToAdjacentLine,
    toggleLoop,
    isPlaying,
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
    if (viewMode !== 'list') {
      return;
    }

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
  }, [activeLineIndex, loopIndices.length, viewMode]);

  const videoId = extractYouTubeVideoId(syncedLyricsQuery.data?.video_url);

  // Extract song metadata from URL
  const { songTitle, artistName } = useMemo(() => {
    const normalizedUrl = queryUrl.replace(/\/$/, '');
    const urlParts = normalizedUrl.split('/').filter(Boolean);
    const songSlug = urlParts[urlParts.length - 1] ?? '';
    const artistSlug = urlParts[urlParts.length - 2] ?? '';

    return {
      songTitle: formatSlug(songSlug) || 'Faixa sem título',
      artistName: formatSlug(artistSlug) || 'Artista'
    };
  }, [queryUrl]);

  // Get thumbnail
  const thumbnail = useMemo(() => videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined, [videoId]);

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

  const handleExitKaraoke = useCallback(() => {
    setViewMode('list');
  }, []);

  const handleToggleKaraokeMode = useCallback(() => {
    setViewMode((currentMode) => (currentMode === 'karaoke' ? 'list' : 'karaoke'));
  }, []);

  return (
    <div className='relative flex h-full w-full flex-col overflow-hidden'>
      <main
        className={`min-h-0 flex-1 flex-col overflow-hidden pb-20 md:pb-24 lg:flex-row ${
          viewMode === 'karaoke' ? 'hidden' : 'flex'
        }`}
        aria-hidden={viewMode === 'karaoke'}
      >
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

        <div className='flex min-h-0 flex-1 flex-col lg:h-full lg:flex-[35] lg:border-l lg:border-outline-variant/10'>
          <LyricsControlPanel
            videoId={videoId}
            playbackRate={playbackRate}
            volume={volume}
            playbackSpeeds={playbackSpeeds}
            loopActive={loopIndices.length > 0}
            onSpeedSelect={setSpeed}
            onVolumeChange={setVolume}
            onToggleLoop={toggleLoop}
            onPlayerReady={handlePlayerReady}
            onPlayerStateChange={handlePlayerStateChange}
          />
        </div>
      </main>

      {viewMode === 'karaoke' && (
        <main className='flex min-h-0 flex-1 flex-col overflow-hidden pb-20 md:pb-24'>
          <KaraokeView
            queryUrl={queryUrl}
            lines={lines}
            activeLineIndex={activeLineIndex}
            isLoading={syncedLyricsQuery.isLoading}
            errorMessage={syncedLyricsQuery.isError ? syncedLyricsQuery.error.message : undefined}
            videoId={videoId}
            onToggleViewMode={handleExitKaraoke}
            onPlayerReady={handlePlayerReady}
            onPlayerStateChange={handlePlayerStateChange}
          />
        </main>
      )}

      {/* Persistent Footer Player */}
      <FooterPlayer
        lines={lines}
        activeLineIndex={activeLineIndex}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        volume={volume}
        loopActive={loopIndices.length > 0}
        isKaraokeMode={viewMode === 'karaoke'}
        songTitle={songTitle}
        artistName={artistName}
        thumbnail={thumbnail}
        onTogglePlayPause={togglePlayPause}
        onPrevLine={() => jumpToAdjacentLine(-1)}
        onNextLine={() => jumpToAdjacentLine(1)}
        onCycleSpeed={cycleSpeed}
        onToggleLoop={toggleLoop}
        onVolumeChange={setVolume}
        onSeek={seekTo}
        onToggleKaraokeMode={handleToggleKaraokeMode}
      />
    </div>
  );
}