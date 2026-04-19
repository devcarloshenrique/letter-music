import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { SyncedLine } from '../../home/types/home.types';
import { parseSyncedTimeToSeconds } from '../utils/lyrics-time.utils';

const PLAYBACK_SPEED_STORAGE_KEY = 'lyrics:playback-speeds';
const PLAYBACK_SPEED_DEFAULTS = [0.5, 0.75, 1] as const;
const PLAYBACK_SPEED_SLOTS_COUNT = PLAYBACK_SPEED_DEFAULTS.length;
const PLAYBACK_SPEED_MIN = 0.25;
const PLAYBACK_SPEED_MAX = 2;
const PLAYBACK_SPEED_STEP = 0.05;
const PLAYBACK_SPEED_EPSILON = 0.001;

const isSameSpeed = (left: number, right: number) => Math.abs(left - right) <= PLAYBACK_SPEED_EPSILON;

const normalizePlaybackSpeed = (value: number) => {
  const boundedValue = Math.max(PLAYBACK_SPEED_MIN, Math.min(PLAYBACK_SPEED_MAX, value));
  const steppedValue = Math.round(boundedValue / PLAYBACK_SPEED_STEP) * PLAYBACK_SPEED_STEP;
  return Number(steppedValue.toFixed(2));
};

const sanitizePlaybackSpeeds = (source: unknown) => {
  if (!Array.isArray(source)) {
    return [...PLAYBACK_SPEED_DEFAULTS];
  }

  const normalizedSource = source
    .filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    .map((item) => normalizePlaybackSpeed(item));

  const slots = Array.from({ length: PLAYBACK_SPEED_SLOTS_COUNT }, (_, index) => {
    const sourceValue = normalizedSource[index];
    return typeof sourceValue === 'number' ? sourceValue : PLAYBACK_SPEED_DEFAULTS[index];
  });

  return slots;
};

const loadPersistedPlaybackSpeeds = () => {
  if (typeof window === 'undefined') {
    return [...PLAYBACK_SPEED_DEFAULTS];
  }

  try {
    const persistedValue = window.localStorage.getItem(PLAYBACK_SPEED_STORAGE_KEY);

    if (!persistedValue) {
      return [...PLAYBACK_SPEED_DEFAULTS];
    }

    const parsedValue: unknown = JSON.parse(persistedValue);
    return sanitizePlaybackSpeeds(parsedValue);
  } catch {
    return [...PLAYBACK_SPEED_DEFAULTS];
  }
};

const pickClosestPlaybackSpeed = (targetRate: number, speeds: readonly number[]) => {
  if (speeds.length === 0) {
    return normalizePlaybackSpeed(targetRate);
  }

  return speeds.reduce((closestSpeed, speed) => {
    if (Math.abs(speed - targetRate) < Math.abs(closestSpeed - targetRate)) {
      return speed;
    }

    return closestSpeed;
  }, speeds[0]);
};

type PlayerLike = {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
};

type LoopRange = { startOffset: number; endOffset: number };

type NowPlaying = {
  queryUrl: string;
  videoId: string;
  songTitle: string;
  artistName: string;
  thumbnail?: string;
};

type LyricsPlayerContextValue = {
  lines: SyncedLine[];
  activeLineIndex: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  playbackSpeeds: readonly number[];
  updatePlaybackSpeedSlot: (slotIndex: number, rate: number) => void;
  loopIndices: number[];
  loopRange: LoopRange | null;
  nowPlaying: NowPlaying | null;
  setLoopRange: (range: LoopRange | null) => void;
  setSpeed: (rate: number) => void;
  setVolume: (nextVolume: number) => void;
  seekTo: (seconds: number) => void;
  seekToLine: (line: SyncedLine) => void;
  toggleLoopLine: (line: SyncedLine) => void;
  cycleSpeed: () => void;
  togglePlayPause: () => void;
  jumpToAdjacentLine: (direction: -1 | 1) => void;
  toggleLoop: () => void;
  handlePlayerReady: (event: { target: unknown }) => void;
  handlePlayerStateChange: (event: { data: number }) => void;
  requestAutoplayOnReady: () => void;
  setLyricsLines: (nextLines: SyncedLine[]) => void;
  setNowPlaying: (track: NowPlaying) => void;
  clearNowPlaying: () => void;
};

const LyricsPlayerContext = createContext<LyricsPlayerContextValue | null>(null);

export function LyricsPlayerProvider({ children }: PropsWithChildren) {
  const playerRef = useRef<PlayerLike | null>(null);
  const nowPlayingRef = useRef<NowPlaying | null>(null);
  const autoplayOnReadyRef = useRef(false);
  const [lines, setLines] = useState<SyncedLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeeds, setPlaybackSpeeds] = useState<number[]>(() => loadPersistedPlaybackSpeeds());
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolumeState] = useState<number>(80);
  const [loopIndices, setLoopIndices] = useState<number[]>([]);
  const [loopRange, setLoopRange] = useState<LoopRange | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [nowPlaying, setNowPlayingState] = useState<NowPlaying | null>(null);

  useEffect(() => {
    nowPlayingRef.current = nowPlaying;
  }, [nowPlaying]);

  const activeLineIndex = useMemo(() => {
    if (lines.length === 0) return -1;

    const time = currentTime + 0.05;

    return lines.findIndex((line, i) => {
      const start = parseSyncedTimeToSeconds(line.start);
      const nextLine = lines[i + 1];
      const nextStart = nextLine ? parseSyncedTimeToSeconds(nextLine.start) : Infinity;

      if (nextLine) {
        return time >= start && time < nextStart;
      }

      const end = parseSyncedTimeToSeconds(line.end);
      return time >= start && time <= end + 5;
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
    const normalizedRate = normalizePlaybackSpeed(rate);
    setPlaybackRate(normalizedRate);
    playerRef.current?.setPlaybackRate(normalizedRate);
  }, []);

  const updatePlaybackSpeedSlot = useCallback((slotIndex: number, rate: number) => {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= PLAYBACK_SPEED_SLOTS_COUNT) {
      return;
    }

    const normalizedRate = normalizePlaybackSpeed(rate);

    setPlaybackSpeeds((currentSpeeds) => {
      const nextSpeeds = sanitizePlaybackSpeeds(currentSpeeds);

      if (isSameSpeed(nextSpeeds[slotIndex], normalizedRate)) {
        return currentSpeeds;
      }

      nextSpeeds[slotIndex] = normalizedRate;
      return nextSpeeds;
    });
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const boundedVolume = Math.max(0, Math.min(100, Math.round(nextVolume)));
    setVolumeState(boundedVolume);
    playerRef.current?.setVolume(boundedVolume);
  }, []);

  const cycleSpeed = useCallback(() => {
    if (playbackSpeeds.length === 0) {
      return;
    }

    const currentIndex = playbackSpeeds.findIndex((speed) => isSameSpeed(speed, playbackRate));
    const nextRate = playbackSpeeds[(currentIndex + 1) % playbackSpeeds.length] ?? playbackSpeeds[0];
    setSpeed(nextRate);
  }, [playbackRate, playbackSpeeds, setSpeed]);

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

      if (currentTime > 0.1) {
        playerRef.current.seekTo(currentTime, true);
      }

      if (isPlaying || autoplayOnReadyRef.current) {
        autoplayOnReadyRef.current = false;
        playerRef.current.playVideo();
      }

      setIsPlayerReady(true);
    },
    [currentTime, isPlaying, playbackRate, volume]
  );

  const handlePlayerStateChange = useCallback((event: { data: number }) => {
    setIsPlaying(event.data === 1);
  }, []);

  const setLyricsLines = useCallback((nextLines: SyncedLine[]) => {
    setLines(nextLines);
  }, []);

  const requestAutoplayOnReady = useCallback(() => {
    autoplayOnReadyRef.current = true;
  }, []);

  const clearNowPlaying = useCallback(() => {
    playerRef.current?.pauseVideo();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoopIndices([]);
    setLoopRange(null);
    setLines([]);
    setNowPlayingState(null);
    setIsPlayerReady(false);
  }, []);

  const setNowPlaying = useCallback((track: NowPlaying) => {
    const previous = nowPlayingRef.current;
    const isSameTrack = previous?.queryUrl === track.queryUrl && previous?.videoId === track.videoId;

    setNowPlayingState(track);

    if (isSameTrack) {
      return;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoopIndices([]);
    setLoopRange(null);
    setIsPlayerReady(false);
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

      if (player.getPlayerState() !== 1) {
        return;
      }

      const liveTime = player.getCurrentTime();
      const liveDuration = player.getDuration();

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
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(PLAYBACK_SPEED_STORAGE_KEY, JSON.stringify(playbackSpeeds));
  }, [playbackSpeeds]);

  useEffect(() => {
    if (playbackSpeeds.some((speed) => isSameSpeed(speed, playbackRate))) {
      return;
    }

    const fallbackRate = pickClosestPlaybackSpeed(playbackRate, playbackSpeeds);
    setPlaybackRate(fallbackRate);
    playerRef.current?.setPlaybackRate(fallbackRate);
  }, [playbackRate, playbackSpeeds]);

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

  const value = useMemo<LyricsPlayerContextValue>(
    () => ({
      lines,
      activeLineIndex,
      currentTime,
      duration,
      isPlaying,
      playbackRate,
      volume,
      playbackSpeeds,
      updatePlaybackSpeedSlot,
      loopIndices,
      loopRange,
      nowPlaying,
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
      handlePlayerStateChange,
      requestAutoplayOnReady,
      setLyricsLines,
      setNowPlaying,
      clearNowPlaying
    }),
    [
      lines,
      activeLineIndex,
      currentTime,
      duration,
      isPlaying,
      playbackRate,
      volume,
      playbackSpeeds,
      updatePlaybackSpeedSlot,
      loopIndices,
      loopRange,
      nowPlaying,
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
      handlePlayerStateChange,
      requestAutoplayOnReady,
      setLyricsLines,
      setNowPlaying,
      clearNowPlaying
    ]
  );

  return <LyricsPlayerContext.Provider value={value}>{children}</LyricsPlayerContext.Provider>;
}

export function useLyricsPlayerContext() {
  const context = useContext(LyricsPlayerContext);

  if (!context) {
    throw new Error('useLyricsPlayerContext must be used within LyricsPlayerProvider');
  }

  return context;
}
