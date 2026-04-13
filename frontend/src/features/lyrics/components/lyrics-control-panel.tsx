import { ExternalLink, Keyboard, Pause, Play, Repeat, Repeat1 } from 'lucide-react';
import YouTube from 'react-youtube';

type LyricsControlPanelProps = {
  videoId: string | null;
  queryUrl: string;
  playbackRate: number;
  playbackSpeeds: readonly number[];
  isPlaying: boolean;
  lineLoopEnabled: boolean;
  abRepeatEnabled: boolean;
  onSpeedSelect: (rate: number) => void;
  onTogglePlayPause: () => void;
  onToggleLoop: () => void;
  onToggleAbRepeat: () => void;
  onPlayerReady: (event: { target: unknown }) => void;
  onPlayerStateChange: (event: { data: number }) => void;
};

export function LyricsControlPanel({
  videoId,
  queryUrl,
  playbackRate,
  playbackSpeeds,
  isPlaying,
  lineLoopEnabled,
  abRepeatEnabled,
  onSpeedSelect,
  onTogglePlayPause,
  onToggleLoop,
  onToggleAbRepeat,
  onPlayerReady,
  onPlayerStateChange
}: LyricsControlPanelProps) {
  return (
    <aside className='flex w-full flex-col gap-6 bg-surface p-6 md:p-8'>
      <div className='glass-surface rounded-2xl p-5'>
        <div className='aspect-video overflow-hidden rounded-2xl bg-surface-high'>
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

        <div className='mt-4 flex items-start justify-between gap-3'>
          <div>
            <h3 className='text-sm font-black uppercase tracking-wider text-on-surface'>Active Listening</h3>
            <p className='mt-1 line-clamp-2 text-xs text-on-surface-variant'>{queryUrl || 'URL da música'}</p>
          </div>
          <button
            type='button'
            aria-label='Play Pause'
            onClick={onTogglePlayPause}
            className='interactive-scale premium-transition inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-high text-secondary hover:border-secondary/40'
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>

        <a
          href={queryUrl}
          target='_blank'
          rel='noreferrer'
          className='premium-transition mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-secondary'
        >
          <ExternalLink size={14} />
          Abrir URL original
        </a>
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
        <p className='text-label text-on-surface-variant'>Playback Modes</p>
        <div className='mt-3 grid grid-cols-2 gap-3'>
          <button
            type='button'
            onClick={onToggleLoop}
            className={`interactive-scale premium-transition flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-wide ${
              lineLoopEnabled
                ? 'border-primary/30 bg-primary/15 text-primary'
                : 'border-outline-variant/40 bg-surface-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Repeat size={14} /> Loop Line
          </button>
          <button
            type='button'
            onClick={onToggleAbRepeat}
            className={`interactive-scale premium-transition flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-wide ${
              abRepeatEnabled
                ? 'border-secondary/30 bg-secondary/15 text-secondary'
                : 'border-outline-variant/40 bg-surface-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Repeat1 size={14} /> A-B Repeat
          </button>
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
            <span>A-B Repeat</span>
            <kbd className='rounded bg-background px-2 py-0.5 font-black text-on-surface'>R</kbd>
          </li>
          <li className='flex items-center justify-between rounded-lg bg-surface-high/70 px-3 py-2'>
            <span>Play / Pause</span>
            <kbd className='rounded bg-background px-2 py-0.5 font-black text-on-surface'>Space</kbd>
          </li>
          <li className='flex items-center justify-between rounded-lg bg-surface-high/70 px-3 py-2'>
            <span>Linha anterior / próxima</span>
            <kbd className='rounded bg-background px-2 py-0.5 font-black text-on-surface'>↑ / ↓</kbd>
          </li>
        </ul>
      </div>
    </aside>
  );
}