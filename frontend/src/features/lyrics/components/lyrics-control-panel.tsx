import { Keyboard, X } from 'lucide-react';

type LyricsControlPanelProps = {
  videoId: string | null;
  videoSlotId?: string;
  playbackRate: number;
  volume: number;
  playbackSpeeds: readonly number[];
  loopActive: boolean;
  onSpeedSelect: (rate: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleLoop: () => void;
  onClose?: () => void;
  onMute?: () => void;
};

export function LyricsControlPanel({
  videoId,
  videoSlotId,
  playbackRate,
  playbackSpeeds,
  onSpeedSelect,
  onClose
}: Omit<LyricsControlPanelProps, 'loopActive' | 'onToggleLoop' | 'volume' | 'onVolumeChange' | 'onMute'>) {
  return (
    <aside className='flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto bg-surface p-4 md:p-6'>
      <div className='flex items-center justify-between'>
        <p className='text-label text-on-surface-variant'>Painel de Controle</p>
        {onClose && (
          <button
            type='button'
            onClick={onClose}
            className='interactive-scale premium-transition inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-high text-on-surface-variant hover:text-secondary'
            aria-label='Fechar menu lateral'
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className='shrink-0 overflow-hidden rounded-2xl border-none outline-none ring-0'>
        {videoId ? (
          videoSlotId ? (
            <div
              id={videoSlotId}
              className='aspect-video border-none bg-surface-high/40'
            />
          ) : (
            <div className='flex aspect-video items-center justify-center border-none text-sm text-on-surface-variant'>
              Player ativo
            </div>
          )
        ) : (
          <div className='flex aspect-video items-center justify-center text-sm text-on-surface-variant'>
            Sem vídeo disponível
          </div>
        )}
      </div>

      <div className='glass-surface rounded-2xl p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <p className='text-label text-on-surface-variant'>Playback Speed</p>
          <span className='text-xs font-bold text-secondary'>{playbackRate.toFixed(2)}x</span>
        </div>
        <div className='grid grid-cols-4 gap-2'>
          {playbackSpeeds.map((speed) => (
            <button
              key={`speed-${speed}`}
              type='button'
              onClick={() => onSpeedSelect(speed)}
              className={`interactive-scale premium-transition rounded-lg px-2 py-2 text-xs font-bold ${
                playbackRate === speed
                  ? 'bg-secondary text-background shadow-glow-secondary'
                  : 'bg-surface-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {speed.toFixed(2)}x
            </button>
          ))}
        </div>
      </div>

      <div className='glass-surface rounded-2xl p-4'>
        <p className='text-label text-on-surface-variant'>Hotkeys</p>
        <ul className='mt-3 space-y-2 text-xs text-on-surface-variant'>
          <li className='flex items-center justify-between rounded-lg bg-surface-high/70 px-3 py-2'>
            <span className='inline-flex items-center gap-2'>
              <Keyboard size={12} /> Toggle Speed
            </span>
            <kbd className='rounded bg-background px-2 py-0.5 font-black text-on-surface'>S</kbd>
          </li>
          <li className='flex items-center justify-between rounded-lg bg-surface-high/70 px-3 py-2'>
            <span>Loop Mode</span>
            <kbd className='rounded bg-background px-2 py-0.5 font-black text-on-surface'>L</kbd>
          </li>
          <li className='flex items-center justify-between rounded-lg bg-surface-high/70 px-3 py-2'>
            <span>Play / Pause</span>
            <kbd className='rounded bg-background px-2 py-0.5 font-black text-on-surface'>Space</kbd>
          </li>
          <li className='flex items-center justify-between rounded-lg bg-surface-high/70 px-3 py-2'>
            <span>Prev / Next Line</span>
            <kbd className='rounded bg-background px-2 py-0.5 font-black text-on-surface'>↑ / ↓</kbd>
          </li>
        </ul>
      </div>
    </aside>
  );
}
