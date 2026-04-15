import { ChevronLeft, LoaderCircle, LocateFixed, Repeat, TriangleAlert } from 'lucide-react';
import type { SyncedLine } from '../../home/types/home.types';
import { formatSyncedTimeLabel, parseSyncedTimeToSeconds, formatSecondsLabel } from '../utils/lyrics-time.utils';
import { LoopRangeSelector } from './loop-range-selector';

type LyricsPanelProps = {
  queryUrl: string;
  lines: SyncedLine[];
  activeLineIndex: number;
  loopIndices?: number[];
  loopRange?: { startOffset: number; endOffset: number } | null;
  isLoading: boolean;
  errorMessage?: string;
  onLineClick: (line: SyncedLine) => void;
  onLoopToggle: (index: number) => void;
  onLoopRangeChange: (range: { startOffset: number; endOffset: number } | null) => void;
  registerLineRef: (index: number, element: HTMLButtonElement | null) => void;
  onManualScroll: () => void;
  isAutoFollowEnabled: boolean;
  onResumeAutoFollow: () => void;
  isSidePanelOpen?: boolean;
  onBack: () => void;
};

export function LyricsPanel({
  queryUrl,
  lines,
  activeLineIndex,
  loopIndices = [],
  loopRange,
  isLoading,
  errorMessage,
  onLineClick,
  onLoopToggle,
  onLoopRangeChange,
  registerLineRef,
  onManualScroll,
  isAutoFollowEnabled,
  onResumeAutoFollow,
  isSidePanelOpen = false,
  onBack
}: LyricsPanelProps) {
  return (
    <section className='relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-black/20 lg:w-auto'>
      <header className='sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-background/85 px-6 py-5 pl-20 backdrop-blur-xl md:px-10 md:pl-24'>
        <div className='flex items-center gap-3'>
          <div>
            <p className='text-label text-secondary'>Synchronized Lyrics</p>
            {queryUrl ? (
              <a
                href={queryUrl}
                target='_blank'
                rel='noreferrer'
                className='max-w-[55vw] truncate text-xs text-on-surface-variant transition-colors hover:text-secondary hover:underline md:text-sm'
                title='Abrir música em uma nova aba'
              >
                {queryUrl}
              </a>
            ) : (
              <p className='max-w-[55vw] truncate text-xs text-on-surface-variant md:text-sm'>Sem URL informada</p>
            )}
          </div>
        </div>
        <div className='h-9 w-9' aria-hidden='true' />
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
          <div className='max-w-4xl pb-32'>
            {lines.map((line, index) => {
              const isActive = index === activeLineIndex;
              const isLooped = loopIndices.includes(index);
              const isSingleLoop = loopIndices.length === 1 && isLooped;

              return (
                <div 
                  key={`${line.start}-${line.end}-${line.text}`}
                  className={`premium-transition group relative flex flex-col border-b border-white/5 py-4 transition-all duration-300`}
                >
                  <div className="flex items-center gap-6">
                    {/* Compact Loop Toggle */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onLoopToggle(index); }}
                      className={`premium-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isLooped 
                          ? 'bg-primary text-on-primary shadow-glow-primary' 
                          : 'text-on-surface-variant/40 hover:text-primary'
                      }`}
                    >
                      <Repeat size={14} fill={isLooped ? 'currentColor' : 'none'} />
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-mono transition-colors duration-300 ${
                          isLooped ? 'text-primary font-bold opacity-100' : 'text-on-surface-variant/40'
                        }`}>
                          {isSingleLoop && loopRange 
                            ? `${formatSecondsLabel(parseSyncedTimeToSeconds(line.start) + (loopRange?.startOffset ?? 0))} — ${formatSecondsLabel(parseSyncedTimeToSeconds(line.start) + (loopRange?.endOffset ?? 0))}`
                            : `${formatSyncedTimeLabel(line.start)} — ${formatSyncedTimeLabel(line.end)}`
                          }
                        </span>
                      </div>
                      <button
                        ref={(element) => registerLineRef(index, element)}
                        type='button'
                        onClick={() => onLineClick(line)}
                        className="w-full text-left"
                      >
                        <p className={`premium-transition leading-tight transition-all duration-300 ${
                          isActive 
                            ? 'text-4xl font-black text-tertiary' 
                            : isLooped 
                            ? 'text-3xl font-extrabold text-primary' 
                            : 'text-2xl font-bold text-on-surface-variant/50 hover:text-on-surface-variant'
                        }`}>
                          {line.text}
                        </p>
                      </button>

                      {/* Expanded Loop Controls - Only for specific line if it's the only one or top of range */}
                      {isSingleLoop && (
                        <div className="mt-2">
                          <LoopRangeSelector
                            duration={parseSyncedTimeToSeconds(line.end) - parseSyncedTimeToSeconds(line.start)}
                            startOffset={loopRange?.startOffset ?? 0}
                            endOffset={loopRange?.endOffset ?? (parseSyncedTimeToSeconds(line.end) - parseSyncedTimeToSeconds(line.start))}
                            onRangeChange={(start, end) => onLoopRangeChange({ startOffset: start, endOffset: end })}
                            onReset={() => onLoopRangeChange(null)}
                            startTimeLabel={formatSecondsLabel(parseSyncedTimeToSeconds(line.start) + (loopRange?.startOffset ?? 0))}
                            endTimeLabel={formatSecondsLabel(parseSyncedTimeToSeconds(line.start) + (loopRange?.endOffset ?? (parseSyncedTimeToSeconds(line.end) - parseSyncedTimeToSeconds(line.start))))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isAutoFollowEnabled && (
          <button
            type='button'
            onClick={onResumeAutoFollow}
            className={`interactive-scale premium-transition fixed bottom-28 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-secondary/35 bg-surface-high/90 text-secondary shadow-glow-secondary backdrop-blur-md hover:bg-surface-high ${
              isSidePanelOpen ? 'right-6 lg:right-[28rem]' : 'right-6'
            }`}
            aria-label='Retomar acompanhamento automático da letra'
            title='Retomar acompanhamento'
          >
            <LocateFixed size={16} />
          </button>
        )}

        <button
          type='button'
          onClick={onBack}
          className={`interactive-scale premium-transition fixed left-6 top-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-high/90 text-on-surface-variant shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md hover:border-secondary/35 hover:text-secondary ${
            isSidePanelOpen ? 'md:left-10' : ''
          }`}
          aria-label='Voltar para a home'
          title='Voltar para a home'
        >
          <ChevronLeft size={18} />
        </button>
      </div>
    </section>
  );
}