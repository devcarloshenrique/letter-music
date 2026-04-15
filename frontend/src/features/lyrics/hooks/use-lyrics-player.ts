import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SyncedLine } from '../../home/types/home.types';
import { parseSyncedTimeToSeconds } from '../utils/lyrics-time.utils';

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25] as const;

type PlayerLike = {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
};

export function useLyricsPlayer(lines: SyncedLine[]) {
  const playerRef = useRef<PlayerLike | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolumeState] = useState<number>(80);
  const [loopIndices, setLoopIndices] = useState<number[]>([]);
  const [loopRange, setLoopRange] = useState<{ startOffset: number; endOffset: number } | null>(null);

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

  const toggleLoopLine = useCallback(
    (line: SyncedLine) => {
      const lineIndex = lines.indexOf(line);
      if (lineIndex === -1) {
        return;
      }

      setLoopIndices((prev) => {
        if (prev.includes(lineIndex)) {
          return prev.filter((i) => i !== lineIndex).sort((a, b) => a - b);
        }

        return [...prev, lineIndex].sort((a, b) => a - b);
      });
    },
    [lines]
  );

  const setSpeed = useCallback((rate: number) => {
    setPlaybackRate(rate);
    playerRef.current?.setPlaybackRate(rate);
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const boundedVolume = Math.max(0, Math.min(100, Math.round(nextVolume)));
    setVolumeState(boundedVolume);
    playerRef.current?.setVolume(boundedVolume);
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

  useEffect(() => {
    // Custom marker range is valid only for single-line loop mode.
    if (loopIndices.length !== 1 && loopRange !== null) {
      setLoopRange(null);
    }
  }, [loopIndices, loopRange]);

  const handlePlayerReady = useCallback(
    (event: { target: unknown }) => {
      playerRef.current = event.target as PlayerLike;
      playerRef.current.setPlaybackRate(playbackRate);
      playerRef.current.setVolume(volume);
      setDuration(playerRef.current.getDuration() || 0);

      // Restore playback context when switching between mounted player surfaces
      // (list panel player <-> karaoke hidden player).
      if (currentTime > 0.1) {
        playerRef.current.seekTo(currentTime, true);
      }

      if (isPlaying) {
        playerRef.current.playVideo();
      }

      setIsPlayerReady(true);
    },
    [currentTime, isPlaying, playbackRate, volume]
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
      const liveDuration = player.getDuration();

      // Update at 50ms intervals for high precision sync
      // We use a small threshold to avoid excessive state updates if the change is negligible
      setCurrentTime((prevTime) => {
        if (Math.abs(prevTime - liveTime) > 0.02) {
          return liveTime;
        }
        return prevTime;
      });

      setDuration((prevDuration) => {
        if (Math.abs(prevDuration - liveDuration) > 0.05) {
          return liveDuration;
        }

        return prevDuration;
      });

      if (loopIndices.length > 0) {
        const firstLine = lines[loopIndices[0]];
        const lastLine = lines[loopIndices[loopIndices.length - 1]];

        if (firstLine && lastLine) {
          let loopStart = parseSyncedTimeToSeconds(firstLine.start);
          let loopEnd = parseSyncedTimeToSeconds(lastLine.end);

          // Apply custom offsets only in single-line mode
          if (loopIndices.length === 1 && loopRange) {
            loopStart += loopRange.startOffset;
            loopEnd = parseSyncedTimeToSeconds(firstLine.start) + loopRange.endOffset;
          }

          if (liveTime >= loopEnd) {
            player.seekTo(loopStart, true);
          }
        }
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [isPlayerReady, loopIndices, loopRange, lines]);

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
    duration,
    isPlaying,
    playbackRate,
    volume,
    playbackSpeeds: PLAYBACK_SPEEDS,
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
    handlePlayerReady,
    handlePlayerStateChange
  };
}