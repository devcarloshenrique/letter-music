import { Keyboard, Repeat } from 'lucide-react';
import YouTube from 'react-youtube';

type LyricsControlPanelProps = {
  videoId: string | null;
  playbackRate: number;
  playbackSpeeds: readonly number[];
  loopActive: boolean;
  onSpeedSelect: (rate: number) => void;
  onToggleLoop: () => void;
  onPlayerReady: (event: { target: unknown }) => void;
  onPlayerStateChange: (event: { data: number }) => void;
};

export function LyricsControlPanel({
  videoId,
  playbackRate,
  playbackSpeeds,
  loopActive,
  onSpeedSelect,
  onToggleLoop,
  onPlayerReady,
  onPlayerStateChange
}: LyricsControlPanelProps) {
  return (
    <aside className='flex w-full flex-col gap-6 bg-surface p-6 md:p-8'>
      <div className='glass-surface overflow-hidden rounded-2xl'>
        <div className='aspect-video bg-surface-high'>
          {videoId ? (
            <YouTube
              videoId={videoId}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  rel: 0,
                  modestbranding: 1
                }
              }}
              className='h-full w-full [&>iframe]:h-full [&>iframe]:w-full'
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
            />
          ) : (
            <div className='flex h-full items-center justify-center text-sm text-on-surface-variant'>Sem vídeo disponível</div>
          )}
        </div>
      </div>

      <div className='glass-surface rounded-2xl p-5'>
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

      <div className='glass-surface rounded-2xl p-5'>
        <p className='text-label text-on-surface-variant'>Playback Mode</p>
        <div className='mt-3'>
          <button
            type='button'
            onClick={onToggleLoop}
            className={`interactive-scale premium-transition flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-wide ${
              loopActive
                ? 'border-primary/30 bg-primary/15 text-primary shadow-glow-primary'
                : 'border-outline-variant/40 bg-surface-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Repeat size={14} /> {loopActive ? 'Loop Active' : 'Enable Loop'}
          </button>
          <p className='mt-3 text-[10px] text-center text-on-surface-variant/50 uppercase tracking-widest font-bold'>
            Ctrl/Shift + Click on lyrics to loop multiple lines
          </p>
        </div>
      </div>

      <div className='glass-surface rounded-2xl p-5'>
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