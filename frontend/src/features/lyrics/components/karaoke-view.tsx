import { AudioLines, ChevronLeft, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { SyncedLine } from '../../home/types/home.types';

type KaraokeViewProps = {
  queryUrl: string;
  lines: SyncedLine[];
  activeLineIndex: number;
  isLoading: boolean;
  errorMessage?: string;
  videoId: string | null;
  onToggleViewMode: () => void;
};

export function KaraokeView({
  queryUrl,
  lines,
  activeLineIndex,
  isLoading,
  errorMessage,
  videoId,
  onToggleViewMode
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

  return (
    <section className='relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-on-surface'>
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-dim/25 via-background to-background' />
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-secondary-container/30 via-transparent to-transparent' />

      <div className='flex items-center justify-between px-6 py-6 md:px-10'>
        <button
          type='button'
          onClick={onToggleViewMode}
          className='interactive-scale premium-transition inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-on-surface-variant hover:text-secondary'
          aria-label='Voltar para lista'
        >
          <ChevronLeft size={18} />
        </button>

        <div className='text-center'>
          <p className='text-label text-secondary'>Karaoke View</p>
          <p className='max-w-[55vw] truncate text-xs text-on-surface-variant md:text-sm'>{queryUrl || 'Sem URL informada'}</p>
        </div>

        <div className='h-10 w-10' aria-hidden='true' />
      </div>

      <div className='relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-6 md:px-14 md:pb-10'>
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

    </section>
  );
}
