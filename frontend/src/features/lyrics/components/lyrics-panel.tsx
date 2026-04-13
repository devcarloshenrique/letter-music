import { ChevronLeft, LoaderCircle, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SyncedLine } from '../../home/types/home.types';
import { formatSyncedTimeLabel } from '../utils/lyrics-time.utils';

type LyricsPanelProps = {
  queryUrl: string;
  lines: SyncedLine[];
  activeLineIndex: number;
  isLoading: boolean;
  errorMessage?: string;
  onLineClick: (line: SyncedLine) => void;
  registerLineRef: (index: number, element: HTMLButtonElement | null) => void;
  onManualScroll: () => void;
};

export function LyricsPanel({
  queryUrl,
  lines,
  activeLineIndex,
  isLoading,
  errorMessage,
  onLineClick,
  registerLineRef,
  onManualScroll
}: LyricsPanelProps) {
  return (
    <section className='relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-black/20 lg:w-auto'>
      <header className='sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-background/85 px-6 py-5 backdrop-blur-xl md:px-10'>
        <div className='flex items-center gap-3'>
          <Link
            to='/'
            className='interactive-scale premium-transition inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-high text-on-surface-variant hover:text-secondary'
            aria-label='Voltar para busca'
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <p className='text-label text-secondary'>Synchronized Lyrics</p>
            <p className='max-w-[55vw] truncate text-xs text-on-surface-variant md:text-sm'>{queryUrl || 'Sem URL informada'}</p>
          </div>
        </div>
        <span className='rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary'>
          Auto-Translate On
        </span>
      </header>

      <div className='min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-12' onWheel={onManualScroll} onTouchMove={onManualScroll}>
        {isLoading && (
          <div className='space-y-6'>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`lyrics-skeleton-${index}`} className='h-8 w-full animate-pulse rounded-xl bg-surface-high/70' />
            ))}
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className='flex items-start gap-3 rounded-xl border border-error/40 bg-error/10 p-4 text-error'>
            <TriangleAlert size={20} className='mt-0.5 shrink-0' />
            <p className='text-sm font-medium'>{errorMessage}</p>
          </div>
        )}

        {!isLoading && !errorMessage && lines.length === 0 && (
          <div className='mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface/60 p-8 text-center'>
            <LoaderCircle size={20} className='mb-3 text-secondary' />
            <p className='text-headline'>Cole uma URL válida para começar</p>
            <p className='mt-2 text-sm text-on-surface-variant'>A letra sincronizada aparecerá aqui assim que o endpoint retornar os dados.</p>
          </div>
        )}

        {!isLoading && !errorMessage && lines.length > 0 && (
          <div className='space-y-6 pb-32'>
            {lines.map((line, index) => {
              const isActive = index === activeLineIndex;

              return (
                <button
                  key={`${line.start}-${line.end}-${line.text}`}
                  ref={(element) => registerLineRef(index, element)}
                  type='button'
                  onClick={() => onLineClick(line)}
                  title={`${formatSyncedTimeLabel(line.start)} → ${formatSyncedTimeLabel(line.end)}`}
                  aria-label={`Ir para ${formatSyncedTimeLabel(line.start)}: ${line.text}`}
                  aria-pressed={isActive}
                  className={`premium-transition group relative block w-full cursor-pointer rounded-2xl px-5 py-4 text-left ${
                    isActive
                      ? 'scale-[1.02] border border-primary/30 bg-primary/10 text-tertiary shadow-glow-primary'
                      : 'border border-transparent text-on-surface-variant hover:border-outline-variant/30 hover:bg-surface-high/70 hover:text-tertiary'
                  }`}
                >
                  {isActive && <span className='absolute -left-2 top-1/2 h-11 w-1 -translate-y-1/2 rounded-full bg-primary shadow-glow-primary' />}
                  <p className={`leading-relaxed md:text-2xl ${isActive ? 'text-2xl font-bold' : 'text-xl font-medium'}`}>{line.text}</p>
                  <p className='mt-2 text-xs font-bold uppercase tracking-widest text-secondary'>
                    {formatSyncedTimeLabel(line.start)} — {formatSyncedTimeLabel(line.end)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}