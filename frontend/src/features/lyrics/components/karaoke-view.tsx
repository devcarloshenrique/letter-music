import { AudioLines, ChevronLeft, List, LoaderCircle, Pause, Play, Repeat, SkipBack, SkipForward, TriangleAlert, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import YouTube from 'react-youtube';
import type { SyncedLine } from '../../home/types/home.types';

type KaraokeViewProps = {
  queryUrl: string;
  lines: SyncedLine[];
  activeLineIndex: number;
  loopActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  errorMessage?: string;
  videoId: string | null;
  playbackRate: number;
  volume: number;
  onBack: () => void;
  onToggleViewMode: () => void;
  onTogglePlayPause: () => void;
  onPrevLine: () => void;
  onNextLine: () => void;
  onToggleLoop: () => void;
  onCycleSpeed: () => void;
  onVolumeChange: (value: number) => void;
  onPlayerReady: (event: { target: unknown }) => void;
  onPlayerStateChange: (event: { data: number }) => void;
};

export function KaraokeView({
  queryUrl,
  lines,
  activeLineIndex,
  loopActive,
  isPlaying,
  isLoading,
  errorMessage,
  videoId,
  playbackRate,
  volume,
  onBack,
  onToggleViewMode,
  onTogglePlayPause,
  onPrevLine,
  onNextLine,
  onToggleLoop,
  onCycleSpeed,
  onVolumeChange,
  onPlayerReady,
  onPlayerStateChange
}: KaraokeViewProps) {
  const normalizedUrl = queryUrl.replace(/\/$/, '');
  const urlParts = normalizedUrl.split('/').filter(Boolean);
  const songSlug = urlParts[urlParts.length - 1] ?? '';
  const artistSlug = urlParts[urlParts.length - 2] ?? '';

  const formatSlug = (value: string) =>
    value
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const songTitle = formatSlug(songSlug) || 'Faixa sem título';
  const artistName = formatSlug(artistSlug) || 'Artista';

  const maxresThumbnail = useMemo(
    () => (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null),
    [videoId]
  );
  const fallbackThumbnail = useMemo(
    () => (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
    [videoId]
  );
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(maxresThumbnail);

  useEffect(() => {
    setThumbnailSrc(maxresThumbnail);
  }, [maxresThumbnail]);

  const activeLine = activeLineIndex >= 0 ? lines[activeLineIndex] : null;
  const neighborhood = [
    { offset: -2, line: activeLineIndex > 1 ? lines[activeLineIndex - 2] : null },
    { offset: -1, line: activeLineIndex > 0 ? lines[activeLineIndex - 1] : null },
    { offset: 0, line: activeLine },
    { offset: 1, line: activeLineIndex >= 0 && activeLineIndex < lines.length - 1 ? lines[activeLineIndex + 1] : null },
    { offset: 2, line: activeLineIndex >= 0 && activeLineIndex < lines.length - 2 ? lines[activeLineIndex + 2] : null }
  ];
  const progress = lines.length > 0 && activeLineIndex >= 0 ? ((activeLineIndex + 1) / lines.length) * 100 : 0;

  return (
    <section className='relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-on-surface'>
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-dim/25 via-background to-background' />
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-secondary-container/30 via-transparent to-transparent' />

      <div className='flex items-center justify-between px-6 py-6 md:px-10'>
        <button
          type='button'
          onClick={onBack}
          className='interactive-scale premium-transition inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-on-surface-variant hover:text-secondary'
          aria-label='Voltar para busca'
        >
          <ChevronLeft size={18} />
        </button>

        <div className='text-center'>
          <p className='text-label text-secondary'>Karaoke View</p>
          <p className='max-w-[55vw] truncate text-xs text-on-surface-variant md:text-sm'>{queryUrl || 'Sem URL informada'}</p>
        </div>

        <button
          type='button'
          onClick={onToggleViewMode}
          className='interactive-scale premium-transition inline-flex items-center gap-2 rounded-full bg-surface-high px-3 py-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant hover:text-secondary'
          aria-label='Alternar para modo lista'
        >
          <List size={14} /> Lista
        </button>
      </div>

      <div className='relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-[220px] md:px-14 md:pb-[240px]'>
        <div className='mb-8 flex w-full max-w-4xl items-center gap-4 md:gap-6'>
          <div className='h-16 w-16 overflow-hidden rounded-lg border border-white/10 shadow-ambient md:h-24 md:w-24'>
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt={`Thumbnail de ${songTitle}`}
                className='h-full w-full object-cover'
                onError={() => {
                  if (thumbnailSrc !== fallbackThumbnail) {
                    setThumbnailSrc(fallbackThumbnail);
                  }
                }}
              />
            ) : (
              <div className='h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20' />
            )}
          </div>
          <div>
            <p className='text-label text-secondary'>Praticando Pronúncia</p>
            <h2 className='text-2xl font-black tracking-tight text-on-surface md:text-4xl'>{songTitle}</h2>
            <p className='text-sm text-outline md:text-base'>{artistName} • Intermediate Level</p>
          </div>
        </div>

        {isLoading && (
          <div className='flex flex-col items-center gap-3 text-on-surface-variant'>
            <LoaderCircle className='animate-spin text-secondary' size={28} />
            <p>Sincronizando letra...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className='flex max-w-2xl items-start gap-3 rounded-xl border border-error/40 bg-error/10 p-4 text-error'>
            <TriangleAlert size={20} className='mt-0.5 shrink-0' />
            <p className='text-sm font-medium'>{errorMessage}</p>
          </div>
        )}

        {!isLoading && !errorMessage && lines.length === 0 && (
          <div className='text-center text-on-surface-variant'>
            <AudioLines size={28} className='mx-auto mb-3 text-secondary' />
            <p className='text-headline'>Sem linhas sincronizadas</p>
            <p className='mt-2 text-sm'>Tente outra música para usar o modo karaokê.</p>
          </div>
        )}

        {!isLoading && !errorMessage && lines.length > 0 && (
          <div className='relative h-[420px] w-full max-w-5xl overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)]'>
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-7 px-2 text-center md:gap-9'>
              {neighborhood.map(({ offset, line }) => {
                if (!line) {
                  return <div key={`empty-${offset}`} className='h-10 md:h-14' />;
                }

                const isActive = offset === 0;
                const opacityClass =
                  offset === 0
                    ? 'opacity-100'
                    : Math.abs(offset) === 1
                    ? 'opacity-55'
                    : 'opacity-30';

                const sizeClass =
                  offset === 0
                    ? 'text-4xl md:text-7xl font-black tracking-tighter'
                    : Math.abs(offset) === 1
                    ? 'text-3xl md:text-5xl font-bold tracking-tight'
                    : 'text-2xl md:text-4xl font-bold tracking-tight';

                return (
                  <div key={`${line.start}-${line.end}-${offset}`} className={`relative ${opacityClass} transition-all duration-500`}>
                    {isActive && (
                      <div className='absolute -left-5 top-1/2 hidden h-14 w-1 -translate-y-1/2 rounded-full bg-primary shadow-glow-primary md:block' />
                    )}
                    <p
                      className={`leading-tight ${sizeClass} ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}
                      style={
                        isActive
                          ? {
                              textShadow:
                                '0 0 20px rgba(247, 242, 247, 0.45), 0 0 40px rgba(219, 144, 255, 0.28), 0 0 60px rgba(0, 227, 253, 0.14)'
                            }
                          : undefined
                      }
                    >
                      {line.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className='absolute -left-[9999px] h-px w-px overflow-hidden'>
        <YouTube
          videoId={videoId ?? undefined}
          opts={{
            width: '1',
            height: '1',
            playerVars: {
              rel: 0,
              modestbranding: 1
            }
          }}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
      </div>

      <div className='fixed inset-x-0 bottom-6 z-30 px-4 md:bottom-10 md:px-6'>
        <div className='mx-auto w-full max-w-5xl rounded-2xl border border-white/15 bg-surface/55 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.45),0_0_45px_rgba(219,144,255,0.18)] ring-1 ring-primary/20 backdrop-blur-3xl md:p-7'>
          <div className='mb-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-variant'>
            <div className='h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all' style={{ width: `${progress}%` }} />
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3 md:gap-4'>
              <button
                type='button'
                onClick={onPrevLine}
                className='interactive-scale premium-transition text-on-surface-variant hover:text-primary'
                aria-label='Linha anterior'
              >
                <SkipBack size={28} />
              </button>

              <button
                type='button'
                onClick={onTogglePlayPause}
                className='interactive-scale premium-transition inline-flex h-14 w-14 items-center justify-center rounded-full bg-tertiary text-background hover:scale-105'
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause size={26} /> : <Play size={26} />}
              </button>

              <button
                type='button'
                onClick={onNextLine}
                className='interactive-scale premium-transition text-on-surface-variant hover:text-primary'
                aria-label='Próxima linha'
              >
                <SkipForward size={28} />
              </button>
            </div>

            <div className='flex items-center gap-2 md:gap-3'>
              <div className='hidden items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-high/50 px-3 py-2 md:flex'>
                <Volume2 size={14} className='text-on-surface-variant' />
                <input
                  type='range'
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(event) => onVolumeChange(Number(event.target.value))}
                  className='h-1.5 w-24 accent-secondary'
                  aria-label='Controle de volume no modo karaoke'
                />
              </div>
              <button
                type='button'
                onClick={onCycleSpeed}
                className='interactive-scale premium-transition rounded-lg border border-outline-variant/40 bg-surface-high px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-secondary'
                aria-label='Alterar velocidade'
              >
                {playbackRate.toFixed(2)}x
              </button>
              <button
                type='button'
                onClick={onToggleLoop}
                className={`interactive-scale premium-transition inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${
                  loopActive
                    ? 'border-primary/30 bg-primary/15 text-primary shadow-glow-primary'
                    : 'border-outline-variant/40 bg-surface-high text-on-surface-variant hover:text-secondary'
                }`}
                aria-label='Alternar loop'
              >
                <Repeat size={14} /> Loop
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
