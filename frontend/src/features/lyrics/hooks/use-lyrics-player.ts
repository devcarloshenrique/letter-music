import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SyncedLine } from '../../home/types/home.types';
import { parseSyncedTimeToSeconds } from '../utils/lyrics-time.utils';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25] as const;

type PlayerLike = {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
};

type AbRepeatState = {
  enabled: boolean;
  start: number | null;
  end: number | null;
};

export function useLyricsPlayer(lines: SyncedLine[]) {
  const playerRef = useRef<PlayerLike | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [lineLoopEnabled, setLineLoopEnabled] = useState(false);
  const [abRepeat, setAbRepeat] = useState<AbRepeatState>({
    enabled: false,
    start: null,
    end: null
  });

  // Track if player is ready to ensure intervals and other dependent effects start at the right time.
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const activeLineIndex = useMemo(() => {
    if (lines.length === 0) return -1;

    // A small offset handles jitter and allows snappy transitions
    const time = currentTime + 0.05;

    // Find the current active line.
    // If we're between lines, we want to keep the previous line active until the next line starts.
    const index = lines.findIndex((line, i) => {
      const start = parseSyncedTimeToSeconds(line.start);
      // For the last line, we just check if time >= start and time <= end + some buffer.
      // But for middle lines, we check if time looks like it belongs to this line or the gap after it.
      const nextLine = lines[i + 1];
      const nextStart = nextLine ? parseSyncedTimeToSeconds(nextLine.start) : Infinity;

      // The line is active if the time is after its start and before the next line's start.
      // For the last line, we check if the time is between start and end (with some margin so it doesn't just disappear).
      if (nextLine) {
        return time >= start && time < nextStart;
      }
      
      const end = parseSyncedTimeToSeconds(line.end);
      // Keep the last line active for a short while after it ends, or exactly until end if preferred.
      // E.g., stay active until 5 seconds after its end if there's no next line.
      return time >= start && time <= end + 5;
    });

    return index;
  }, [lines, currentTime]);

  const seekTo = useCallback((seconds: number) => {
    if (!playerRef.current) {
      return;
    }

    playerRef.current.seekTo(Math.max(0, seconds), true);
  }, []);

  const seekToLine = useCallback(
    (line: SyncedLine) => {
      seekTo(parseSyncedTimeToSeconds(line.start));
      playerRef.current?.playVideo();
      setIsPlaying(true);
    },
    [seekTo]
  );

  const setSpeed = useCallback((rate: number) => {
    setPlaybackRate(rate);
    playerRef.current?.setPlaybackRate(rate);
  }, []);

  const cycleSpeed = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.findIndex((speed) => speed === playbackRate);
    const nextRate = PLAYBACK_SPEEDS[(currentIndex + 1) % PLAYBACK_SPEEDS.length];
    setSpeed(nextRate);
  }, [playbackRate, setSpeed]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      return;
    }

    playerRef.current.playVideo();
    setIsPlaying(true);
  }, [isPlaying]);

  const jumpToAdjacentLine = useCallback(
    (direction: -1 | 1) => {
      if (lines.length === 0) {
        return;
      }

      const anchorIndex = activeLineIndex < 0 ? 0 : activeLineIndex;
      const targetIndex = Math.min(Math.max(anchorIndex + direction, 0), lines.length - 1);
      seekToLine(lines[targetIndex]);
    },
    [activeLineIndex, lines, seekToLine]
  );

  const toggleAbRepeat = useCallback(() => {
    if (!abRepeat.enabled) {
      const sourceLine = lines[activeLineIndex];
      const start = sourceLine ? parseSyncedTimeToSeconds(sourceLine.start) : Math.max(0, currentTime - 2);
      const end = sourceLine ? parseSyncedTimeToSeconds(sourceLine.end) : currentTime + 2;

      setAbRepeat({
        enabled: true,
        start,
        end
      });

      return;
    }

    setAbRepeat({ enabled: false, start: null, end: null });
  }, [abRepeat.enabled, activeLineIndex, currentTime, lines]);

  const handlePlayerReady = useCallback(
    (event: { target: unknown }) => {
      playerRef.current = event.target as PlayerLike;
      playerRef.current.setPlaybackRate(playbackRate);
      setIsPlayerReady(true);
    },
    [playbackRate]
  );

  const handlePlayerStateChange = useCallback((event: { data: number }) => {
    setIsPlaying(event.data === 1);
  }, []);

  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) {
      return;
    }

    const timer = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      const liveTime = player.getCurrentTime();
      
      // Update at 50ms intervals for high precision sync
      // We check if the time has actually changed to avoid wasteful renders
      setCurrentTime((prevTime) => {
        if (Math.abs(prevTime - liveTime) > 0.05) {
          return liveTime;
        }
        return prevTime;
      });

      if (lineLoopEnabled && activeLineIndex >= 0) {
        const activeLine = lines[activeLineIndex];
        const lineEnd = parseSyncedTimeToSeconds(activeLine.end);

        if (liveTime >= lineEnd) {
          player.seekTo(parseSyncedTimeToSeconds(activeLine.start), true);
        }
      }

      if (abRepeat.enabled && abRepeat.start !== null && abRepeat.end !== null && liveTime >= abRepeat.end) {
        player.seekTo(abRepeat.start, true);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [isPlayerReady, abRepeat.enabled, abRepeat.end, abRepeat.start, activeLineIndex, lineLoopEnabled, lines]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if (isEditable) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === ' ') {
        event.preventDefault();
        togglePlayPause();
      }

      if (key === 's') {
        event.preventDefault();
        cycleSpeed();
      }

      if (key === 'l') {
        event.preventDefault();
        setLineLoopEnabled((current) => !current);
      }

      if (key === 'r') {
        event.preventDefault();
        toggleAbRepeat();
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        jumpToAdjacentLine(-1);
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        jumpToAdjacentLine(1);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [cycleSpeed, jumpToAdjacentLine, toggleAbRepeat, togglePlayPause]);

  return {
    activeLineIndex,
    currentTime,
    isPlaying,
    playbackRate,
    playbackSpeeds: PLAYBACK_SPEEDS,
    lineLoopEnabled,
    abRepeat,
    setSpeed,
    seekToLine,
    cycleSpeed,
    togglePlayPause,
    setLineLoopEnabled,
    toggleAbRepeat,
    handlePlayerReady,
    handlePlayerStateChange
  };
}