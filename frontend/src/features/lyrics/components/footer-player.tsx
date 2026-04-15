import { Mic2, Pause, Play, Repeat, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { type MouseEvent, useMemo } from 'react';
import type { SyncedLine } from '../../home/types/home.types';

type FooterPlayerProps = {
  lines: SyncedLine[];
  activeLineIndex: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  loopActive: boolean;
  isKaraokeMode: boolean;
  onTogglePlayPause: () => void;
  onPrevLine: () => void;
  onNextLine: () => void;
  onCycleSpeed: () => void;
  onToggleLoop: () => void;
  onVolumeChange: (value: number) => void;
  onSeek: (seconds: number) => void;
  onToggleKaraokeMode: () => void;
  songTitle?: string;
  artistName?: string;
  thumbnail?: string;
};

export function FooterPlayer({
  lines,
  activeLineIndex,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  volume,
  loopActive,
  isKaraokeMode,
  onTogglePlayPause,
  onPrevLine,
  onNextLine,
  onCycleSpeed,
  onToggleLoop,
  onVolumeChange,
  onSeek,
  onToggleKaraokeMode,
  songTitle = 'Sem Título',
  artistName = 'Artista',
  thumbnail
}: FooterPlayerProps) {
  const progress = useMemo(() => {
    if (duration > 0) {
      return Math.min(100, Math.max(0, (currentTime / duration) * 100));
    }

    if (lines.length > 0 && activeLineIndex >= 0) {
      return ((activeLineIndex + 1) / lines.length) * 100;
    }

    return 0;
  }, [activeLineIndex, currentTime, duration, lines.length]);

  const formatTime = (seconds: number) => {
    const safeValue = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const minutes = Math.floor(safeValue / 60);
    const remaining = safeValue % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (event: MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const fraction = Math.min(1, Math.max(0, relativeX / rect.width));
    onSeek(fraction * duration);
  };

  return (
    <>
      {/* Fixed Footer Player */}
      <div className='fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-surface/60 backdrop-blur-3xl md:h-24 h-20'>
        <div className='mx-auto h-full max-w-7xl px-4 md:px-8 flex flex-col justify-center'>
          {/* Progress Bar */}
          <div className='mb-3 flex items-center gap-3'>
            <span className='hidden w-10 text-[10px] font-mono text-on-surface-variant md:block'>{formatTime(currentTime)}</span>
            <div
              className='group h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-surface-variant/40'
              onClick={handleTimelineClick}
              role='slider'
              aria-label='Timeline de reprodução'
              aria-valuemin={0}
              aria-valuemax={Math.max(0, Math.floor(duration))}
              aria-valuenow={Math.max(0, Math.floor(currentTime))}
            >
              <div className='relative h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-200' style={{ width: `${progress}%` }}>
                <span className='absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-tertiary opacity-0 shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-opacity group-hover:opacity-100' />
              </div>
            </div>
            <span className='hidden w-10 text-right text-[10px] font-mono text-on-surface-variant md:block'>{formatTime(duration)}</span>
          </div>

          {/* Main Controls Row */}
          <div className='flex items-center justify-between gap-4'>
            {/* Left: Mini player info (hidden on mobile) */}
            <div className='hidden md:flex items-center gap-3 flex-shrink-0 w-48'>
              {thumbnail && (
                <img 
                  src={thumbnail} 
                  alt={songTitle}
                  className='h-12 w-12 rounded-lg object-cover border border-white/10'
                />
              )}
              <div className='min-w-0'>
                <p className='text-xs font-bold text-on-surface truncate'>{songTitle}</p>
                <p className='text-[10px] text-on-surface-variant truncate'>{artistName}</p>
              </div>
            </div>

            {/* Center: Playback Controls */}
            <div className='flex items-center justify-center gap-4 md:gap-6 flex-1'>
              {/* Previous Line */}
              <button
                type='button'
                onClick={onPrevLine}
                className='interactive-scale premium-transition text-on-surface-variant hover:text-primary'
                aria-label='Linha anterior'
              >
                <SkipBack size={22} />
              </button>

              {/* Play/Pause Button */}
              <button
                type='button'
                onClick={onTogglePlayPause}
                className='interactive-scale premium-transition inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_0_20px_rgba(191,64,255,0.6)] hover:scale-110'
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause size={20} fill='currentColor' /> : <Play size={20} fill='currentColor' style={{ marginLeft: '2px' }} />}
              </button>

              {/* Next Line */}
              <button
                type='button'
                onClick={onNextLine}
                className='interactive-scale premium-transition text-on-surface-variant hover:text-primary'
                aria-label='Próxima linha'
              >
                <SkipForward size={22} />
              </button>
            </div>

            {/* Right: Secondary Controls */}
            <div className='flex items-center gap-2 md:gap-3 flex-shrink-0 justify-end w-48'>
              {/* Volume Control (hidden on mobile) */}
              <div className='hidden md:flex items-center gap-2 rounded-lg border border-white/10 bg-surface-high/50 px-3 py-1.5'>
                <button
                  type='button'
                  onClick={() => onVolumeChange(0)}
                  className='interactive-scale premium-transition inline-flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:text-secondary'
                  aria-label='Mutar volume'
                >
                  <Volume2 size={14} className='flex-shrink-0' />
                </button>
                <input
                  type='range'
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(event) => onVolumeChange(Number(event.target.value))}
                  className='h-1 w-20 accent-secondary'
                  aria-label='Controle de volume'
                />
              </div>

              {/* Speed Badge */}
              <button
                type='button'
                onClick={onCycleSpeed}
                className='interactive-scale premium-transition rounded-lg border border-white/10 bg-surface-high px-2.5 py-1.5 text-xs font-bold text-on-surface-variant hover:text-secondary'
                aria-label='Alterar velocidade'
              >
                {playbackRate.toFixed(2)}x
              </button>

              {/* Karaoke Toggle */}
              <button
                type='button'
                onClick={onToggleKaraokeMode}
                className={`interactive-scale premium-transition inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                  isKaraokeMode
                    ? 'border-secondary/50 bg-secondary/20 text-secondary shadow-glow-secondary'
                    : 'border-white/10 bg-surface-high text-on-surface-variant hover:text-secondary'
                }`}
                aria-label='Alternar modo karaoke'
              >
                <Mic2 size={12} /> <span className='hidden md:inline'>Karaoke</span>
              </button>

              {/* Loop Toggle */}
              <button
                type='button'
                onClick={onToggleLoop}
                className={`interactive-scale premium-transition inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                  loopActive
                    ? 'border-primary/40 bg-primary/15 text-primary shadow-glow-primary'
                    : 'border-white/10 bg-surface-high text-on-surface-variant hover:text-secondary'
                }`}
                aria-label='Alternar loop'
              >
                <Repeat size={12} /> <span className='hidden md:inline'>Loop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
