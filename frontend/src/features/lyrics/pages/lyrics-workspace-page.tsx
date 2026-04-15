import { useQuery } from '@tanstack/react-query';
import { PanelRightOpen } from 'lucide-react';
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
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isAutoFollowEnabled, setIsAutoFollowEnabled] = useState(true);
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

  const {
    setNowPlaying,
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
    setIsAutoFollowEnabled(false);
  }, []);

  const handleResumeAutoFollow = useCallback(() => {
    setIsAutoFollowEnabled(true);
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

    if (!isAutoFollowEnabled) {
      return;
    }

    const lineElement = lineRefs.current[activeLineIndex];
    if (lineElement) {
      // Use block: 'center' to keep the active line in middle of the screen
      // behavior: 'smooth' is nice, but for very fast songs it might lag behind.
      // We keep it smooth for premium feel but ensure the 50ms trigger is fast enough.
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex, isAutoFollowEnabled, loopIndices.length, viewMode]);

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

  useEffect(() => {
    if (!queryUrl || !videoId) {
      return;
    }

    setNowPlaying({
      queryUrl,
      videoId,
      songTitle,
      artistName,
      thumbnail
    });
  }, [artistName, queryUrl, setNowPlaying, songTitle, thumbnail, videoId]);

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
        <div
          className={`flex h-[50vh] min-h-0 flex-col border-b border-outline-variant/10 lg:h-full lg:flex-1 lg:border-b-0 ${
            isSidePanelOpen ? 'lg:pr-[26rem]' : ''
          }`}
        >
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
            isAutoFollowEnabled={isAutoFollowEnabled}
            onResumeAutoFollow={handleResumeAutoFollow}
            isSidePanelOpen={isSidePanelOpen}
            onBack={handleBack}
          />
        </div>

        {!isSidePanelOpen && (
          <button
            type='button'
            onClick={() => setIsSidePanelOpen(true)}
            className='interactive-scale premium-transition fixed right-4 top-4 z-40 hidden items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-high/90 px-3 py-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant backdrop-blur-md hover:text-secondary lg:inline-flex'
            aria-label='Abrir menu lateral'
          >
            <PanelRightOpen size={14} /> Menu
          </button>
        )}

        <div
          className={`fixed bottom-20 right-0 top-0 z-30 hidden w-[26rem] border-l border-outline-variant/10 bg-surface transition-transform duration-300 lg:flex md:bottom-24 ${
            isSidePanelOpen ? 'translate-x-0' : 'translate-x-full'
          } ${isSidePanelOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          aria-hidden={!isSidePanelOpen}
        >
          <LyricsControlPanel
            videoId={videoId}
            playbackRate={playbackRate}
            volume={volume}
            playbackSpeeds={playbackSpeeds}
            loopActive={loopIndices.length > 0}
            onSpeedSelect={setSpeed}
            onVolumeChange={setVolume}
            onToggleLoop={toggleLoop}
            onClose={() => setIsSidePanelOpen(false)}
            onMute={() => setVolume(0)}
          />
        </div>

        <div className='flex min-h-0 flex-1 flex-col lg:hidden'>
          <LyricsControlPanel
            videoId={videoId}
            playbackRate={playbackRate}
            volume={volume}
            playbackSpeeds={playbackSpeeds}
            loopActive={loopIndices.length > 0}
            onSpeedSelect={setSpeed}
            onVolumeChange={setVolume}
            onToggleLoop={toggleLoop}
            onMute={() => setVolume(0)}
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