import { useEffect } from 'react';
import type { SyncedLine } from '../../home/types/home.types';
import { useLyricsPlayerContext } from '../context/lyrics-player-context';

export function useLyricsPlayer(lines: SyncedLine[]) {
  const playerContext = useLyricsPlayerContext();
  const { setLyricsLines } = playerContext;

  useEffect(() => {
    setLyricsLines(lines);
  }, [lines, setLyricsLines]);

  return playerContext;
}