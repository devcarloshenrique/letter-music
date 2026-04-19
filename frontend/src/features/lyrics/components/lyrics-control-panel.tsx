import { Minus, Plus, Keyboard, X } from 'lucide-react';
import { useCallback, useState } from 'react';

type LyricsControlPanelProps = {
  videoId: string | null;
  videoSlotId?: string;
  playbackRate: number;
  volume: number;
  playbackSpeeds: readonly number[];
  onSpeedSlotUpdate: (slotIndex: number, rate: number) => void;
  loopActive: boolean;
  onSpeedSelect: (rate: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleLoop: () => void;
  onClose?: () => void;
  onMute?: () => void;
};

const SPEED_MIN = 0.25;
const SPEED_MAX = 2;
const SPEED_STEP = 0.05;

const normalizeSpeed = (value: number) => {
  const boundedValue = Math.max(SPEED_MIN, Math.min(SPEED_MAX, value));
  const steppedValue = Math.round(boundedValue / SPEED_STEP) * SPEED_STEP;
  return Number(steppedValue.toFixed(2));
};

export function LyricsControlPanel({
  videoId,
  videoSlotId,
  playbackRate,
  playbackSpeeds,
  onSpeedSlotUpdate,
  onSpeedSelect,
  onClose
}: Omit<LyricsControlPanelProps, 'loopActive' | 'onToggleLoop' | 'volume' | 'onVolumeChange' | 'onMute'>) {
  const [editingSlotIndex, setEditingSlotIndex] = useState(0);
  const [editingError, setEditingError] = useState<string | null>(null);

  const startSlotEdit = useCallback((slotIndex: number, currentSpeed: number) => {
    setEditingSlotIndex(slotIndex);
    onSpeedSelect(currentSpeed);
    setEditingError(null);
  }, [onSpeedSelect]);

  const adjustSelectedSlot = useCallback((direction: -1 | 1) => {
    const activeSlotSpeed = playbackSpeeds[editingSlotIndex];

    if (typeof activeSlotSpeed !== 'number') {
      setEditingError('Slot selecionado inválido.');
      return;
    }

    const nextSpeed = normalizeSpeed(activeSlotSpeed + direction * SPEED_STEP);

    onSpeedSlotUpdate(editingSlotIndex, nextSpeed);
    onSpeedSelect(nextSpeed);
    setEditingError(null);
  }, [editingSlotIndex, onSpeedSelect, onSpeedSlotUpdate, playbackSpeeds]);

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

      <div className='shrink-0 overflow-hidden rounded-[24px] border-none outline-none ring-0'>
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

      <div className='rounded-[24px] border border-white/5 bg-surface-container p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <p className='text-label text-on-surface-variant'>Playback Speed</p>
        </div>

        <div className='space-y-4 rounded-[24px] border border-white/5 bg-black/40 p-6'>
          <div className='flex items-center justify-between px-2'>
            <button
              type='button'
              onClick={() => adjustSelectedSlot(-1)}
              className='interactive-scale premium-transition inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface hover:bg-primary/20'
              aria-label='Diminuir velocidade do slot selecionado'
            >
              <Minus size={16} />
            </button>

            <div className='text-center'>
              <div className='text-2xl font-black text-on-surface'>
                {(playbackSpeeds[editingSlotIndex] ?? playbackRate).toFixed(2)}x
              </div>
              <div className='text-[8px] font-bold uppercase tracking-tighter text-on-surface-variant'>
                Step 0.05x
              </div>
            </div>

            <button
              type='button'
              onClick={() => adjustSelectedSlot(1)}
              className='interactive-scale premium-transition inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface hover:bg-primary/20'
              aria-label='Aumentar velocidade do slot selecionado'
            >
              <Plus size={16} />
            </button>
          </div>

          <div className='flex flex-wrap justify-center gap-2 pt-1'>
            {playbackSpeeds.map((speed, slotIndex) => {
              const isActiveSpeed = Math.abs(playbackRate - speed) <= 0.001;
              const isEditingCurrentSlot = editingSlotIndex === slotIndex;

              return (
                <div key={`speed-slot-${slotIndex}`} className='relative'>
                  <button
                    type='button'
                    onClick={() => startSlotEdit(slotIndex, speed)}
                    className={`interactive-scale premium-transition rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                      isActiveSpeed
                        ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(219,144,255,0.4)] border-transparent'
                        : 'border-white/5 bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {speed.toFixed(2)}x
                  </button>
                  {isEditingCurrentSlot && <span className='absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-black bg-primary-container' />}
                </div>
              );
            })}
          </div>
        </div>

        {editingError && <p className='mt-2 text-xs font-semibold text-error'>{editingError}</p>}
      </div>

      <div className='glass-surface rounded-[24px] p-6'>
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
