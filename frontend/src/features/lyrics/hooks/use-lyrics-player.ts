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
  getPlayerState: () => number;
};

export function useLyricsPlayer(lines: SyncedLine[]) {
  const playerRef = useRef<PlayerLike | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [loopIndices, setLoopIndices] = useState<number[]>([]);

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
    (line: SyncedLine, isShiftKey = false) => {
      const lineIndex = lines.indexOf(line);

      if (isShiftKey && lineIndex !== -1) {
        setLoopIndices((prev) => {
          if (prev.includes(lineIndex)) {
            return prev.filter((i) => i !== lineIndex).sort((a, b) => a - b);
          }
          return [...prev, lineIndex].sort((a, b) => a - b);
        });
      } else {
        setLoopIndices(lineIndex !== -1 ? [lineIndex] : []);
        seekTo(parseSyncedTimeToSeconds(line.start));
        playerRef.current?.playVideo();
        setIsPlaying(true);
      }
    },
    [lines, seekTo]
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

  const toggleLoop = useCallback(() => {
    if (loopIndices.length > 0) {
      setLoopIndices([]);
    } else if (activeLineIndex !== -1) {
      setLoopIndices([activeLineIndex]);
    }
  }, [activeLineIndex, loopIndices.length]);

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

      const playerState = player.getPlayerState();
      // Only run synchronization logic if the player is actually playing (State 1)
      if (playerState !== 1) {
        return;
      }

      const liveTime = player.getCurrentTime();

      // Update at 50ms intervals for high precision sync
      // We use a small threshold to avoid excessive state updates if the change is negligible
      setCurrentTime((prevTime) => {
        if (Math.abs(prevTime - liveTime) > 0.02) {
          return liveTime;
        }
        return prevTime;
      });

      if (loopIndices.length > 0) {
        const firstLine = lines[loopIndices[0]];
        const lastLine = lines[loopIndices[loopIndices.length - 1]];

        if (firstLine && lastLine) {
          const loopStart = parseSyncedTimeToSeconds(firstLine.start);
          const loopEnd = parseSyncedTimeToSeconds(lastLine.end);

          if (liveTime >= loopEnd && liveTime < loopEnd + 1) {
            player.seekTo(loopStart, true);
          }
        }
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [isPlayerReady, loopIndices, lines]);

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
        toggleLoop();
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
  }, [cycleSpeed, jumpToAdjacentLine, toggleLoop, togglePlayPause]);

  return {
    activeLineIndex,
    currentTime,
    isPlaying,
    playbackRate,
    playbackSpeeds: PLAYBACK_SPEEDS,
    loopIndices,
    setSpeed,
    seekToLine,
    cycleSpeed,
    togglePlayPause,
    toggleLoop,
    handlePlayerReady,
    handlePlayerStateChange
  };
}