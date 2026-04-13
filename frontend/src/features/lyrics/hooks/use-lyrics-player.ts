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

  const activeLineIndex = useMemo(() => {
    if (lines.length === 0) return -1;

    // Fast track: check current time against each line
    // We add a small offset (0.05s) to handle jitter and ensure the change feels snappy
    const time = currentTime + 0.05;

    return lines.findIndex((line) => {
      const start = parseSyncedTimeToSeconds(line.start);
      const end = parseSyncedTimeToSeconds(line.end);
      return time >= start && time <= end;
    });
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
    },
    [playbackRate]
  );

  const handlePlayerStateChange = useCallback((event: { data: number }) => {
    setIsPlaying(event.data === 1);
  }, []);

  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    const timer = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      const liveTime = player.getCurrentTime();
      
      // Update at 50ms intervals for high precision sync
      setCurrentTime(liveTime);

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
  }, [abRepeat.enabled, abRepeat.end, abRepeat.start, activeLineIndex, lineLoopEnabled, lines]);

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